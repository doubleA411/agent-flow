from fastapi import APIRouter
from app.config import settings
import redis as redis_lib

router = APIRouter(tags=["stats"])

VISITOR_KEY = "agentflow:visitors:total"

def _redis():
    return redis_lib.from_url(settings.REDIS_URL, decode_responses=True)


@router.post("/stats/visit", include_in_schema=False)
def record_visit():
    """Increment visitor counter and return new total."""
    try:
        r = _redis()
        count = r.incr(VISITOR_KEY)
        return {"count": count}
    except Exception:
        return {"count": 0}


@router.get("/stats/visitors")
def get_visitors():
    """Return current visitor count."""
    try:
        r = _redis()
        count = int(r.get(VISITOR_KEY) or 0)
        return {"count": count}
    except Exception:
        return {"count": 0}
