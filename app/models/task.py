from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, datetime


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), nullable=False)
    agent_id       = Column(UUID(as_uuid=True), nullable=False)
    prompt         = Column(Text, nullable=False)
    schedule_type  = Column(String, nullable=False)   # "once" | "daily" | "weekly"
    run_at         = Column(DateTime, nullable=True)   # for "once"
    time_of_day    = Column(String, nullable=True)     # "HH:MM" for daily/weekly
    day_of_week    = Column(String, nullable=True)     # "monday".."sunday" for weekly
    is_active      = Column(Boolean, default=True)
    last_run_at    = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.datetime.utcnow)
