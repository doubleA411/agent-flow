from pydantic import BaseModel
from uuid import UUID
from typing import Optional
import datetime


class RunTaskRequest(BaseModel):
    prompt:     str
    session_id: Optional[str] = None   # attach to existing session if provided


class ScheduleTaskRequest(BaseModel):
    prompt:        str
    schedule_type: str                  # "once" | "daily" | "weekly"
    run_at:        Optional[datetime.datetime] = None
    time_of_day:   Optional[str] = None  # "HH:MM"
    day_of_week:   Optional[str] = None  # "monday".."sunday"


class ScheduledTaskRead(BaseModel):
    id:            UUID
    user_id:       UUID
    agent_id:      UUID
    prompt:        str
    schedule_type: str
    run_at:        Optional[datetime.datetime]
    time_of_day:   Optional[str]
    day_of_week:   Optional[str]
    is_active:     bool
    last_run_at:   Optional[datetime.datetime]
    created_at:    datetime.datetime

    model_config = {"from_attributes": True}
