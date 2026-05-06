from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent, Run
from app.models.session import Session as ChatSession, Message
from app.models.task import ScheduledTask
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate
from app.schemas.session import MessageRead
from app.schemas.task import RunTaskRequest, ScheduleTaskRequest, ScheduledTaskRead
from app.auth import get_current_user
from app.agents.definitions import AGENT_DEFINITIONS, ROLE_DEFAULTS
from app.coordinator import build_context_preamble
from app.models.context import OrgContext, Memory
from app.logging_config import log

router = APIRouter()

@router.post("/agents/provision", response_model=list[AgentRead])
def provision_agents(
    role: str = "custom",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent_types = ROLE_DEFAULTS.get(role, ["general"])

    db.query(Agent).filter(Agent.user_id == current_user.id).delete()
    db.commit()

    created = []
    for definition in AGENT_DEFINITIONS:
        if definition["agent_type"] in agent_types:
            agent = Agent(
                user_id=current_user.id,
                name=definition["name"],
                agent_type=definition["agent_type"],
                prompt=definition["prompt"],
                provider="groq",
                model="llama-3.1-8b-instant"
            )
            db.add(agent)
            created.append(agent)

    db.commit()
    for agent in created:
        db.refresh(agent)

    log.info("agents_provisioned", user_id=str(current_user.id), role=role, count=len(created))
    return created

@router.post("/agents", response_model=AgentRead)
def create_agent(
    body: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = Agent(**body.model_dump(), user_id=current_user.id)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.get("/agents", response_model=list[AgentRead])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Agent).filter(Agent.user_id == current_user.id).all()

@router.get("/agents/{agent_id}", response_model=AgentRead)
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.patch("/agents/{agent_id}", response_model=AgentRead)
def update_agent(
    agent_id: str,
    body: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(agent, field, value)

    db.commit()
    db.refresh(agent)
    log.info("agent_updated", agent_id=agent_id, fields=list(updates.keys()))
    return agent

@router.post("/agents/{agent_id}/run-task")
async def run_agent_task(
    agent_id: str,
    body: RunTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run a task directly on a specific agent, bypassing the coordinator."""
    import uuid as uuid_lib

    agent = db.query(Agent).filter(
        Agent.id == agent_id, Agent.user_id == current_user.id
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Reuse existing session or create a new one
    if body.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == body.session_id,
            ChatSession.user_id == current_user.id,
        ).first()
    else:
        session = None

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            title=body.prompt[:60],
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Inject org context + memories into the prompt
    org_ctx = db.query(OrgContext).filter(OrgContext.user_id == current_user.id).first()
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == current_user.id)
        .order_by(Memory.created_at.desc())
        .limit(20)
        .all()
    )
    preamble = build_context_preamble(org_ctx, memories)
    task_prompt = f"{preamble}{body.prompt}" if preamble else body.prompt

    # User message
    user_msg = Message(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=body.prompt,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Run
    run = Run(
        user_id=current_user.id,
        agent_id=agent.id,
        session_id=session.id,
        task_prompt=task_prompt,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Assistant placeholder
    assist_msg = Message(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=f"Running {agent.agent_type or agent.name} agent...",
        agent_type=agent.agent_type,
        run_id=run.id,
    )
    db.add(assist_msg)
    db.commit()
    db.refresh(assist_msg)

    # Queue
    from app.tasks.run_agent import execute_run
    execute_run.delay(
        str(uuid_lib.UUID(str(run.id))),
        task_prompt,
        str(uuid_lib.UUID(str(assist_msg.id))),
    )

    log.info("agent_task_run", agent_id=agent_id, session_id=str(session.id))
    return {
        "session_id": str(session.id),
        "run_id":     str(run.id),
        "messages":   [MessageRead.model_validate(user_msg), MessageRead.model_validate(assist_msg)],
    }


@router.post("/agents/{agent_id}/schedule-task", response_model=ScheduledTaskRead)
def schedule_agent_task(
    agent_id: str,
    body: ScheduleTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a scheduled task for a specific agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id, Agent.user_id == current_user.id
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    task = ScheduledTask(
        user_id=current_user.id,
        agent_id=agent.id,
        prompt=body.prompt,
        schedule_type=body.schedule_type,
        run_at=body.run_at,
        time_of_day=body.time_of_day,
        day_of_week=body.day_of_week,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    log.info("agent_task_scheduled", agent_id=agent_id, schedule=body.schedule_type)
    return task


@router.get("/scheduled-tasks", response_model=list[ScheduledTaskRead])
def list_scheduled_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ScheduledTask)
        .filter(ScheduledTask.user_id == current_user.id)
        .order_by(ScheduledTask.created_at.desc())
        .all()
    )


@router.delete("/scheduled-tasks/{task_id}")
def delete_scheduled_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(ScheduledTask).filter(
        ScheduledTask.id == task_id,
        ScheduledTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"deleted": True}


@router.delete("/agents/{agent_id}")
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()
    return {"deleted": True}