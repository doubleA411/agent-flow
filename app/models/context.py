from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, datetime


class OrgContext(Base):
    __tablename__ = "org_context"
    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), nullable=False, unique=True)
    company_name        = Column(String, nullable=True)
    mission             = Column(Text, nullable=True)
    industry            = Column(String, nullable=True)
    team_size           = Column(String, nullable=True)
    product_description = Column(Text, nullable=True)
    goals               = Column(Text, nullable=True)
    extra               = Column(Text, nullable=True)   # free-form additional context
    is_active           = Column(Boolean, default=True)
    created_at          = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at          = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Memory(Base):
    __tablename__ = "memories"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), nullable=False)
    key        = Column(String, nullable=False)
    value      = Column(Text, nullable=False)
    source     = Column(String, default="manual")   # "auto" | "manual"
    session_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
