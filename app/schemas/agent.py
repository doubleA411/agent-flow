from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AgentCreate(BaseModel):
    name: str
    prompt: str

class AgentRead(BaseModel):
    id: UUID
    name: str
    prompt: str
    created_at: datetime

    model_config = {"from_attributes": True}