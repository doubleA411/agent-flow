from fastapi import FastAPI
from app.routers import agents

app = FastAPI(title="AgentFlow")
app.include_router(agents.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
