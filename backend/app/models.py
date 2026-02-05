from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Name
    gender = Column(String)
    game_currency = Column(Integer, default=0)
    date_of_birth = Column(Date)
    date_of_registration = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String)
