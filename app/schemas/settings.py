from pydantic import BaseModel
from typing import Optional
import datetime


class UserSettingsUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key:    Optional[str] = None
    groq_api_key:      Optional[str] = None
    ollama_url:        Optional[str] = None


class UserSettingsRead(BaseModel):
    anthropic_api_key: Optional[str]
    openai_api_key:    Optional[str]
    groq_api_key:      Optional[str]
    ollama_url:        Optional[str]
    updated_at:        Optional[datetime.datetime]

    model_config = {"from_attributes": True}
