from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.settings import UserSettingsUpdate, UserSettingsRead
from app.auth import get_current_user
import datetime

router = APIRouter(tags=["settings"])


@router.get("/settings/api-keys", response_model=UserSettingsRead)
def get_api_keys(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not s:
        return UserSettingsRead(
            anthropic_api_key=None, openai_api_key=None,
            groq_api_key=None, ollama_url=None, updated_at=None,
        )
    # Mask keys — only return a hint so the frontend can show "saved" state
    def mask(v: str | None) -> str | None:
        if not v:
            return None
        return v[:8] + "••••••••" + v[-4:]

    return UserSettingsRead(
        anthropic_api_key=mask(s.anthropic_api_key),
        openai_api_key=mask(s.openai_api_key),
        groq_api_key=mask(s.groq_api_key),
        ollama_url=s.ollama_url,
        updated_at=s.updated_at,
    )


@router.put("/settings/api-keys", response_model=UserSettingsRead)
def upsert_api_keys(
    body: UserSettingsUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not s:
        s = UserSettings(user_id=current_user.id)
        db.add(s)

    # Only overwrite a key if a non-empty value was sent
    # Empty string = "clear the key"; None = "don't touch"
    data = body.model_dump()
    for field, val in data.items():
        if val is not None:
            setattr(s, field, val if val != "" else None)

    s.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(s)

    def mask(v: str | None) -> str | None:
        if not v:
            return None
        return v[:8] + "••••••••" + v[-4:]

    return UserSettingsRead(
        anthropic_api_key=mask(s.anthropic_api_key),
        openai_api_key=mask(s.openai_api_key),
        groq_api_key=mask(s.groq_api_key),
        ollama_url=s.ollama_url,
        updated_at=s.updated_at,
    )


def get_user_settings(user_id, db: DBSession) -> UserSettings | None:
    """Used internally by the run task to fetch raw (unmasked) keys."""
    return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
