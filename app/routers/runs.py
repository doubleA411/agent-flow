from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Run
from app.schemas.run import RunCreate, RunRead
from app.tasks.run_agent import execute_run


router = APIRouter()

@router.post("/agents/{agent_id}/runs", response_model=RunRead)
def create_run(agent_id: str, db: Session = Depends(get_db)):
    run = Run(agent_id=agent_id)
    db.add(run)
    db.commit()
    db.refresh(run)

    execute_run.delay(run.id)

    return run

@router.get("/runs/{run_id}", response_model=RunRead)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/agents/{agent_id}/runs", response_model=list[RunRead])
def list_runs(agent_id: str, db: Session = Depends(get_db)):
    runs = db.query(Run).filter(Run.agent_id == agent_id).all()
    return runs