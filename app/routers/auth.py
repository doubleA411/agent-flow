from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserRead
from app.auth import hash_password, verify_password, create_token, get_current_user
from app.logging_config import log

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(body: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(str(user.id))
    log.info("user_registered", user_id=str(user.id), email=user.email)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))

@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(user.id))
    log.info("user_logged_in", user_id=str(user.id), email=user.email)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))

@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user