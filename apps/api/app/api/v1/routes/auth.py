from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, UserProfile
from app.services.users import authenticate_user, user_to_profile

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    return LoginResponse(
        access_token=create_access_token(subject=str(user.id), role=user.role.value),
        user=user_to_profile(user),
    )


@router.get("/me", response_model=UserProfile)
def me(current_user: CurrentUser) -> UserProfile:
    return user_to_profile(current_user)
