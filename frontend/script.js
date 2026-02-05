
// State Management
const state = {
    isLoggedIn: false,
    userData: null,
    serviceStatus: null,
    activeTab: 'home',
    backpack: [],
    game: {
        isPlaying: false,
        score: 0,
        timeLeft: 30,
        timer: null,
        spawnTimer: null,
        mosquitoes: []
    },
    training: {
        completed: [] // Array of day IDs (e.g., 1, 2, 3...)
    }
};

// Constants
const INSTRUCTOR_RESPONSES = [
    "大聲點！我聽不見！",
    "懷疑啊？",
    "你這個兵怎麼當的？",
    "不要給我嬉皮笑臉！",
    "洗澡只有三分鐘，還在這邊跟我聊天？",
    "注意禮節！",
    "是不是想洞八？",
    "公差出列！",
    "還有時間滑手機？",
    "棉被折好了沒？"
];

const INITIAL_BACKPACK = [
    { id: 1, name: "徵集令", category: "document", acquired: false, required: true },
    { id: 2, name: "身分證", category: "document", acquired: false, required: true },
    { id: 3, name: "健保卡", category: "document", acquired: false, required: true },
    { id: 4, name: "印章", category: "document", acquired: false, required: true },
    { id: 5, name: "郵局存摺影本", category: "document", acquired: false, required: true },
    { id: 6, name: "畢業證書影本", category: "document", acquired: false, required: false },
    { id: 7, name: "戶籍謄本", category: "document", acquired: false, required: false },
    { id: 8, name: "便宜電子錶", category: "life", acquired: false, required: true, note: "有夜光/鬧鐘功能" },
    { id: 9, name: "三合一沐浴乳", category: "life", acquired: false, required: true },
    { id: 10, name: "爽身粉", category: "life", acquired: false, required: false, note: "夏天必備" },
    { id: 11, name: "電話卡", category: "life", acquired: false, required: false },
    { id: 12, name: "零錢 (投販賣機)", category: "life", acquired: false, required: false },
    { id: 13, name: "免洗內褲", category: "clothing", acquired: false, required: false },
    { id: 14, name: "黑色長襪", category: "clothing", acquired: false, required: true, note: "過腳踝" },
];

const QUICK_PACKS = {
    life: [8, 9, 10], // IDs
    med: "診斷證明書" // Special handling
};

