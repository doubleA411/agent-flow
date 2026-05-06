from sqlalchemy import Column, String, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, enum, datetime

class RunStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed  = "failed"

class Agent(Base):
    __tablename__ = "agents"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String, nullable=False)
    prompt     = Column(Text, nullable=False)
    provider   = Column(String, default="ollama")
    model      = Column(String, default="llama3")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def id_str(self):
        return str(self.id)

class Run(Base):
    __tablename__ = "runs"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id     = Column(UUID(as_uuid=True), nullable=False)
    status       = Column(Enum(RunStatus), default=RunStatus.pending)
    output       = Column(Text, nullable=True)
    callback_url = Column(String, nullable=True)
    created_at   = Column(DateTime, default=datetime.datetime.utcnow)