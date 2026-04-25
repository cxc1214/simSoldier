import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY not found in environment.")
    exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for model in client.models.list():
        print(f"Model: {model.name}")
        # print(f"  Supported generation methods: {model.supported_generation_methods}")
except Exception as e:
    print(f"Error listing models: {e}")
