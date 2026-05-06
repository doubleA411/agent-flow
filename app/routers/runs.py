from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Run, Agent, RunStatus
from app.models.user import User
from app.schemas.run import RunCreate, RunRead
from app.tasks.run_agent import execute_run
import uuid as uuid_lib
from app.auth import get_current_user


router = APIRouter()

@router.post("/agents/{agent_id}/runs", response_model=RunRead)
def create_run(
    agent_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    run = Run(
    user_id=current_user.id,
    agent_id=agent.id,
    session_id=session_id,
    task_prompt=task_with_context  
)
    db.add(run)
    db.commit()
    db.refresh(run)
    
    clean_id = str(uuid_lib.UUID(str(run.id)))
    execute_run.delay(run.id)

    return run

@router.get("/runs/{run_id}", response_model=RunRead)
def get_run(
    run_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/agents/{agent_id}/runs", response_model=list[RunRead])
def list_runs(
    agent_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    runs = db.query(Run).filter(Run.agent_id == agent_id).all()
    return runs

@router.post("/runs/{run_id}/retry")
def retry_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(Run).filter(
        Run.id == run_id,
        Run.user_id == current_user.id
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Reset status
    run.status = RunStatus.pending
    run.output = None
    db.commit()

    from app.tasks.run_agent import execute_run
    import uuid as uuid_lib
    clean_id = str(uuid_lib.UUID(str(run.id)))

    # Get linked message
    from app.models.session import Message
    msg = db.query(Message).filter(Message.run_id == run.id).first()
    clean_msg_id = str(uuid_lib.UUID(str(msg.id))) if msg else None

    # Use the saved task_prompt — not run.output which is None on failure
    task_prompt = run.task_prompt or "Please help with the user's request."

    execute_run.delay(clean_id, task_prompt, clean_msg_id)
    return {"retried": True, "run_id": clean_id}