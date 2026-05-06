from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, datetime

class Session(Base):
    __tablename__ = "sessions"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), nullable=False)
    title      = Column(String, nullable=True)  # auto-generated from first message
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    user_id    = Column(UUID(as_uuid=True), nullable=False)
    role       = Column(String, nullable=False)   # "user" | "assistant" | "coordinator"
    content    = Column(Text, nullable=False)
    agent_type = Column(String, nullable=True)    # which agent produced this (if assistant)
    run_id     = Column(UUID(as_uuid=True), nullable=True)  # linked run if any
    created_at = Column(DateTime, default=datetime.datetime.utcnow)