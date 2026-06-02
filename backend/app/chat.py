from google import genai
import chromadb
import os
from dotenv import load_dotenv

load_dotenv()
from .database import SessionLocal
from .models import QuizQuestion
from .chat_config import append_image_to_response, documents, prompt_template, lookup_image_for_question

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

# Setup local vector database
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="my_knowledge_base")


def init_knowledge_base():
    """
    Initialize the knowledge base with embeddings.
    Only seeds if the collection is currently empty to save API quota.
    """
    if not client:
        return

    try:
        # Check if already seeded (Chroma in-memory persists for the life of the process)
        if collection.count() > 0:
            return

        print("Seeding knowledge base...")
        for i, text in enumerate(documents):
            result = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=text
            )
            collection.add(
                ids=[str(i)],
                embeddings=[result.embeddings[0].values],
                documents=[text]
            )
        # Also seed quiz questions from the database (if available)
        try:
            db = SessionLocal()
            quiz_items = db.query(QuizQuestion).all()
            for q in quiz_items:
                # Build a single text blob containing question, options and explanation
                q_text = f"{q.question}\nA: {q.option_a}\nB: {q.option_b}\nC: {q.option_c}\nD: {q.option_d}"
                if q.explanation:
                    q_text += f"\nExplanation: {q.explanation}"

                embed_res = client.models.embed_content(
                    model="models/gemini-embedding-001",
                    contents=q_text
                )
                collection.add(
                    ids=[f"quiz_{q.id}"],
                    embeddings=[embed_res.embeddings[0].values],
                    documents=[q_text]
                )
        except Exception as e:
            print(f"Failed to seed quiz questions from DB: {e}")
        finally:
            try:
                db.close()
            except:
                pass
        print("Knowledge base seeded successfully.")
    except Exception as e:
        print(f"Failed to generate/store embeddings: {e}")

# Run initialization once at module load
init_knowledge_base()

def ask_gemini(user_info:dict,question: str):
    if not client:
        return "Chat service is currently unavailable (API Key missing or invalid)."

    try:
        # 1. Embed the question
        result = client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=question
        )
        
        # 2. Search for similar documents
        results = collection.query(
            query_embeddings=[result.embeddings[0].values],
            n_results=2
        )
        
        # 3. Build context from search results
        if results['documents']:
             context = "\n".join(results['documents'][0])
        else:
             context = ""
        
        # 4. Ask Gemini with the context
        prompt = prompt_template.format(context=context, user_info=user_info, question=question)
        
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )
        
        cleaned_text = response.text.replace("**", "").replace("*", "").replace("##", "")
        # Debug: log whether an image asset is found for the incoming question
        try:
            lookup_res = lookup_image_for_question(question)
        except Exception as e:
            lookup_res = f"ERROR: {e}"
        print(f"DEBUG: lookup for question='{question}' -> {lookup_res}")
        return append_image_to_response(cleaned_text, question)
    
    except Exception as e:
        error_msg = str(e)
        print(f"Error during chat: {error_msg}")
        
        # Specific help for API Quota issues
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return "【系統提示】教官現在太累了 (API 額度已達上限)。請稍等 1 分鐘後再試，或檢查您的 API Key 配額設定。"
            
        return f"I'm sorry, I'm having trouble connecting to my brain right now. Error: {error_msg}"

# Test
if __name__ == "__main__":
    print(ask_gemini({}, "How many days of PTO do employees get?"))