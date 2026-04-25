/**
 * SIMSOLDIER FEATURES
 * 包含：背包、聊天室、課表、影片、說明文件、日曆、倒數
 */

import { state } from './state.js';
import { dom } from './ui.js';
import { api } from './api.js';

// --- Constants ---
const INSTRUCTOR_RESPONSES = [
    "大聲點！我聽不見！", "懷疑啊？", "你這個兵怎麼當的？", "不要給我嬉皮笑臉！",
    "洗澡只有三分鐘，還在這邊跟我聊天？", "注意禮節！", "是不是想洞八？",
    "公差出列！", "還有時間滑手機？", "棉被折好了沒？"
];

const DOCS_DATA = {
    units: {
        title: "全國役政單位資料",
        content: "TABLE_PLACEHOLDER", // Will be init
        link: null
    },
    recheck: {
        title: "體位複檢標準表",
        content: "若您對體檢結果有疑義（如BMI過高/過低、視力問題、扁平足等），可申請複檢。<br><br>請參考下方標準圖表或是點擊連結查看詳細法規。<br><br><img src='docs/體位區分標準圖.png' class='w-full rounded mt-4 border border-stone-600' alt='體位區分標準圖'>",
        link: "https://dca.moi.gov.tw/PhysicalStatus/"
    },
    contact: {
        title: "各縣市役政單位通訊錄",
        content: "若您有兵單遺失、徵集日期查詢、抵免役期辦理等問題，請直接聯繫戶籍地公所兵役科。<br><br>詳細電話與地址請點擊下方連結至內政部役政司網站查詢。",
        link: "https://dca.moi.gov.tw/chaspx/news.aspx?web=225"
    },
    rights: {
        title: "軍人權益懶人包",
        content: "包含薪資福利、喪葬補助、軍保醫療、以及申訴管道 (1985) 之完整說明。<br><br>當兵不是坐牢，保障自身權益是您的義務。若遇不當管教或權益受損，請利用申訴管道。",
        link: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=F0030049"
    }
};

