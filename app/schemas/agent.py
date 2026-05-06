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
    prompt: str
    provider: str
    model: str
    created_at: datetime

    model_config = {"from_attributes": True}