// DOM Elements
const dom = {
    // Modal
    modalOnboarding: document.getElementById('modal-onboarding'),
    inputName: document.getElementById('input-name'),
    inputDate: document.getElementById('input-date'),
    inputRole: document.getElementById('input-role'),
    inputDisabilityType: document.getElementById('input-disability-type'),
    sectionDisability: document.getElementById('section-disability'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    btnSubmitOnboarding: document.getElementById('btn-submit-onboarding'),
    btnCloseOnboarding: document.getElementById('btn-close-onboarding'),

    // Sidebar & Header
    sidebarNav: document.getElementById('sidebar-nav'),
    userInfoSidebar: document.getElementById('user-info-sidebar'),
    sidebarName: document.getElementById('sidebar-name'),
    sidebarRole: document.getElementById('sidebar-role'),
    btnLoginSidebar: document.getElementById('btn-login-sidebar'),

    headerGuestTools: document.getElementById('header-guest-tools'),
    headerUserTools: document.getElementById('header-user-tools'),
    btnLoginHeader: document.getElementById('btn-login-header'),
    btnEditProfile: document.getElementById('btn-edit-profile'),
    btnLogout: document.getElementById('btn-logout'),
    headerNameMobile: document.getElementById('header-name-mobile'),
    headerStatusMobile: document.getElementById('header-status-mobile'),

    // Views
    views: {
        home: document.getElementById('view-home'),
        training: document.getElementById('view-training'),
        inventory: document.getElementById('view-inventory'),
        chat: document.getElementById('view-chat'),
        docs: document.getElementById('view-docs'),
        video: document.getElementById('view-video'),
        game: document.getElementById('view-game'),
        locations: document.getElementById('view-locations')
    },

    // Home Widgets
    widgetStatus: document.getElementById('widget-status-report'),
    widgetGuest: document.getElementById('widget-guest-prompt'),
    statusType: document.getElementById('status-type'),
    statusReason: document.getElementById('status-reason'),
    statusInstruction: document.getElementById('status-instruction'),
    statusIcon: document.getElementById('status-icon'),

    // Countdown
    countdownTitle: document.getElementById('countdown-title'),
    targetDateDisplay: document.getElementById('target-date-display'),
    btnEndFake: document.getElementById('btn-end-fake'),
    countdownContentGuest: document.getElementById('countdown-content-guest'),
    countdownContentUser: document.getElementById('countdown-content-user'),
    countdownContentExempt: document.getElementById('countdown-content-exempt'),
    daysLeftCount: document.getElementById('days-left-count'),
    btnSetupDate: document.getElementById('btn-setup-date'),
    btnFakeCountdown: document.getElementById('btn-fake-countdown'),
    btnUnlockGuest: document.getElementById('btn-unlock-guest'),
    countdownRing: document.getElementById('countdown-ring'),

    // Tasks
    tasksCard: document.getElementById('tasks-card'),
    tasksLockOverlay: document.getElementById('tasks-lock-overlay'),

    // Inventory
    inventoryList: document.getElementById('inventory-list'),

    // Chat
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatMessages: document.getElementById('chat-messages'),

    // Video
    videoGallery: document.getElementById('video-gallery'),
    videoPlayer: document.getElementById('video-player'),
    btnCloseVideo: document.getElementById('video-close-btn'), // The X on top right of list? No, there is one in player
    btnClosePlayer: document.getElementById('close-video-player'),
    playerTitle: document.getElementById('player-title'),
    playerDesc: document.getElementById('player-desc'),
    playerTag: document.getElementById('player-tag'),

    // Game
    linkGame: document.getElementById('link-game'),
    linkVideo: document.getElementById('link-video'),
    gameLobby: document.getElementById('game-lobby'),
    gamePlayArea: document.getElementById('game-play-area'),
    gameOver: document.getElementById('game-over'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnQuitGame: document.getElementById('btn-quit-game'),
    btnRetryGame: document.getElementById('btn-retry-game'),
    btnBackHome: document.getElementById('btn-back-home'),
    gameScore: document.getElementById('game-score'),
    gameTimer: document.getElementById('game-timer'),
    finalScore: document.getElementById('final-score'),
    finalMessage: document.getElementById('final-message'),
    finalMessage: document.getElementById('final-message'),
    mosquitoContainer: document.getElementById('mosquito-container'),

    // Training Progress
    trainingProgressBar: document.getElementById('training-progress-bar'),
    trainingProgressText: document.getElementById('training-progress-text'),
    trainingContent: document.getElementById('training-content'),

    // Calendar
    calendarPanel: document.getElementById('calendar-panel'),
    calendarGrid: document.getElementById('calendar-grid'),
    calendarMonthYear: document.getElementById('calendar-month-year'),

    // Daily Task Progress
    dailyTaskBar: document.getElementById('daily-task-bar'),
    dailyTaskPercent: document.getElementById('daily-task-percent'),
    taskCheckboxes: document.querySelectorAll('#tasks-list input[type="checkbox"]'),

    // Location Widget
    widgetLocation: document.getElementById('widget-location'),
    locationDisplay: document.getElementById('location-display')
};

// --- Logic ---

function init() {
    // Set initial backpack state
    state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));
    renderInventory();

    // Event Listeners
    setupEventListeners();

    // Default to guest mode
    updateUIForGuest();
}