// --- Inventory ---
export function renderInventory() {
    dom.inventoryListRequired.innerHTML = '';
    dom.inventoryListOptional.innerHTML = '';

    state.backpack.forEach(item => {
        const div = document.createElement('div');
        div.className = `p-4 rounded-lg border cursor-pointer transition-all hover:bg-stone-700 flex justify-between items-center group ${item.acquired ? 'bg-green-900/20 border-green-700' : 'bg-stone-800 border-stone-700'}`;
        div.onclick = () => toggleItem(item.id);

        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${item.acquired ? 'bg-green-500 border-green-500' : 'border-stone-500'}">
                    ${item.acquired ? '<i class="fa-solid fa-check text-white text-xs"></i>' : ''}
                </div>
                <div>
                    <div class="font-bold border-stone-200 ${item.acquired ? 'text-green-400 line-through decoration-green-500/50' : 'text-stone-200'}">${item.name}</div>
                    ${item.note ? `<div class="text-xs text-stone-500">${item.note}</div>` : ''}
                </div>
            </div>
            ${item.required ? '<span class="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">必備</span>' : ''}
        `;

        if (item.required) {
            dom.inventoryListRequired.appendChild(div);
        } else {
            dom.inventoryListOptional.appendChild(div);
        }
    });
}

function toggleItem(id) {
    const item = state.backpack.find(i => i.id === id);
    if (item) {
        item.acquired = !item.acquired;
        renderInventory();
    }
}

// --- Chat ---
export async function handleChatSubmit(e) {
    e.preventDefault();
    const text = dom.chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    dom.chatInput.value = '';

    // Add "typing" indicator
    const typingId = 'typing-' + Date.now();
    addTypingIndicator(typingId);

    try {
        const response = await api.askSimSoldier(text);
        removeTypingIndicator(typingId);
        addMessage(response, 'bot');
    } catch (e) {
        removeTypingIndicator(typingId);
        addMessage('班長現在不在營區，請稍後再試。', 'bot');
    }
}

function addTypingIndicator(id) {
    const div = document.createElement('div');
    div.id = id;
    div.className = `flex justify-start items-start gap-2 mb-3 animate-fade-in`;
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-stone-700 flex-shrink-0 border border-green-600 overflow-hidden">
            <img src="assets/images/instructor/instructor_avatar.png" class="w-full h-full object-cover">
        </div>
        <div class="px-3 py-2 rounded-xl bg-stone-700 text-stone-200 rounded-bl-none flex gap-1 items-center shadow-md">
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style="animation-delay: 0.2s"></span>
        </div>
    `;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    const isUser = sender === 'user';
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2 mb-4 animate-fade-in`;

    const contentClass = isUser
        ? "bg-green-700 text-white rounded-br-none"
        : "bg-stone-700 text-stone-200 rounded-bl-none";

    const avatar = isUser
        ? `<div class="w-8 h-8 rounded-full bg-green-800 flex-shrink-0 border border-green-600 flex items-center justify-center text-[14px] text-white overflow-hidden order-2 shadow-sm">
            <i class="fa-solid fa-user w-4 h-4 flex items-center justify-center"></i>
           </div>`
        : `<div class="w-8 h-8 rounded-full bg-stone-800 flex-shrink-0 border border-green-600 overflow-hidden order-1 shadow-sm">
            <img src="assets/images/instructor/instructor_avatar.png" class="w-full h-full object-cover">
           </div>`;

    div.innerHTML = `
        ${avatar}
        <div class="max-w-[85%] md:max-w-[50%] px-4 py-2 rounded-xl text-sm md:text-base shadow-md ${contentClass} whitespace-pre-wrap leading-snug ${isUser ? 'order-1 mr-1' : 'order-2 ml-1'}">
            ${text.replace(/\n{3,}/g, '\n\n').trim()}
        </div>
    `;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

export function initChatGreeting() {
    dom.chatMessages.innerHTML = '';

    if (!state.userData || !state.serviceStatus) {
        addMessage("注意！有什麼問題現在問，不要進去才在那邊什麼都不知道！", 'bot');
        return;
    }

    const name = state.userData.name || "菜鳥";
    const statusType = state.serviceStatus.type || "";

    let greeting = "";
    if (statusType.includes("免役")) {
        greeting = `注意！${name}，聽說你免役了是不是？那還來戰情中心幹嘛？不想去玩沙就來練習問答！`;
    } else if (statusType.includes("替代役")) {
        greeting = `注意！${name}，${statusType}也是要好好表現的，不要給我丟臉！有什麼問題現在提早問！`;
    } else {
        if (!state.userData.date) {
            greeting = `注意！${name}，連入伍日期都還沒去設定，皮在癢是不是？遇到什麼不懂的趕緊發問！`;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(state.userData.date);
            targetDate.setHours(0, 0, 0, 0);

            const dischargeDate = new Date(targetDate);
            dischargeDate.setMonth(dischargeDate.getMonth() + 4);

            if (today >= dischargeDate) {
                greeting = `注意！${name}，你都退伍了還回來幹嘛？想重新簽志願役是不是？！`;
            } else if (today >= targetDate) {
                greeting = `注意！${name}，你已經入營了！怎麼還有手機可以滑？長官在哪裡？！`;
            } else {
                const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                greeting = `注意！${name}，距離你入營只剩 ${diffDays} 天！東西準備好了沒？有問題快問！`;
            }
        }
    }

    addMessage(greeting, 'bot');
}


// --- Training ---
export function toggleTrainingDay(dayId, cardElement, btnElement) {
    const isCompleted = state.training.completed.includes(dayId);

    if (isCompleted) {
        state.training.completed = state.training.completed.filter(id => id !== dayId);
        cardElement.classList.remove('border-green-500', 'bg-green-900/20');
        cardElement.classList.add('border-l-4', 'border-stone-600');
        if (btnElement) {
            btnElement.className = "btn-confirm-training text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1";
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> 確認';
        }
    } else {
        state.training.completed.push(dayId);
        cardElement.classList.remove('border-stone-600');
        cardElement.classList.add('border-green-500', 'bg-green-900/20');
        if (btnElement) {
            btnElement.className = "btn-confirm-training text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1";
            btnElement.innerHTML = '<i class="fa-solid fa-xmark"></i> 取消';
        }

        // Confetti effect (using global confetti lib)
        if (window.confetti) {
            confetti({
                particleCount: 30, spread: 50,
                origin: {
                    x: btnElement ? btnElement.getBoundingClientRect().left / window.innerWidth : 0.5,
                    y: btnElement ? btnElement.getBoundingClientRect().top / window.innerHeight : 0.5
                },
                colors: ['#22c55e', '#ffffff']
            });
        }
    }
    updateTrainingProgress();
    updateDailyTaskProgress();
}

function updateTrainingProgress() {
    const totalDays = 5;
    const completedCount = state.training.completed.length;
    const percent = Math.round((completedCount / totalDays) * 100);

    dom.trainingProgressBar.style.width = `${percent}%`;
    dom.trainingProgressText.textContent = `${percent}%`;

    if (percent === 100) dom.trainingProgressBar.classList.add('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
    else dom.trainingProgressBar.classList.remove('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
}

// --- Daily Tasks ---
export function updateDailyTaskProgress() {
    const totalCheckboxes = dom.taskCheckboxes.length;
    const trainingTaskWeight = 1;
    const total = totalCheckboxes + trainingTaskWeight;

    let checked = 0;
    dom.taskCheckboxes.forEach(cb => { if (cb.checked) checked++; });
    if (state.training.completed.length > 0) checked += trainingTaskWeight;

    const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

    dom.dailyTaskBar.style.width = `${percent}%`;
    dom.dailyTaskPercent.textContent = `${percent}%`;

    if (percent === 100) dom.dailyTaskBar.classList.add('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
    else dom.dailyTaskBar.classList.remove('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
}

// --- Docs ---
const unitsData = [
    { name: "新北市政府民政局", phone: "02-29603456", fax: "02-29693894", addr: "新北市板橋區中山路1段161號11、14樓", url: "http://www.ca.ntpc.gov.tw/" },
    { name: "臺北市政府兵役局", phone: "02-23654361", fax: "02-23673072", addr: "臺北市中正區羅斯福路四段92號9樓", url: "http://www.tcdms.taipei.gov.tw/" },
    { name: "臺中市政府民政局", phone: "04-22289111", fax: "04-22202480", addr: "臺中市臺中港路2段89號6樓", url: "http://www.civil.taichung.gov.tw/" },
    { name: "臺南市政府民政局", phone: "06-2991111", fax: "06-2982560", addr: "臺南市安平區永華路2段6號", url: "http://www.tainan.gov.tw/agr/default.asp" },
    { name: "高雄市政府兵役局", phone: "07-3373582", fax: "07-3312241", addr: "高雄市苓雅區四維3路2號4樓", url: "http://mildp.kcg.gov.tw/index.php" }
    // Truncated for brevity but can add more
];

function initDocsTable() {
    let tableHtml = '<div class="overflow-x-auto"><table class="w-full text-left text-xs text-stone-300 border-collapse min-w-[500px]">';
    tableHtml += '<thead><tr class="bg-stone-800 text-stone-400 border-b border-stone-700"><th class="p-2">單位</th><th class="p-2">電話</th><th class="p-2">傳真</th><th class="p-2">地址</th><th class="p-2">網址</th></tr></thead><tbody>';

    unitsData.forEach(u => {
        tableHtml += `<tr class="border-b border-stone-800 hover:bg-stone-800/50">
            <td class="p-2 text-green-400 font-bold">${u.name}</td>
            <td class="p-2">${u.phone}</td>
            <td class="p-2 opacity-60 text-[10px] hidden md:table-cell">${u.fax}</td>
            <td class="p-2">${u.addr}</td>
            <td class="p-2"><a href="${u.url}" target="_blank" class="text-blue-400 hover:text-blue-300"><i class="fa-solid fa-link"></i></a></td>
        </tr>`;
    });
    tableHtml += '</tbody></table></div>';
    DOCS_DATA.units.content = tableHtml;
}
// Init the table logic
initDocsTable();

export function openDocsModal(type) {
    const data = DOCS_DATA[type];
    if (!data) return;

    dom.docsModalTitle.textContent = data.title;
    dom.docsModalContent.innerHTML = data.content;

    if (data.link) {
        dom.docsModalLink.href = data.link;
        dom.docsModalLink.classList.remove('hidden');
    } else {
        dom.docsModalLink.classList.add('hidden');
    }
    dom.modalDocs.classList.remove('hidden');
}

// --- Video ---
export function playVideo(data) {
    dom.playerTag.textContent = data.tag;
    dom.playerTag.className = `px-3 py-1 rounded text-sm mb-3 inline-block backdrop-blur-md text-white ${data.color}`;
    dom.playerTitle.textContent = data.title;
    dom.playerDesc.textContent = data.desc;

    dom.videoPlayer.classList.remove('hidden');
    dom.videoGallery.classList.add('hidden');
    dom.btnCloseVideo.classList.add('hidden');
}

export function closeVideo() {
    dom.videoPlayer.classList.add('hidden');
    dom.videoGallery.classList.remove('hidden');
    dom.btnCloseVideo.classList.remove('hidden');
}

// --- Calendar ---
export function renderCalendar() {
    if (!state.userData || !state.userData.date) return;

    const today = new Date();
    const targetDate = new Date(state.userData.date);
    const year = today.getFullYear();
    const month = today.getMonth();

    dom.calendarMonthYear.textContent = `${year} / ${(month + 1).toString().padStart(2, '0')}`;
    dom.calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        dom.calendarGrid.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.textContent = d;
        div.className = 'calendar-day';
        if (d === today.getDate() && month === today.getMonth()) div.classList.add('bg-green-500', 'text-white', 'rounded-full', 'font-bold');
        if (d === targetDate.getDate() && month === targetDate.getMonth()) div.classList.add('bg-red-600', 'text-white', 'rounded-full', 'font-bold');
        dom.calendarGrid.appendChild(div);
    }
}

// --- Countdown ---
export function updateCountdown() {
    if (!state.userData || !state.userData.date) return;
    const today = new Date();
    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);

    const enlistmentDate = new Date(state.userData.date);
    enlistmentDate.setHours(0, 0, 0, 0);

    let targetDate = enlistmentDate;
    let isDischargeCountdown = false;

    // Check if enlistment date has passed or is today
    if (today > enlistmentDate) {
        // Switch to Discharge Countdown
        isDischargeCountdown = true;
        // Calculate Discharge Date (Enlistment + 4 months)
        // Note: Actual service time might vary, assuming regular 4 months here
        const dischargeDate = new Date(enlistmentDate);
        dischargeDate.setMonth(dischargeDate.getMonth() + 4);
        targetDate = dischargeDate;
    }

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Fake Countdown Override (Only applies if not in discharge mode and tempCountdown is active)
    const displayDays = (state.userData.tempCountdown && !isDischargeCountdown) ? 30 : Math.max(0, diffDays);

    dom.daysLeftCount.textContent = displayDays;

    if (isDischargeCountdown) {
        dom.countdownTitle.textContent = diffDays <= 0 ? "已退伍" : "離營倒數";
    } else {
        dom.countdownTitle.textContent = diffDays <= 0 && !state.userData.tempCountdown ? "入營日" : "距離入營";
    }

    // Chart Logic
    const maxDays = isDischargeCountdown ? 120 : 365; // 4 months for discharge, 1 year for enlistment prep
    let percentage = (displayDays / maxDays) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    const circumference = 283;
    const dashOffset = ((100 - percentage) / 100) * circumference;
    dom.countdownRing.style.strokeDashoffset = dashOffset;

    let colorClass = '';
    let glowClass = '';
    let strokeHex = '';

    if (displayDays <= 30) {
        strokeHex = '#ef4444';
        glowClass = 'glow-red';
    } else if (displayDays <= 90) {
        strokeHex = '#f97316';
        glowClass = 'glow-orange';
    } else {
        strokeHex = '#22c55e';
        glowClass = 'glow-green';
    }

    dom.countdownRing.setAttribute('stroke', strokeHex);
}

// --- Date Input Helper (Ported from auth.js) ---
export function setupDateInputs() {
    const inputs = document.querySelectorAll('.date-input');
    const pickers = document.querySelectorAll('.hidden-picker');

    // Sync Picker -> Inputs
    pickers.forEach(picker => {
        // Remove old listeners to prevent duplicates if called multiple times
        // actually standard addEventListener adds multiples, but we only call init once usually.
        // For safety/simplicity in this context, just add.
        picker.onchange = (e) => {
            if (!e.target.value) return;
            // e.target.value is YYYY-MM-DD
            const [y, m, d] = e.target.value.split('-');

            // Derive ID prefix from picker ID (picker-input-date -> input-date)
            const prefix = e.target.id.replace('picker-', '');

            const elY = document.getElementById(`${prefix}-y`);
            const elM = document.getElementById(`${prefix}-m`);
            const elD = document.getElementById(`${prefix}-d`);

            if (elY) elY.value = y;
            if (elM) elM.value = m;
            if (elD) elD.value = d;
        };
    });

    inputs.forEach(input => {
        // clear old to be safe if possible, or just overwrite via onprop

        // 1. Input Event: Restrict numbers & Auto-jump
        input.oninput = (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            const maxLength = parseInt(e.target.getAttribute('maxlength'));
            const nextId = e.target.getAttribute('data-next');

            if (e.target.value.length >= maxLength) {
                if (nextId) document.getElementById(nextId).focus();
            }
        };

        // 2. Keydown Event: Backspace navigation
        input.onkeydown = (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
                const prevId = e.target.getAttribute('data-prev');
                if (prevId) document.getElementById(prevId).focus();
            }
        };

        // 3. Blur Event: Simple Range Validation
        input.onblur = (e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) return;

            if (e.target.id.endsWith('-m')) {
                if (val < 1) e.target.value = '01';
                if (val > 12) e.target.value = '12';
                e.target.value = e.target.value.padStart(2, '0');
            }
            if (e.target.id.endsWith('-d')) {
                if (val < 1) e.target.value = '01';
                if (val > 31) e.target.value = '31';
                e.target.value = e.target.value.padStart(2, '0');
            }
        };
    });
}

export function startCountdownTimer() {
    setInterval(updateCountdown, 1000 * 60 * 60);
    setTimeout(updateCountdown, 100);
}
