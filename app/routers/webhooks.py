import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException
from app.logging_config import log
from app.config import settings
from app.database import SessionLocal
from app.models.agent import Agent, Run
from app.tasks.run_agent import execute_run

router = APIRouter()

@router.post("/webhooks/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None)
):
    body = await request.body()

    # Verify HMAC signature — proves request came from GitHub
    secret = settings.GITHUB_WEBHOOK_SECRET.encode()
    expected = "sha256=" + hmac.new(secret, body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_hub_signature_256 or ""):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event_action = payload.get("action")

    log.info("webhook_received", action=event_action, triggered=event_action == "opened")

    # Only trigger on PR opened events
    if event_action != "opened":
        return {"received": True, "triggered": False}

    # Find the first available agent to handle this
    db = SessionLocal()
    try:
        agent = db.query(Agent).first()
        if not agent:
            raise HTTPException(status_code=404, detail="No agents configured")

        run = Run(agent_id=agent.id)
        db.add(run)
        db.commit()
        db.refresh(run)

        execute_run.delay(str(run.id))
        return {"received": True, "triggered": True, "run_id": str(run.id)}
    finally:
        db.close()