function setupEventListeners() {
    // Navigation (Sidebar)
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Navigation (Mobile)
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Onboarding
    dom.inputRole.addEventListener('change', (e) => {
        if (e.target.value === 'disability') {
            dom.sectionDisability.classList.remove('hidden');
        } else {
            dom.sectionDisability.classList.add('hidden');
        }
    });

    dom.btnSubmitOnboarding.addEventListener('click', handleOnboardingSubmit);
    dom.btnCloseOnboarding.addEventListener('click', () => {
        dom.modalOnboarding.classList.add('hidden');
    });

    // Login/Edit Buttons
    const openModal = () => {
        dom.modalOnboarding.classList.remove('hidden');
        dom.btnCloseOnboarding.classList.remove('hidden'); // Allow closing if opening mainly for edit
    };

    dom.btnLoginSidebar.addEventListener('click', openModal);
    dom.btnLoginHeader.addEventListener('click', openModal);
    dom.btnEditProfile.addEventListener('click', openModal);
    dom.btnUnlockGuest.addEventListener('click', openModal);
    dom.btnSetupDate.addEventListener('click', openModal);

    dom.btnLogout.addEventListener('click', handleLogout);

    // Chat
    dom.chatForm.addEventListener('submit', handleChatSubmit);

    // Inventory
    window.addQuickItem = handleQuickAdd; // Expose to global for HTML onclick

    // Video
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => {
            playVideo(item.dataset);
        });
    });
    dom.btnClosePlayer.addEventListener('click', closeVideo);

    // Daily Tasks
    dom.taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateDailyTaskProgress);
    });

    // Game
    dom.linkGame.addEventListener('click', () => switchTab('game'));
    dom.linkVideo.addEventListener('click', () => switchTab('video'));
    dom.btnStartGame.addEventListener('click', startGame);
    dom.btnQuitGame.addEventListener('click', quitGame);
    dom.btnRetryGame.addEventListener('click', startGame);
    dom.btnBackHome.addEventListener('click', () => {
        switchTab('home');
        resetGameUI();
    });

    // Fake Countdown
    dom.btnFakeCountdown.addEventListener('click', () => {
        dom.countdownContentExempt.classList.add('hidden');
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownTitle.textContent = "體驗倒數 (模擬)";
        dom.btnEndFake.classList.remove('hidden');
        state.userData.tempCountdown = true;
    });

    dom.btnEndFake.addEventListener('click', () => {
        dom.countdownContentExempt.classList.remove('hidden');
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownTitle.textContent = "距離入伍";
        dom.btnEndFake.classList.add('hidden');
        dom.btnEndFake.classList.add('hidden');
        state.userData.tempCountdown = false;
    });

    // Training Card Click
    // We delegate the click to the container because cards are static but we might render them dynamically later
    // For now they are static HTML, so let's attach listeners to them
    dom.trainingContent.querySelectorAll('.grid > div').forEach((card, index) => {
        // Add ID to card for tracking
        const dayId = index + 1;
        card.setAttribute('data-day', dayId);

        card.addEventListener('click', () => toggleTrainingDay(dayId, card));
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle Views
    Object.keys(dom.views).forEach(key => {
        if (key === tabId) {
            dom.views[key].classList.remove('hidden');
            dom.views[key].classList.add('animate-fade-in');
        } else {
            dom.views[key].classList.add('hidden');
            dom.views[key].classList.remove('animate-fade-in');
        }
    });

    // Update Sidebar Nav
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        if (isActive) {
            btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-green-900/30 text-green-400 border border-green-800/50";
        } else {
            btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-stone-400 hover:bg-stone-800 hover:text-stone-200";
        }
    });

    // Update Mobile Nav
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        if (isActive) {
            btn.classList.add('text-green-500');
            btn.classList.remove('text-stone-500');
        } else {
            btn.classList.add('text-stone-500');
            btn.classList.remove('text-green-500');
        }
    });

    // Special case: Quit game if leaving game tab? 
    if (tabId !== 'game' && state.game.isPlaying) {
        quitGame();
    }
}

async function handleOnboardingSubmit() {
    const name = document.getElementById('input-name').value;
    const date = document.getElementById('input-date').value;
    const role = document.getElementById('input-role').value;
    const disability = document.getElementById('input-disability-type').value;
    const height = document.getElementById('input-height').value;
    const weight = document.getElementById('input-weight').value;
    const btnSubmit = document.getElementById('btn-submit-onboarding');

    if (!name || !date) {
        alert('請填寫完整資訊');
        return;
    }

    const userData = { name, date, role, disability, height, weight };

    // Loading State
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>連線中...';
    btnSubmit.disabled = true;
    btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        // Simulate delay + API Call
        const delay = new Promise(resolve => setTimeout(resolve, 1500));
        const apiCall = fetch('/api/user_settings_edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const [_, response] = await Promise.all([delay, apiCall]);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Only update local state if API success
        state.userData = userData;
        state.isLoggedIn = true;
        state.serviceStatus = determineServiceType(bmi(height, weight), role, disability);

        updateUIForUser();
        dom.modalOnboarding.classList.add('hidden');

    } catch (error) {
        console.error('Error saving user settings:', error);
        alert('資料儲存失敗，請稍後再試');
    } finally {
        // Reset Button
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function handleLogout() {
    state.isLoggedIn = false;
    state.userData = null;
    state.serviceStatus = null;
    updateUIForGuest();
    dom.inputName.value = '';
    // Optional: Reset backpack?
    state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));
    renderInventory();

    // Reset Chat
    dom.chatMessages.innerHTML = `
        <div class="flex justify-start">
            <div class="max-w-[80%] md:max-w-[60%] p-4 rounded-xl text-base bg-stone-700 text-stone-200 rounded-bl-none shadow-md">
                死菜鳥！有什麼問題快問！不要浪費我時間！
            </div>
        </div>
    `;
}

