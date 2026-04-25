from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Handle the case where the backend is running outside Docker but DATABASE_URL points to 'db'
if SQLALCHEMY_DATABASE_URL and "@db/" in SQLALCHEMY_DATABASE_URL:
    import socket
    try:
        # Check if 'db' is resolvable
        socket.gethostbyname("db")
    except socket.gaierror:
        # Fallback to localhost if 'db' is not resolvable (typical for local dev outside docker)
        print("Warning: Host 'db' not found, falling back to localhost for DATABASE_URL")
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("@db/", "@localhost/")

if not SQLALCHEMY_DATABASE_URL:
     # Default to local postgres if not set
     SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost/simsoldier"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

