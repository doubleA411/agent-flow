from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class SessionCreate(BaseModel):
    title: str | None = None

class SessionRead(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    content: str

class MessageRead(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    agent_type: str | None
    run_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}