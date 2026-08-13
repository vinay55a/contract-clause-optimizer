"""
Authentication API — Register, Login, Profile endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    colors = ["#2563EB", "#06B6D4", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"]
    import random
    user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        avatar_color=random.choice(colors),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"New user registered: {user.email}")

    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
async def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"User logged in: {user.email}")

    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
async def get_profile(current_user: models.User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.get("/stats")
async def get_user_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get usage statistics for the current user."""
    contract_count = db.query(models.Contract).filter(
        models.Contract.user_id == current_user.id
    ).count()

    analyzed_count = db.query(models.Contract).filter(
        models.Contract.user_id == current_user.id,
        models.Contract.status == "analyzed",
    ).count()

    chat_count = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.id
    ).count()

    return {
        "total_contracts": contract_count,
        "analyzed_contracts": analyzed_count,
        "total_chats": chat_count,
        "member_since": current_user.created_at,
    }
