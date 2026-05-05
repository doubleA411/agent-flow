from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentRead

router = APIRouter()

@router.post("/agents", response_model=AgentRead)
def create_agent(body: AgentCreate, db: Session = Depends(get_db)):
    agent = Agent(**body.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.get("/agents/{agent_id}", response_model=AgentRead)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/agents", response_model=list[AgentRead])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()