from pydantic import BaseModel

from app.models.enums import RoleCode


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    full_name: str
    email: str | None
    phone: str | None
    role: RoleCode
    is_active: bool


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
