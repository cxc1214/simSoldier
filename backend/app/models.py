from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Name
    role = Column(Integer, ForeignKey("roles.id")) # Role ID
    game_currency = Column(Integer, default=0)
    date_of_birth = Column(Date)
    date_of_registration = Column(DateTime(timezone=True), server_default=func.now())
    height = Column(Integer) # Height in cm
    weight = Column(Integer) # Weight in kg
    entrance_date = Column(Date) # Date of entrance to the Real Madrid Academy
    do_have_chronic_medications = Column(Boolean, default=False) # Whether the user has chronic medications
    hashed_password = Column(String)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Role name