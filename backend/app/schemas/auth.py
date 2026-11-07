from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole

class UserRegister(BaseModel):
    organisation_name: str
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.ADMIN

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    organisation_id: str
    name: str
    email: str
    role: UserRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True)