function updateUIForUser() {
    const { name, role } = state.userData;

    // Sidebar
    dom.userInfoSidebar.classList.remove('hidden');
    dom.btnLoginSidebar.classList.add('hidden');
    dom.sidebarName.textContent = name;
    dom.sidebarRole.textContent = state.serviceStatus.type;

    // Header
    dom.headerGuestTools.classList.add('hidden');
    dom.headerUserTools.classList.remove('hidden');
    dom.headerNameMobile.textContent = name;
    dom.headerStatusMobile.textContent = state.serviceStatus.type;

    // Home Widgets
    dom.widgetGuest.classList.add('hidden');
    dom.widgetStatus.classList.remove('hidden');
    dom.statusType.textContent = state.serviceStatus.type;
    dom.statusReason.textContent = state.serviceStatus.reason;
    dom.statusInstruction.textContent = state.serviceStatus.nextStep;
    dom.statusIcon.textContent = state.serviceStatus.icon;

    // Countdown
    dom.countdownContentGuest.classList.add('hidden');
    if (state.serviceStatus.type === '免役') {
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownContentExempt.classList.remove('hidden');
    } else {
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownContentExempt.classList.add('hidden');
        updateCountdown();
        // Update Location
        if (state.userData.location) {
            dom.locationDisplay.textContent = state.userData.location;
            dom.widgetLocation.classList.remove('hidden');
        } else {
            dom.widgetLocation.classList.add('hidden');
        }
    }

    // Calendar
    renderCalendar();
    dom.calendarPanel.classList.remove('hidden');

    // Tasks (Unlock)
    dom.tasksCard.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
    dom.tasksLockOverlay.classList.add('hidden');
}

function updateUIForGuest() {
    // Sidebar
    dom.userInfoSidebar.classList.add('hidden');
    dom.btnLoginSidebar.classList.remove('hidden');

    // Header
    dom.headerGuestTools.classList.remove('hidden');
    dom.headerUserTools.classList.add('hidden');
    dom.headerNameMobile.textContent = "訪客";
    dom.headerStatusMobile.textContent = "尚未建立兵籍資料";

    // Home
    dom.widgetGuest.classList.remove('hidden');
    dom.widgetStatus.classList.add('hidden');

    // Countdown
    dom.countdownContentGuest.classList.remove('hidden');
    dom.countdownContentUser.classList.add('hidden');
    dom.countdownContentExempt.classList.add('hidden');

    // Tasks
    dom.tasksCard.classList.add('opacity-50', 'pointer-events-none', 'grayscale');
    dom.tasksLockOverlay.classList.remove('hidden');
}

function determineServiceType(bmiValue, role, disability) {
    if (disability && disability !== 'none') return { type: '免役', reason: '身心障礙證明', icon: '🕊️', nextStep: '持身心障礙證明至公所兵役科辦理核免' };
    if (role === 'rd_substitute') return { type: '研發替代役', reason: '申請核准', icon: '💻', nextStep: '完成碩士學歷，向內政部申請' };

    if (bmiValue < 16.5 || bmiValue > 31.5) return { type: '免役', reason: '體位不合格 (過瘦/過重)', icon: '🏥', nextStep: '等待體檢報告，可能需複檢' };
    if ((bmiValue >= 16.5 && bmiValue < 17) || (bmiValue > 31 && bmiValue <= 31.5)) return { type: '替代役', reason: '替代役體位', icon: '👮', nextStep: '留意替代役申請時程' };

    return { type: '常備役', reason: '常備役體位', icon: '🪖', nextStep: '鍛鍊體能，調整作息，準備入營' };
}

