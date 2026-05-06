from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AgentCreate(BaseModel):
    name: str
    prompt: str
    provider: str = "ollama"
    model: str = "llama3"

class AgentRead(BaseModel):
    id: UUID
    name: str
    agent_type: str | None
    prompt: str
    provider: str
    model: str
    created_at: datetime

    model_config = {"from_attributes": True}

class AgentUpdate(BaseModel):
    name: str | None = None
    agent_type: str | None = None
    prompt: str | None = None
    provider: str | None = None
    model: str | None = None