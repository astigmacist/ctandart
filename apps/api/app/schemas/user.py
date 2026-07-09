from pydantic import BaseModel, Field

from app.models.enums import RoleCode


class UserCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=180)
    email: str | None = Field(default=None, max_length=180)
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    role: RoleCode


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=180)
    email: str | None = Field(default=None, max_length=180)
    phone: str | None = Field(default=None, max_length=32)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: RoleCode | None = None
    is_active: bool | None = None