function bmi(h, w) {
    return w / ((h / 100) * (h / 100));
}

function updateCountdown() {
    if (!state.userData || !state.userData.date) return;
    const target = new Date(state.userData.date);
    const today = new Date();
    const diffTime = target - today;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Fake Countdown Override
    if (state.userData.tempCountdown) {
        diffDays = 30;
    }

    // Display Days
    const displayDays = diffDays > 0 ? diffDays : 0;
    dom.daysLeftCount.textContent = displayDays;

    if (diffDays <= 0) {
        dom.daysLeftCount.textContent = "0";
        dom.countdownTitle.textContent = "入伍日";
    } else {
        dom.countdownTitle.textContent = "距離入伍";
    }

    // Chart Logic
    const maxDays = 365; // Assume 1 year range for full circle
    let percentage = (displayDays / maxDays) * 100;
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    // SVG Circle is r=45 -> Circumference = 2 * PI * 45 ≈ 283
    const circumference = 283;
    const dashOffset = ((100 - percentage) / 100) * circumference;

    // Animate Ring
    dom.countdownRing.style.strokeDashoffset = dashOffset; // Changed direction logic: Full = Max time, Empty = 0 time? 
    // Wait, usually countdowns "drain". 100% -> 0%.
    // If daysLeft = 365 => 100% full. daysLeft = 0 => 0% empty.
    // dashOffset = circumference * (1 - percentage/100). 
    // If percentage is 100, offset is 0 (Full). If percentage is 0, offset is 283 (Empty).
    // The previous formula "((100 - percentage) / 100) * circumference" is correct for "draining".

    // Color Logic
    dom.countdownRing.classList.remove('stroke-red-500', 'stroke-orange-500', 'stroke-green-500', 'glow-red', 'glow-orange', 'glow-green', 'shadow-[0_0_15px_rgba(239,68,68,0.5)]', 'shadow-[0_0_15px_rgba(249,115,22,0.5)]', 'shadow-[0_0_15px_rgba(34,197,94,0.5)]');

    // We need to set stroke color manually or via class. 
    // Let's use Tailwind logic, but we need to force update if using just classList for color.
    // Actually, in HTML I set hardcoded stroke="#ef4444". I should remove that or override it.
    // Better to use `setAttribute('stroke', color)`? Or just classes. 
    // The HTML has `stroke="#ef4444"`. Let's assume we want to override it.

    let colorClass = '';
    let glowClass = '';
    let strokeHex = '';

    if (displayDays <= 30) {
        colorClass = 'stroke-red-500';
        glowClass = 'glow-red';
        strokeHex = '#ef4444';
    } else if (displayDays <= 90) {
        colorClass = 'stroke-orange-500';
        glowClass = 'glow-orange';
        strokeHex = '#f97316';
    } else {
        colorClass = 'stroke-green-500';
        glowClass = 'glow-green';
        strokeHex = '#22c55e';
    }

    dom.countdownRing.setAttribute('stroke', strokeHex);
    dom.countdownRing.classList.add(glowClass);
}
setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour
setTimeout(updateCountdown, 100); // Trigger immediately on load logic

// --- Inventory Logic ---
function renderInventory() {
    dom.inventoryList.innerHTML = '';
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
        dom.inventoryList.appendChild(div);
    });
}

function toggleItem(id) {
    const item = state.backpack.find(i => i.id === id);
    if (item) {
        item.acquired = !item.acquired;
        renderInventory();
    }
}

function handleQuickAdd(type) {
    if (type === 'life') {
        state.backpack.forEach(item => {
            if (QUICK_PACKS.life.includes(item.id)) item.acquired = true;
        });
    } else if (type === 'med') {
        const medName = QUICK_PACKS.med;
        if (!state.backpack.some(i => i.name === medName)) {
            state.backpack.push({ id: Date.now(), name: medName, category: 'medical', acquired: true, required: true, note: "慢性病處方箋" });
        }
    }
    renderInventory();
}

