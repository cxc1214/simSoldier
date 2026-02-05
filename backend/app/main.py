from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import contextlib

from . import models, schemas, database, auth

# Dependency to check/create items on startup
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    models.Base.metadata.create_all(bind=database.engine)
    
    # Check if we need to seed a user
    db = database.SessionLocal()
    try:
        user = db.query(models.User).first()
        if not user:
            print("Seeding initial user...")
            hashed_pwd = auth.get_password_hash("password123")
            new_user = models.User(
                username="testuser",
                gender="Non-binary",
                game_currency=1000,
                date_of_birth="2000-01-01",
                hashed_password=hashed_pwd
            )
            db.add(new_user)
            db.commit()
            print("Initial user 'testuser' created with password 'password123'.")
    finally:
        db.close()
    
    yield
    # Shutdown logic if any

app = FastAPI(lifespan=lifespan)

@app.post("/api/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/user_info", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/user_edit", response_model=schemas.UserResponse)
async def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if user_update.gender:
        current_user.gender = user_update.gender
    if user_update.date_of_birth:
        current_user.date_of_birth = user_update.date_of_birth
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/api/logout")
async def logout():
    return {"message": "Successfully logged out. Please unset the token on the client side."}

@app.get("/")
def read_root():
    return {"message": "Welcome to SimSoldier Backend"}
