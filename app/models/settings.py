from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, datetime


class UserSettings(Base):
    __tablename__ = "user_settings"
    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), nullable=False, unique=True)
    anthropic_api_key = Column(String, nullable=True)
    openai_api_key   = Column(String, nullable=True)
    groq_api_key     = Column(String, nullable=True)
    ollama_url       = Column(String, nullable=True)
    updated_at       = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
