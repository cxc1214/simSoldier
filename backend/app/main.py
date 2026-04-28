from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from datetime import timedelta
import contextlib
import csv
import os
import uuid
from datetime import datetime

from . import models, schemas, database, auth, chat

# Dependency to check/create items on startup
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    models.Base.metadata.create_all(bind=database.engine)
    
    # Check if we need to seed roles
    db = database.SessionLocal()
    try:
        if db.query(models.Role).count() == 0:
            print("Seeding roles...")
            roles = [
                models.Role(id=1, name="Soldier"),
                models.Role(id=2, name="Commander"),
                models.Role(id=3, name="Officer")
            ]
            db.add_all(roles)
            db.commit()
            print("Roles seeded.")

        # Check if we need to seed a user
        user = db.query(models.User).first()
        if not user:
            print("Seeding initial user...")
            hashed_pwd = auth.get_password_hash("password123")
            new_user = models.User(
                username="testuser",
                role=1,  # Assuming role ID 1 (Soldier) is the default role
                game_currency=1000,
                date_of_birth="2000-01-01",
                weight=70,
                height=175,
                entrance_date="2015-09-01",
                do_have_chronic_medications=False,
                hashed_password=hashed_pwd
            )
            db.add(new_user)
            db.commit()
            print("Initial user 'testuser' created with password 'password123'.")
        
        # Check if we need to seed quiz questions
        if db.query(models.QuizQuestion).count() == 0:
            csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "問題集.csv")
            if os.path.exists(csv_path):
                print(f"Seeding quiz questions from {csv_path}...")
                with open(csv_path, mode='r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    questions = []
                    for row in reader:
                        q = models.QuizQuestion(
                            question=row.get('question', ''),
                            option_a=row.get('option_a', ''),
                            option_b=row.get('option_b', ''),
                            option_c=row.get('option_c', ''),
                            option_d=row.get('option_d', ''),
                            correct_option=row.get('answer', ''),
                            explanation=row.get('explanation', ''),
                            source=row.get('source', '')
                        )
                        questions.append(q)
                    db.add_all(questions)
                    db.commit()
                print(f"Successfully seeded {len(questions)} quiz questions.")
            else:
                print(f"Warning: Quiz CSV file not found at {csv_path}")
    finally:
        db.close()
    
    yield
    # Shutdown logic if any

app = FastAPI(lifespan=lifespan)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/api/register", response_model=schemas.UserResponse)
async def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        role=user.role,  # Default role ID
        date_of_birth=user.date_of_birth,
        height=user.height,
        weight=user.weight,
        entrance_date=user.entrance_date,
        do_have_chronic_medications=user.do_have_chronic_medications,
        hashed_password=hashed_password,
        game_currency=1000  # Initial game currency
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

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
    if user_update.date_of_birth:
        current_user.date_of_birth = user_update.date_of_birth
    if user_update.height:
        current_user.height = user_update.height
    if user_update.weight:
        current_user.weight = user_update.weight
    if user_update.entrance_date:
        current_user.entrance_date = user_update.entrance_date
    if user_update.do_have_chronic_medications is not None:
        current_user.do_have_chronic_medications = user_update.do_have_chronic_medications
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
        
    if user_update.username and user_update.username != current_user.username:
        if db.query(models.User).filter(models.User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="此姓名(帳號)已被使用")
        current_user.username = user_update.username
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/api/logout")
async def logout():
    return {"message": "Successfully logged out. Please unset the token on the client side."}

@app.post("/api/chat")
async def chat_endpoint(request: schemas.ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    return chat.ask_gemini(current_user, request.question)

@app.get("/api/quiz/random", response_model=list[schemas.QuizQuestionResponse])
async def get_random_quiz(limit: int = 5, db: Session = Depends(database.get_db)):
    questions = db.query(models.QuizQuestion).order_by(func.random()).limit(limit).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz questions found in database")
    return questions

# In-memory session store for anti-cheat: { session_token -> start_time }
active_training_sessions = {}

@app.post("/api/training/start", response_model=schemas.TrainingStartResponse)
async def start_training():
    """Generate a one-time session token for anti-cheat validation. No login required."""
    session_token = str(uuid.uuid4())
    now = datetime.now()
    active_training_sessions[session_token] = now
    return {"session_token": session_token, "start_time": now}

@app.post("/api/training/complete", response_model=schemas.TrainingCompleteResponse)
async def complete_training(request: schemas.TrainingCompleteRequest, db: Session = Depends(database.get_db)):
    """Submit training result. Verifies session token & runs anti-cheat telemetry check."""
    # 1. Verify Session
    start_time = active_training_sessions.get(request.session_token)
    if not start_time:
        return {"success": False, "message": "Invalid or expired training session.", "is_valid": False}

    # 2. Anti-Cheat: Sanity Check on rep timestamps
    is_valid = True
    message = "訓練紀錄成功！"

    if request.reps > 0 and request.rep_timestamps:
        if len(request.rep_timestamps) != request.reps:
            is_valid = False
            message = "異常偵測：時間戳數量與次數不符。"
        else:
            for i in range(1, len(request.rep_timestamps)):
                interval = request.rep_timestamps[i] - request.rep_timestamps[i-1]
                if interval < 500:  # < 0.5s per rep is humanly impossible
                    is_valid = False
                    message = "異常偵測：動作速度不符合人體極限。"
                    break

    # Remove session
    active_training_sessions.pop(request.session_token, None)

    # 3. Save to database (user_id is optional)
    record = models.TrainingRecord(
        user_id=None,
        exercise_type=request.exercise_type,
        reps=request.reps,
        duration_seconds=request.duration_seconds,
        is_valid=is_valid
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "success": is_valid,
        "message": message,
        "record_id": record.id,
        "is_valid": is_valid
    }

@app.get("/api/cohort-stats")
async def get_cohort_stats():
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "臺北市徵兵及齡男子兵籍調查概況.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="CSV file not found")
        
    try:
        with open(file_path, "r", encoding="big5") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if not rows:
                raise HTTPException(status_code=404, detail="CSV file is empty")
                
            latest_row = rows[-1]
            
            uni = int(latest_row.get('教育程度大學專科畢業人數', 0)) + int(latest_row.get('教育程度大學專科肄業人數', 0))
            hs = int(latest_row.get('教育程度高中高職畢業人數', 0)) + int(latest_row.get('教育程度高中高職肄業人數', 0))
            ms = int(latest_row.get('教育程度國中畢業人數', 0)) + int(latest_row.get('教育程度國中肄業人數', 0))
            others = int(latest_row.get('教育程度國小以下人數', 0)) + int(latest_row.get('教育程度其他人數', 0))
            
            total = int(latest_row.get('兵籍調查人數', uni + hs + ms + others))
            
            return {
                "year": latest_row.get('年次', '未知'),
                "total": total,
                "data": {
                    "大學專科": uni,
                    "高中職": hs,
                    "國中": ms,
                    "其他": others
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Welcome to SimSoldier Backend"}
