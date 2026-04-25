from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    role: Optional[int] = None
    date_of_birth: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    entrance_date: Optional[date] = None
    do_have_chronic_medications: Optional[bool] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[int] = None
    date_of_birth: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    entrance_date: Optional[date] = None
    do_have_chronic_medications: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    game_currency: int
    height: Optional[int] = None
    weight: Optional[int] = None
    role: Optional[int] = None
    entrance_date: Optional[date] = None
    do_have_chronic_medications: Optional[bool] = None
    date_of_registration: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ChatRequest(BaseModel):
    question: str

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    source: Optional[str] = None

    class Config:
        from_attributes = True

class TrainingStartResponse(BaseModel):
    session_token: str
    start_time: datetime

class TrainingCompleteRequest(BaseModel):
    session_token: str
    exercise_type: str
    reps: int
    duration_seconds: int
    rep_timestamps: List[int] # milliseconds elapsed since start for each rep

class TrainingCompleteResponse(BaseModel):
    success: bool
    message: str
    record_id: Optional[int] = None
    is_valid: bool
