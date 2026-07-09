from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.domain import User
from app.schemas.auth import UserProfile
from app.schemas.user import UserCreateRequest, UserUpdateRequest


def user_to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
    )


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def assert_unique_user_identity(
    db: Session,
    *,
    email: str | None,
    phone: str | None,
    exclude_user_id: object | None = None,
) -> None:
    filters = []
    if email:
        filters.append(User.email == email)
    if phone:
        filters.append(User.phone == phone)
    if not filters:
        return
    query = db.query(User).filter(or_(*filters))
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    if query.first():
        raise ValueError("Пользователь с таким email или телефоном уже существует")


def create_user(db: Session, payload: UserCreateRequest) -> User:
    assert_unique_user_identity(db, email=payload.email, phone=payload.phone)
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def update_user(db: Session, user: User, payload: UserUpdateRequest) -> User:
    assert_unique_user_identity(db, email=payload.email, phone=payload.phone, exclude_user_id=user.id)
    updates = payload.model_dump(exclude_unset=True)
    password = updates.pop("password", None)
    for key, value in updates.items():
        setattr(user, key, value)
    if password:
        user.password_hash = hash_password(password)
    db.flush()
    return user
