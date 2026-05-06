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
    include=["app.tasks.run_agent"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)

@worker_ready.connect
def on_worker_ready(**kwargs):
    from app.logging_config import setup_logging
    setup_logging()