from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None

class UserResponse(UserBase):
    id: int
    game_currency: int
    date_of_registration: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
