import time
from app.worker import celery_app
from app.database import SessionLocal
from app.models.agent import Run, RunStatus

@celery_app.task(bind=True, max_retries=3)
def execute_run(self, run_id: str):
    db = SessionLocal()
    run = None
    try:
        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            return
        run.status = RunStatus.running
        db.commit()

        # Simulate work — we'll replace this with a real LLM call later
        time.sleep(2)
        result = f"Agent completed run {run_id} successfully"

        run.status = RunStatus.success
        run.output = result
        db.commit()

    except Exception as exc:
        run.status = RunStatus.failed
        db.commit()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()