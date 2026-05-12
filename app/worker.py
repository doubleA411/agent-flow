import os
from celery import Celery
from celery.signals import worker_ready
from app.config import settings

os.makedirs(settings.PROMETHEUS_MULTIPROC_DIR, exist_ok=True)
os.environ["PROMETHEUS_MULTIPROC_DIR"] = settings.PROMETHEUS_MULTIPROC_DIR

celery_app = Celery(
    "agentflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.run_agent", "app.tasks.scheduler"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    beat_schedule={
        "check-scheduled-tasks": {
            "task": "app.tasks.scheduler.check_scheduled_tasks",
            "schedule": 60.0,  # every 60 seconds
        },
    },
    timezone="UTC",
)

@worker_ready.connect
def on_worker_ready(**kwargs):
    from app.logging_config import setup_logging
    setup_logging()