from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import AdminUser
from app.db.session import get_db
from app.models.domain import User
from app.schemas.auth import UserProfile
from app.schemas.user import UserCreateRequest, UserUpdateRequest
from app.services.audit import write_audit_log
from app.services.users import create_user, update_user, user_to_profile

router = APIRouter()


@router.get("", response_model=list[UserProfile])
def list_users(_: AdminUser, db: Session = Depends(get_db)) -> list[UserProfile]:
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [user_to_profile(user) for user in users]


@router.post("", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def create_system_user(
    payload: UserCreateRequest,
    actor: AdminUser,
    db: Session = Depends(get_db),
) -> UserProfile:
    try:
        user = create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from None
    write_audit_log(
        db,
        action="user.create",
        entity_type="user",
        entity_id=user.id,
        actor_id=actor.id,
        new_values={"email": user.email, "role": user.role.value, "is_active": user.is_active},
        reason="Создание учетной записи администратором",
    )
    db.commit()
    db.refresh(user)
    return user_to_profile(user)


@router.patch("/{user_id}", response_model=UserProfile)
def update_system_user(
    user_id: str,
    payload: UserUpdateRequest,
    actor: AdminUser,
    db: Session = Depends(get_db),
) -> UserProfile:
    try:
        parsed_user_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    user = db.get(User, parsed_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    old_values = {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value,
        "is_active": user.is_active,
    }
    try:
        updated = update_user(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from None
    write_audit_log(
        db,
        action="user.update",
        entity_type="user",
        entity_id=updated.id,
        actor_id=actor.id,
        old_values=old_values,
        new_values={
            "full_name": updated.full_name,
            "email": updated.email,
            "phone": updated.phone,
            "role": updated.role.value,
            "is_active": updated.is_active,
        },
        reason="Изменение учетной записи администратором",
    )
    db.commit()
    db.refresh(updated)
    return user_to_profile(updated)
