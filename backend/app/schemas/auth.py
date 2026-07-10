from pydantic import BaseModel, ConfigDict, EmailStr

from ..enums import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)
