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

IMAGE_DB = {
    "salute": {"label": "敬禮", "path": "assets/images/pose/Salute/1.png"},
    "敬禮": {"label": "敬禮", "path": "assets/images/pose/Salute/1.png"},
    "attention": {"label": "立正", "path": "assets/images/pose/Attention/1.png"},
    "立正": {"label": "立正", "path": "assets/images/pose/Attention/1.png"},
    "at ease": {"label": "稍息", "path": "assets/images/pose/At_Ease/1.png"},
    "稍息": {"label": "稍息", "path": "assets/images/pose/At_Ease/1.png"},
    "mark time": {"label": "原地踏步", "path": "assets/images/pose/Mark_Time/1.png"},
    "原地踏步": {"label": "原地踏步", "path": "assets/images/pose/Mark_Time/1.png"},
    "kneel": {"label": "下跪", "path": "assets/images/pose/kneel/1.png"},
    "下跪": {"label": "下跪", "path": "assets/images/pose/kneel/1.png"},
    "reporting": {"label": "報告", "path": "assets/images/pose/Reporting/1.png"},
    "報告": {"label": "報告", "path": "assets/images/pose/Reporting/1.png"},
    "turning": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
    "轉向": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
    "轉彎": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
}


def lookup_image_for_question(question: str):
    if not question:
        return None
    lower_text = question.lower()
    for key, asset in IMAGE_DB.items():
        if key in lower_text:
            return asset
    return None


def build_image_html(image_asset: dict):
    if not image_asset:
        return ""
    return (
        f"<div style='margin-top:0.75rem;'>"
        f"<img src=\"{image_asset['path']}\" alt=\"{image_asset['label']} 示意圖\" "
        f"style=\"max-width:100%;display:block;border-radius:0.75rem;border:1px solid #4b5563;\">"
        f"</div>"
    )


def append_image_to_response(text: str, question: str):
    image_asset = lookup_image_for_question(question)
    if not image_asset:
        return text
    html_block = build_image_html(image_asset)
    return f"{text.strip()}\n\n參考示意圖：{html_block}"


# sym:documents
# Example data can be extended or replaced with real user manuals / system documentation.
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
    陸軍 (Army)
    陸軍的新訓單位最多，主要由各步兵旅及軍團步兵營負責：
    • 陸軍第六軍團 / 第三作戰區（北部地區）
    o 【宜蘭金六結營區】陸軍步兵第153旅
    o 【桃園凌雲崗營區】陸軍第6軍團步兵營
    o 【桃園太平里營區】陸軍步兵第109旅
    o 【大溪龍華營區】陸軍步兵第109旅
    o 【新竹犁頭山營區】陸軍步兵第206旅
    o 【新竹關西營區】陸軍步兵第206旅
    o 【頭份斗煥坪營區】陸軍步兵第206旅
    • 陸軍第十軍團 / 第五作戰區（中部地區）
    o 【臺中成功嶺營區】陸軍步兵第101旅
    o 【臺中成功嶺營區】陸軍步兵第302、104旅
    • 陸軍第八軍團 / 第四作戰區（南部地區）
    o 【嘉義中坑營區】陸軍步兵第257旅
    o 【臺南官田、大內營區】陸軍步兵第203旅
    • 陸軍花東防衛指揮部 / 第二作戰區（東部地區）
    o 【花蓮北埔營區】陸軍花東防衛指揮部步兵營
    海軍與海軍陸戰隊 (Navy & Marines)
    負責海軍艦艇兵與陸戰隊新兵的第一階段訓練：
    • 海軍
    o 【高雄左營營區】海軍新兵訓練中心
    • 海軍陸戰隊
    o 【屏東龍泉營區】海軍陸戰隊新兵訓練中心
    憲兵 (Military Police)
    獨立於各軍種外，負責特種司法警察與軍事警察訓練：
    • 【五股堅貞營區】憲兵訓練中心 
    '''
]
