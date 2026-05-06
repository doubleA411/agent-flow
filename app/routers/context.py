from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from app.database import get_db
from app.models.context import OrgContext, Memory
from app.models.agent import Agent
from app.models.user import User
from app.schemas.context import OrgContextUpdate, OrgContextRead, MemoryCreate, MemoryUpdate, MemoryRead
from app.schemas.agent import AgentRead
from app.auth import get_current_user
from app.agents.definitions import AGENT_DEFINITIONS

router = APIRouter(tags=["context"])


# ── Org context ──────────────────────────────────────────────────────────────

@router.get("/org", response_model=OrgContextRead)
def get_org_context(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = db.query(OrgContext).filter(OrgContext.user_id == current_user.id).first()
    if not ctx:
        raise HTTPException(status_code=404, detail="No org context yet")
    return ctx


@router.put("/org", response_model=OrgContextRead)
def upsert_org_context(
    body: OrgContextUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = db.query(OrgContext).filter(OrgContext.user_id == current_user.id).first()
    if not ctx:
        ctx = OrgContext(user_id=current_user.id)
        db.add(ctx)

    for field, val in body.model_dump(exclude_none=True).items():
        setattr(ctx, field, val)

    import datetime
    ctx.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(ctx)
    return ctx


# ── Memories ─────────────────────────────────────────────────────────────────

@router.get("/memories", response_model=list[MemoryRead])
def list_memories(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Memory)
        .filter(Memory.user_id == current_user.id)
        .order_by(Memory.created_at.desc())
        .all()
    )


@router.post("/memories", response_model=MemoryRead)
def create_memory(
    body: MemoryCreate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mem = Memory(
        user_id=current_user.id,
        key=body.key,
        value=body.value,
        source=body.source,
        session_id=body.session_id,
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@router.patch("/memories/{memory_id}", response_model=MemoryRead)
def update_memory(
    memory_id: str,
    body: MemoryUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mem = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(mem, field, val)
    db.commit()
    db.refresh(mem)
    return mem


class ExtractRequest(BaseModel):
    description: str


@router.post("/org/extract")
async def extract_org_context(
    body: ExtractRequest,
    current_user: User = Depends(get_current_user),
):
    """Use the LLM to extract structured org context from a free-text description."""
    from app.llm.router import get_provider
    from app.llm.base import LLMMessage
    import json

    llm = get_provider("groq")
    response = await llm.call(
        messages=[LLMMessage(role="user", content=body.description)],
        model="llama-3.1-8b-instant",
        system_prompt="""Extract company information from the description and return ONLY valid JSON with these keys:
{
  "company_name": "string or null",
  "industry": "string or null",
  "team_size": "string or null",
  "mission": "string or null",
  "product_description": "string or null",
  "goals": "string or null"
}
Return ONLY the JSON object, no other text.""",
    )
    try:
        return json.loads(response.content)
    except Exception:
        return {}


@router.post("/org/deploy-agents", response_model=list[AgentRead])
def deploy_agents(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deploy all agents with default config. Skips any that already exist (idempotent)."""
    existing_types = {
        a.agent_type
        for a in db.query(Agent).filter(Agent.user_id == current_user.id).all()
    }

    for defn in AGENT_DEFINITIONS:
        if defn["agent_type"] in existing_types:
            continue
        db.add(Agent(
            user_id=current_user.id,
            name=defn["name"],
            agent_type=defn["agent_type"],
            prompt=defn["prompt"],
            provider="groq",
            model="llama-3.1-8b-instant",
        ))

    db.commit()
    return db.query(Agent).filter(Agent.user_id == current_user.id).all()


@router.delete("/memories/{memory_id}")
def delete_memory(
    memory_id: str,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mem = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(mem)
    db.commit()
    return {"deleted": True}
