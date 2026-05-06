import os
from app.logging_config import setup_logging
setup_logging()

from app.config import settings

os.environ["PROMETHEUS_MULTIPROC_DIR"] = settings.PROMETHEUS_MULTIPROC_DIR
os.makedirs(settings.PROMETHEUS_MULTIPROC_DIR, exist_ok=True)

import sentry_sdk
from fastapi import FastAPI, Response
from prometheus_client import make_asgi_app, CollectorRegistry, multiprocess, generate_latest, CONTENT_TYPE_LATEST
from app.routers import agents, runs, webhooks
from app.logging_config import log

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.2)

app = FastAPI(title="AgentFlow")

app.include_router(agents.router, prefix="/api/v1")
app.include_router(runs.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")

@app.get("/metrics")
def metrics():
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    data = generate_latest(registry)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
def health():
    log.info("health_check")
    return {"status": "ok"}