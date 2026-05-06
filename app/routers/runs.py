from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Run
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
    run = Run(agent_id=agent_id, user_id=current_user.id)
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