// --- Chat Logic ---
function handleChatSubmit(e) {
    e.preventDefault();
    const text = dom.chatInput.value.trim();
    if (!text) return;

    // User Msg
    addMessage(text, 'user');
    dom.chatInput.value = '';

    // Bot Response
    setTimeout(() => {
        const randomResp = INSTRUCTOR_RESPONSES[Math.floor(Math.random() * INSTRUCTOR_RESPONSES.length)];
        addMessage(randomResp, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;

    const contentClass = sender === 'user'
        ? "bg-green-700 text-white rounded-br-none"
        : "bg-stone-700 text-stone-200 rounded-bl-none";

    div.innerHTML = `
        <div class="max-w-[80%] md:max-w-[60%] p-4 rounded-xl text-base shadow-md ${contentClass}">
            ${text}
        </div>
    `;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

// --- Video Logic ---
function playVideo(data) {
    dom.playerTag.textContent = data.tag;
    dom.playerTag.className = `px-3 py-1 rounded text-sm mb-3 inline-block backdrop-blur-md text-white ${data.color}`; // Simple mock color
    dom.playerTitle.textContent = data.title;
    dom.playerDesc.textContent = data.desc;

    dom.videoPlayer.classList.remove('hidden');
    dom.videoGallery.classList.add('hidden');
    dom.btnCloseVideo.classList.add('hidden');
}

function closeVideo() {
    dom.videoPlayer.classList.add('hidden');
    dom.videoGallery.classList.remove('hidden');
    dom.btnCloseVideo.classList.remove('hidden');
}

// --- Game Logic ---
function startGame() {
    state.game.isPlaying = true;
    state.game.score = 0;
    state.game.timeLeft = 30;
    state.game.mosquitoes = [];

    dom.gameLobby.classList.add('hidden');
    dom.gameOver.classList.add('hidden');
    dom.gamePlayArea.classList.remove('hidden');
    dom.btnQuitGame.classList.remove('hidden');

    dom.gameScore.textContent = '0';
    dom.gameTimer.textContent = '00:30';

    // Clear existing
    dom.mosquitoContainer.innerHTML = '';

    // Loop
    state.game.timer = setInterval(updateGameTimer, 1000);
    state.game.spawnTimer = setInterval(spawnMosquito, 800);
}

function quitGame() {
    stopGame();
    resetGameUI();
}

function stopGame() {
    state.game.isPlaying = false;
    clearInterval(state.game.timer);
    clearInterval(state.game.spawnTimer);
}

function resetGameUI() {
    dom.gamePlayArea.classList.add('hidden');
    dom.gameOver.classList.add('hidden');
    dom.gameLobby.classList.remove('hidden');
    dom.btnQuitGame.classList.add('hidden');
}

function endGame() {
    stopGame();
    dom.gamePlayArea.classList.add('hidden');
    dom.gameOver.classList.remove('hidden');
    dom.btnQuitGame.classList.add('hidden');

    dom.finalScore.textContent = state.game.score;
    if (state.game.score > 20) dom.finalMessage.textContent = "太神啦！你是防蚊指揮官！";
    else if (state.game.score > 10) dom.finalMessage.textContent = "不錯喔！至少不會被叮死。";
    else dom.finalMessage.textContent = "太嫩了！準備被叮成紅豆冰！";

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

function updateGameTimer() {
    state.game.timeLeft--;
    const min = Math.floor(state.game.timeLeft / 60);
    const sec = state.game.timeLeft % 60;
    dom.gameTimer.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    if (state.game.timeLeft <= 0) {
        endGame();
    }
}

function spawnMosquito() {
    const id = Date.now();
    const mosquito = document.createElement('div');
    const size = 60;
    const x = Math.random() * (dom.gamePlayArea.clientWidth - size);
    const y = Math.random() * (dom.gamePlayArea.clientHeight - size);

    mosquito.className = "absolute cursor-pointer text-4xl select-none hover:scale-110 transition-transform active:scale-90 animate-bounce";
    mosquito.style.left = `${x}px`;
    mosquito.style.top = `${y}px`;
    mosquito.textContent = "🦟";

    mosquito.onclick = (e) => {
        hitMosquito(e, mosquito);
    };

    dom.mosquitoContainer.appendChild(mosquito);

    // Auto remove after some time
    setTimeout(() => {
        if (mosquito.parentNode) mosquito.remove();
    }, 2000);
}

function hitMosquito(e, el) {
    e.stopPropagation(); // prevent triggering other things
    el.textContent = "💥";
    el.classList.remove('animate-bounce');
    state.game.score++;
    dom.gameScore.textContent = state.game.score;

    setTimeout(() => el.remove(), 200);

    // Sound effect could go here
}

// --- Training Logic ---
function toggleTrainingDay(dayId, cardElement) {
    if (state.training.completed.includes(dayId)) {
        // Remove
        state.training.completed = state.training.completed.filter(id => id !== dayId);
        cardElement.classList.remove('border-green-500', 'bg-green-900/20');
        cardElement.classList.add('border-l-4', 'border-stone-600');
        // Reset styled elements inside
        const badge = cardElement.querySelector('.text-green-400, .text-stone-400'); // simple selector try
        // Actually better to handle via re-render or just toggle classes.
        // Let's just toggle a "completed" look
    } else {
        // Add
        state.training.completed.push(dayId);
        cardElement.classList.remove('border-stone-600');
        cardElement.classList.add('border-green-500', 'bg-green-900/20');

        // Add checkmark effect?
        confetti({
            particleCount: 30,
            spread: 50,
            origin: {
                x: cardElement.getBoundingClientRect().left / window.innerWidth + 0.1,
                y: cardElement.getBoundingClientRect().top / window.innerHeight + 0.1
            },
            colors: ['#22c55e', '#ffffff']
        });
    }
    updateTrainingProgress();
    updateDailyTaskProgress(); // Sync with Main Dashboard logic
}

function updateTrainingProgress() {
    const totalDays = 5; // We have 5 cards hardcoded in HTML
    const completedCount = state.training.completed.length;
    const percent = Math.round((completedCount / totalDays) * 100);

    dom.trainingProgressBar.style.width = `${percent}%`;
    dom.trainingProgressText.textContent = `${percent}%`;

    if (percent === 100) {
        dom.trainingProgressBar.classList.add('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
    } else {
        dom.trainingProgressBar.classList.remove('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
    }
}



// --- Daily Task Logic ---
function updateDailyTaskProgress() {
    const totalCheckboxes = dom.taskCheckboxes.length;
    const trainingTaskWeight = 1; // Training counts as 1 task
    const total = totalCheckboxes + trainingTaskWeight; // Total items

    let checked = 0;

    // Count checkboxes
    dom.taskCheckboxes.forEach(cb => {
        if (cb.checked) checked++;
    });

    // Count Training (If any training is done, count as complete for "Today's Training")
    // In a real app, this would check if *today's* specific training is done.
    if (state.training.completed.length > 0) {
        checked += trainingTaskWeight;
    }

    const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

    dom.dailyTaskBar.style.width = `${percent}%`;
    dom.dailyTaskPercent.textContent = `${percent}%`;

    if (percent === 100) {
        dom.dailyTaskBar.classList.add('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
        // Optional: Trigger confetti
        createConfetti(dom.dailyTaskBar.getBoundingClientRect().x, dom.dailyTaskBar.getBoundingClientRect().y);
    } else {
        dom.dailyTaskBar.classList.remove('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
    }
}

// --- Calendar Logic ---
function renderCalendar() {
    if (!state.userData || !state.userData.date) return;

    const today = new Date();
    const targetDate = new Date(state.userData.date);

    // Determine which month to show (Current month)
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    dom.calendarMonthYear.textContent = `${year} / ${(month + 1).toString().padStart(2, '0')}`;
    dom.calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        dom.calendarGrid.appendChild(div);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.textContent = d;
        div.className = 'calendar-day';

        // Check Today
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }

        // Check Target
        if (d === targetDate.getDate() && month === targetDate.getMonth() && year === targetDate.getFullYear()) {
            div.classList.add('enlist-day');
        }

        // Check Past
        if (d < today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('past');
        }

        dom.calendarGrid.appendChild(div);
    }
}

function openOnboarding() {
    dom.modalOnboarding.classList.remove('hidden');
}

// Start
init();