import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.database import SQLALCHEMY_DATABASE_URL
    print(f"Effective DATABASE_URL: {SQLALCHEMY_DATABASE_URL}")
    
    # Try to connect if possible (we may not have the driver locally, but we can check the URL string)
    if "localhost" in SQLALCHEMY_DATABASE_URL:
        print("SUCCESS: URL fell back to localhost as expected.")
    elif "db" in SQLALCHEMY_DATABASE_URL:
        print("NOTE: Host 'db' was resolvable or socket check bypassed.")
    else:
        print(f"URL: {SQLALCHEMY_DATABASE_URL}")
except Exception as e:
    print(f"Error: {e}")
