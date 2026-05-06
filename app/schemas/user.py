from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead