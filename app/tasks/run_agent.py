import time
import httpx
from app.worker import celery_app
from app.database import SessionLocal
from app.models.agent import Run, RunStatus
from app.logging_config import log
from app.metrics import run_counter, run_duration, queue_depth

@celery_app.task(bind=True, max_retries=3)
def execute_run(self, run_id: str):
    db = SessionLocal()
    run = None
    start = time.time()

    try:
        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            log.warn("run_not_found", run_id=run_id)
            return

        log.info("run_started", run_id=run_id, agent_id=str(run.agent_id))

        run.status = RunStatus.running
        db.commit()

        # Update queue depth metric
        pending_count = db.query(Run).filter(Run.status == RunStatus.pending).count()
        queue_depth.set(pending_count)

        time.sleep(2)
        result = f"Agent completed run {run_id} successfully"

        run.status = RunStatus.success
        run.output = result
        db.commit()

        duration = time.time() - start
        run_duration.observe(duration)
        run_counter.labels(status="success").inc()

        log.info("run_succeeded", run_id=run_id, duration_seconds=round(duration, 2))

        if run.callback_url:
            try:
                httpx.post(run.callback_url, json={
                    "run_id": run_id,
                    "status": "success",
                    "output": result,
                }, timeout=10.0)
            except Exception:
                log.warn("callback_failed", run_id=run_id, url=run.callback_url)

    except Exception as exc:
        duration = time.time() - start
        run_counter.labels(status="failed").inc()

        log.error("run_failed", run_id=run_id, error=str(exc), duration_seconds=round(duration, 2))

        if run:
            run.status = RunStatus.failed
            db.commit()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()