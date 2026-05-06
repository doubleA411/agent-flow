from pydantic import BaseModel
from typing import Optional
from uuid import UUID
import datetime


class OrgContextUpdate(BaseModel):
    company_name:        Optional[str] = None
    mission:             Optional[str] = None
    industry:            Optional[str] = None
    team_size:           Optional[str] = None
    product_description: Optional[str] = None
    goals:               Optional[str] = None
    extra:               Optional[str] = None
    is_active:           Optional[bool] = None


class OrgContextRead(BaseModel):
    id:                  UUID
    user_id:             UUID
    company_name:        Optional[str]
    mission:             Optional[str]
    industry:            Optional[str]
    team_size:           Optional[str]
    product_description: Optional[str]
    goals:               Optional[str]
    extra:               Optional[str]
    is_active:           bool
    created_at:          datetime.datetime
    updated_at:          datetime.datetime

    model_config = {"from_attributes": True}


class MemoryCreate(BaseModel):
    key:        str
    value:      str
    source:     str = "manual"
    session_id: Optional[str] = None


class MemoryUpdate(BaseModel):
    key:   Optional[str] = None
    value: Optional[str] = None


class MemoryRead(BaseModel):
    id:         UUID
    user_id:    UUID
    key:        str
    value:      str
    source:     str
    session_id: Optional[UUID]
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
