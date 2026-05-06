import uuid as uuid_lib
import httpx
from app.worker import celery_app
from app.database import SessionLocal
from app.models.agent import Run, RunStatus, Agent
from app.logging_config import setup_logging, log
from app.metrics import run_counter, run_duration, queue_depth
from app.llm.router import get_provider
from app.llm.base import LLMMessage
import time

setup_logging()

def broadcast_sync(run_id: str, data: dict):
    try:
        res = httpx.post(
            f"http://localhost:8000/api/v1/internal/broadcast/{run_id}",
            json=data,
            timeout=3.0
        )
        log.info("broadcast_sent", run_id=run_id, status=data["status"], response=res.status_code)
    except Exception as e:
        log.warn("broadcast_failed", run_id=run_id, error=str(e))

@celery_app.task(bind=True, max_retries=3)
def execute_run(self, run_id: str):
    run_id = str(uuid_lib.UUID(str(run_id)))
    db = SessionLocal()
    run = None
    start = time.time()

    try:
        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            log.warn("run_not_found", run_id=run_id)
            return

        agent = db.query(Agent).filter(Agent.id == run.agent_id).first()
        if not agent:
            log.warn("agent_not_found", run_id=run_id)
            return

        log.info("run_started", run_id=run_id, agent_id=str(run.agent_id),
                 provider=agent.provider, model=agent.model)

        run.status = RunStatus.running
        db.commit()
        broadcast_sync(run_id, {"status": "running", "output": None})

        pending_count = db.query(Run).filter(Run.status == RunStatus.pending).count()
        queue_depth.set(pending_count)

        # Real LLM call
        provider = get_provider(agent.provider)
        import asyncio
        response = asyncio.run(provider.call(
            messages=[LLMMessage(role="user", content=agent.prompt)],
            model=agent.model,
        ))

        run.status = RunStatus.success
        run.output = response.content
        db.commit()

        duration = time.time() - start
        run_duration.observe(duration)
        run_counter.labels(status="success").inc()

        log.info("run_succeeded",
                 run_id=run_id,
                 provider=agent.provider,
                 model=agent.model,
                 input_tokens=response.input_tokens,
                 output_tokens=response.output_tokens,
                 duration_seconds=round(duration, 2))

        broadcast_sync(run_id, {"status": "success", "output": response.content})

        if run.callback_url:
            try:
                httpx.post(run.callback_url, json={
                    "run_id": run_id,
                    "status": "success",
                    "output": response.content,
                }, timeout=10.0)
            except Exception:
                log.warn("callback_failed", run_id=run_id)

    except Exception as exc:
        duration = time.time() - start
        run_counter.labels(status="failed").inc()
        log.error("run_failed", run_id=run_id, error=str(exc),
                  duration_seconds=round(duration, 2))
        if run:
            run.status = RunStatus.failed
            db.commit()
            broadcast_sync(run_id, {"status": "failed", "output": str(exc)})
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()