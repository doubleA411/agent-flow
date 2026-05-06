import uuid as uuid_lib
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.session import Session, Message
from app.models.agent import Agent, Run
from app.models.user import User
from app.schemas.session import SessionCreate, SessionRead, MessageCreate, MessageRead
from app.auth import get_current_user
from app.coordinator import coordinate
from app.logging_config import log

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/", response_model=SessionRead)
def create_session(
    body: SessionCreate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = Session(user_id=current_user.id, title=body.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/", response_model=list[SessionRead])
def list_sessions(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Session).filter(
        Session.user_id == current_user.id
    ).order_by(Session.updated_at.desc()).all()

@router.get("/{session_id}", response_model=SessionRead)
def get_session(
    session_id: str,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/{session_id}/messages", response_model=list[MessageRead])
def get_messages(
    session_id: str,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()

@router.post("/{session_id}/messages", response_model=list[MessageRead])
async def send_message(
    session_id: str,
    body: MessageCreate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify session belongs to user
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = Message(
        session_id=session_id,
        user_id=current_user.id,
        role="user",
        content=body.content
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Auto-generate session title from first message
    if not session.title:
        session.title = body.content[:60]
        db.commit()

    # Get conversation history for coordinator context
    history = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()
    history_dicts = [{"role": m.role, "content": m.content} for m in history]

    # Coordinate — decide which agents to call
    log.info("coordinating", session_id=session_id, message=body.content[:50])
    plan = await coordinate(
        user_message=body.content,
        history=history_dicts[:-1],  # exclude the message we just added
        provider="groq",
        model="llama-3.1-8b-instant"
    )
    log.info("coordinator_plan", session_id=session_id, plan=plan)

    # Save coordinator plan as a message for visibility
    coord_msg = Message(
        session_id=session_id,
        user_id=current_user.id,
        role="coordinator",
        content=f"Routing to: {', '.join(p['agent'] for p in plan)}"
    )
    db.add(coord_msg)
    db.commit()

    # Fire all agent runs in parallel
    created_messages = [user_msg, coord_msg]

    for task in plan:
        agent_type = task.get("agent", "research")
        task_description = task.get("task", body.content)

        # Find agent matching the type, fall back to first available
        agent = db.query(Agent).filter(
            Agent.user_id == current_user.id,
            Agent.name.ilike(f"%{agent_type}%")
        ).first() or db.query(Agent).filter(
            Agent.user_id == current_user.id
        ).first()

        if not agent:
            log.warn("no_agent_found", agent_type=agent_type)
            continue

        # Create run linked to this session
        run = Run(
            user_id=current_user.id,
            agent_id=agent.id,
            session_id=session_id,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Save placeholder assistant message
        assist_msg = Message(
            session_id=session_id,
            user_id=current_user.id,
            role="assistant",
            content=f"Running {agent_type} agent...",
            agent_type=agent_type,
            run_id=run.id
        )
        db.add(assist_msg)
        db.commit()
        db.refresh(assist_msg)
        created_messages.append(assist_msg)

        # Fire Celery task — passes task description as the prompt override
        from app.tasks.run_agent import execute_run
        clean_run_id = str(uuid_lib.UUID(str(run.id)))
        clean_msg_id = str(uuid_lib.UUID(str(assist_msg.id)))
        execute_run.delay(clean_run_id, task_description, clean_msg_id)

    return created_messages