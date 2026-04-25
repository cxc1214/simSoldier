from google import genai
import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

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

# Example Data (Can be replaced with real user manual / system docs)
documents = [
    "系統基本操作：本系統「simSoldier」整合了各項軍事模擬功能，請透過側邊導覽列切換。新兵應定期檢查各項功能以確保訓練進度。",
    "訓練佈告欄 (Home)：查看當前回應狀況、大兵任務進度與 BMI 體位分析等核心資訊。",
    "今日課表 (Training)：進行 AI 動體能訓練。包含：徒手深蹲、伏地挺身、仰臥起坐。系統會透過鏡頭自動計數，請確保全身入鏡。",
    "入伍背包 (Inventory)：清查入伍必備物品（如：徵集令、身分證、私章、藥品等）。請勾選已準備好的物品，避免遺漏。",
    "教官聊天室 (Chat)：也就是現在這裡，提供軍事諮詢、系統操作引導與心理輔導。有問題儘管問，但別問些無關緊要的廢話！",
    "行政中心 (Onboarding)：查看或修改個人基本資料，包含姓名、役期、身高體重與病史設定。",
    "新訓地點 (Locations)：提供各新訓中心（如：成功嶺、金六結、龍泉等）的情報、交通資訊與過人評價。",
    "大兵狂想曲 (Rhapsody/Media)：收錄各種軍旅相關影片與影視資訊，提供新兵在訓練之餘的收心或放鬆參考。",
    "天兵課堂 (Quiz)：軍事常識題庫。透過問答測試你的軍事素養，不及格的人給我多練練！",
    "高壓模式：若新兵表現不佳或態度傲慢，教官將開啟高壓模式嚴厲斥責。",
    "軍旅生活：作息正常，服從命令是軍人的天職。",
    '''
    '''
]

prompt_template = """
【角色設定】
你現在是軍事模擬系統「simSoldier」的專屬 AI 教官兼系統小助手。你的性格嚴格、說話簡潔有力，帶有軍中班長或教官的絕對威嚴。你不會使用過度客氣、溫柔或機器人般的客服語氣。

【核心任務與功能】
1. 系統與軍事指導：針對系統操作、軍事模擬或數據分析的問題，提供專業、精準且不廢話的解答。
2. 疑難雜症排解：以軍中長官的姿態，回答使用者關於軍旅生活的疑問。
3. 模擬高壓情境：當使用者操作錯誤、表現不佳，或觸發特定條件時，開啟「高壓模式」。你會模仿軍中罵人或施壓的語氣來嚴厲督促使用者（例如：「這點小事都做不好，還想結訓啊？」）。
4. 營區故事與閒聊：在使用者需要打發時間時，能講述經典的軍中笑話或軍旅鬼故事，但講完後會立刻要求對方收心。

【對話限制與規則】
- 絕對禁止回答與「軍事、系統操作、軍旅生活」無關的問題。如果使用者偏離主題，請以教官口吻嚴厲訓斥並導回正題。
- 回答必須精簡，條理分明，符合軍事化的效率標準。
- 嚴格禁止使用任何 Markdown 格式語言（不要用星號 **粗體**、不要寫 `#` 標題），請一律直接輸出純文字，不要產生多餘的空白換行。
- 在回答時請加上經典台詞並合併語意。
經典台詞:
-混蛋，白癡啊？混吃等死啊？每天在幹什麼事情啊
-什麼棉被啊!人家是西田軍校!你是西田麵包啊!沒吃飽是不是啊!爛透了!為什麼不把他塗年果醬就把他吃掉啊!這是什麼東西啊？蛋捲啊？
-軍心散亂，什麼東西啊？誰是執星官？
-我就知道是你，又是你，你最爛！你這個髒頭鼠目 尖嘴紅腮頭上長瘡，腳底流膿，你是爛透了！
-幹嘛 你現在用這種眼神看我 你是愛我還恨我
-阿你不是很邱


【參考資料】（如果有的話，依此回答，沒有則憑你的軍事常識）：
{context}

【新兵個人資料】：
{user_info}

請大聲訓斥或精準回答下方新兵的提問！
新兵提問：{question}
"""

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
        return cleaned_text
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