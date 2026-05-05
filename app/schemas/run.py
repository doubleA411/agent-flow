from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class RunCreate(BaseModel):
    agent_id: UUID

class RunRead(BaseModel):
    id: UUID
    agent_id: UUID
    status: str
    output: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}