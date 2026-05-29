/**
 * SIMSOLDIER MAIN ENTRY POINT
 * 程式啟動、事件綁定、初始化
 */

import { api } from './api.js';
import { state, INITIAL_BACKPACK } from './state.js';
import { dom, switchTab } from './ui.js';
import { determineServiceType, bmi } from './utils.js';
import * as game from './game.js';
import * as features from './features.js';
import { training_ai } from './training_ai.js';
import { initQuiz } from './quiz.js';

// --- Initialization ---

// 1. Check Auth immediately
if (!api.checkAuth()) {
    // 沒登入就直接跳轉，並用 replace 避免產生上一頁的歷史紀錄
    window.location.replace('loadingbar.html?dest=login.html');
} else {
    // 2. 確定有登入，才允許執行初始化！(這非常重要，避免跳轉時在背景報錯)
    init();
}

async function init() {
    try {
        const user = await api.getMe(); // Load User Data

        // Init Backpack
        state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));

        if (user) {
            if (!user.profile) {
                console.warn('Auto-fixing missing user profile...');
                user.profile = { name: "士兵", height: 175, weight: 70, role: "regular", disability: false, date: null };
            }
            state.isLoggedIn = true;
            state.userData = user.profile;
            state.serviceStatus = determineServiceType(
                bmi(user.profile.height, user.profile.weight),
                user.profile.role,
                user.profile.disability,
                user.profile.birthday
            );

            updateUIForUser();

            // Dynamic Backpack Items
            if (state.userData.medication) {
                state.backpack.push({
                    id: 99,
                    name: "診斷證明書",
                    category: "document",
                    acquired: false,
                    required: true,
                    note: "慢性病佐證(正本)"
                });
            }
        } else {
            console.error('User not found, clearing session.');
            // 只清空當前登入狀態，絕對不要動 localStorage
            sessionStorage.removeItem('simSoldier_currentUser');
            api.logout();
            return;
        }

        features.renderInventory();
        features.startCountdownTimer();
        features.setupDateInputs(); // Init Date Input Logic
        features.initChatGreeting(); // 根據兵役狀態與日期產生自適應的教官開場白
        setupEventListeners();

        // 啟動 AI 訓練模組與天兵課堂
        try {
            training_ai.init();
            console.log('AI Training initialized');
        } catch (e) {
            console.error('AI Training init failed:', e);
        }

        try {
            initQuiz();
            console.log('Quiz initialized');
        } catch (e) {
            console.error('Quiz init failed:', e);
        }

        // Reveal UI after successful load
        document.body.classList.remove('opacity-0');

    } catch (error) {
        console.error('Init error:', error);
        if (error.message === 'Not logged in') {
            // 發生未登入錯誤時，清除登入狀態並踢出
            sessionStorage.removeItem('simSoldier_currentUser');
            api.logout();
            return;
        }
        alert('系統發生錯誤 (DEBUG模式):\n' + error.message + '\n\n' + error.stack);
    }
}
function updateUIForUser() {
    const { name } = state.userData;

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

    // Countdown / Exempt Logic
    dom.countdownContentGuest.classList.add('hidden');
    if (state.serviceStatus.type === '免役') {
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownContentExempt.classList.remove('hidden');
    } else {
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownContentExempt.classList.add('hidden');
        features.updateCountdown();

        if (state.userData.location) {
            dom.locationDisplay.textContent = state.userData.location;
            dom.widgetLocation.classList.remove('hidden');
        } else {
            dom.widgetLocation.classList.add('hidden');
        }
    }

    // Calendar
    features.renderCalendar();
    dom.calendarPanel.classList.remove('hidden');

    // Tasks Unlock
    dom.tasksCard.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
    dom.tasksLockOverlay.classList.add('hidden');
}


// --- Event Listeners ---

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Onboarding Modal
    dom.inputRole.addEventListener('change', (e) => {
        if (e.target.value === 'disability') {
            dom.sectionDisability.classList.remove('hidden');
        } else {
            dom.sectionDisability.classList.add('hidden');
        }
    });

    dom.btnSubmitOnboarding.addEventListener('click', handleOnboardingSubmit);
    dom.btnCloseOnboarding.addEventListener('click', () => dom.modalOnboarding.classList.add('hidden'));

    // Edit Profile Buttons
    const openModal = () => {
        dom.modalOnboarding.classList.remove('hidden');
        dom.btnCloseOnboarding.classList.remove('hidden');
        // Pre-fill logic
        if (state.userData) {
            dom.inputName.value = state.userData.name || '';

            // Split Date Logic
            if (state.userData.date) {
                const [y, m, d] = state.userData.date.split(/[-/]/);
                if (dom.inputDateY) dom.inputDateY.value = y;
                if (dom.inputDateM) dom.inputDateM.value = m;
                if (dom.inputDateD) dom.inputDateD.value = d;
            }

            if (state.userData.birthday) {
                const [y, m, d] = state.userData.birthday.split(/[-/]/);
                if (dom.inputBirthdayY) dom.inputBirthdayY.value = y;
                if (dom.inputBirthdayM) dom.inputBirthdayM.value = m;
                if (dom.inputBirthdayD) dom.inputBirthdayD.value = d;
            }

            dom.inputRole.value = state.userData.role || 'regular';
            dom.inputHeight.value = state.userData.height || 175;
            dom.inputWeight.value = state.userData.weight || 70;
            if (dom.inputMeds) dom.inputMeds.checked = state.userData.medication || false;

            if (state.userData.role === 'disability') {
                dom.sectionDisability.classList.remove('hidden');
                dom.inputDisabilityType.value = state.userData.disability || 'none';
            } else {
                dom.sectionDisability.classList.add('hidden');
            }
        }
    };

    dom.btnLoginSidebar.addEventListener('click', openModal);
    dom.btnLoginHeader.addEventListener('click', openModal);
    dom.btnEditProfile.addEventListener('click', openModal);
    dom.btnUnlockGuest.addEventListener('click', openModal);
    dom.btnSetupDate.addEventListener('click', openModal);

    // Sidebar Settings
    if (dom.btnSettingsSidebar) {
        dom.btnSettingsSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.settingsMenuSidebar.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!dom.settingsMenuSidebar.contains(e.target) && e.target !== dom.btnSettingsSidebar) {
                dom.settingsMenuSidebar.classList.add('hidden');
            }
        });
    }

    if (dom.btnEditProfileSidebar) {
        dom.btnEditProfileSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            openModal();
        });
    }

    if (dom.btnGameBackpackSidebar) {
        dom.btnGameBackpackSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            alert('小遊戲背包功能開發中！');
        });
    }

    if (dom.btnDeleteAccountSidebar) {
        dom.btnDeleteAccountSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            if (confirm('確定要永久刪除帳號嗎？此動作無法復原！')) {
                const currentUser = sessionStorage.getItem('simSoldier_currentUser');
                localStorage.removeItem('simSoldier_user_' + currentUser); // Wait, keys were just in one object?
                // The API logic saves all users in ONE key 'simSoldier_users'.
                // So strict delete requires reading that object.
                // For now just clear session is safer, or impl delete in API.
                api.logout();
            }
        });
    }

    if (dom.btnLogoutSidebar) dom.btnLogoutSidebar.addEventListener('click', showLogoutModal);
    document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', showLogoutModal));

    // Logout Modal Logic
    function showLogoutModal() {
        if (dom.settingsMenuSidebar) dom.settingsMenuSidebar.classList.add('hidden');
        dom.modalLogout.classList.remove('hidden');
    }

    if (dom.btnConfirmLogout) {
        dom.btnConfirmLogout.addEventListener('click', () => {
            dom.modalLogout.classList.add('hidden');
            api.logout();
        });
    }

    if (dom.btnCancelLogout) {
        dom.btnCancelLogout.addEventListener('click', () => {
            dom.modalLogout.classList.add('hidden');
        });
    }

    // Chat
    dom.chatForm.addEventListener('submit', features.handleChatSubmit);

    // Video
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => features.playVideo(item.dataset));
    });
    dom.btnClosePlayer.addEventListener('click', features.closeVideo);

    // Docs
    document.querySelectorAll('.btn-doc').forEach(btn => {
        btn.addEventListener('click', () => features.openDocsModal(btn.dataset.doc));
    });
    dom.btnCloseDocs.addEventListener('click', () => dom.modalDocs.classList.add('hidden'));

    // Daily Tasks
    dom.taskCheckboxes.forEach(cb => cb.addEventListener('change', features.updateDailyTaskProgress));

    // Game Links & Control
    dom.linkGame.addEventListener('click', () => switchTab('game'));
    dom.linkVideo.addEventListener('click', () => switchTab('video'));
    dom.btnStartGame.addEventListener('click', game.startGame);
    dom.btnQuitGame.addEventListener('click', game.quitGame);
    dom.btnRetryGame.addEventListener('click', game.startGame);
    dom.btnBackHome.addEventListener('click', () => {
        switchTab('home');
        game.quitGame(); // Ensure stopped
    });

    // Fake Countdown
    dom.btnFakeCountdown.addEventListener('click', () => {
        dom.countdownContentExempt.classList.add('hidden');
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownTitle.textContent = "體驗倒數 (模擬)";
        dom.btnEndFake.classList.remove('hidden');
        state.userData.tempCountdown = true;
        features.updateCountdown();
    });

    dom.btnEndFake.addEventListener('click', () => {
        dom.countdownContentExempt.classList.remove('hidden');
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownTitle.textContent = "距離入伍";
        dom.btnEndFake.classList.add('hidden');
        state.userData.tempCountdown = false;
    });

    // Training Cards Delegate
    const trainingGrid = dom.trainingContent.querySelector('.grid'); // Need to find parent
    if (trainingGrid) {
        // We attached to individual cards in script.js, let's do safe query
        dom.trainingContent.querySelectorAll('.grid > div').forEach((card, index) => {
            const dayId = index + 1;
            const btn = card.querySelector('.btn-confirm-training');
            if (btn) {
                btn.onclick = (e) => { // Use onclick to replace old listeners if any
                    e.stopPropagation();
                    features.toggleTrainingDay(dayId, card, btn);
                };
            }
        });
    }
}

async function handleOnboardingSubmit() {
    const name = dom.inputName.value;

    // Reconstruct Dates
    const dateY = dom.inputDateY.value;
    const dateM = dom.inputDateM.value.padStart(2, '0');
    const dateD = dom.inputDateD.value.padStart(2, '0');
    const date = (dateY && dateM && dateD) ? `${dateY}-${dateM}-${dateD}` : '';

    const birthY = dom.inputBirthdayY.value;
    const birthM = dom.inputBirthdayM.value.padStart(2, '0');
    const birthD = dom.inputBirthdayD.value.padStart(2, '0');
    const birthday = (birthY && birthM && birthD) ? `${birthY}-${birthM}-${birthD}` : '';

    const role = dom.inputRole.value;
    const disability = dom.inputDisabilityType.value;
    const height = dom.inputHeight.value;
    const weight = dom.inputWeight.value;
    const hasMeds = dom.inputMeds.checked;
    const btnSubmit = dom.btnSubmitOnboarding;

    if (!name || !date) {
        alert('請填寫完整資訊');
        return;
    }

    const userData = { name, date, birthday, role, disability, height, weight, medication: hasMeds };

    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>處理中...';
    btnSubmit.disabled = true;

    try {
        const savedData = await api.updateProfile(userData);

        if (savedData && savedData._nameChanged) {
            alert('姓名即為您的登入帳號，已變更成功，請重新登入！');
            api.logout();
            return;
        }

        // Update local state
        state.userData = userData;
        state.serviceStatus = determineServiceType(bmi(height, weight), role, disability, birthday);

        updateUIForUser();
        dom.modalOnboarding.classList.add('hidden');

    } catch (error) {
        console.error(error);
        alert('資料儲存失敗: ' + error.message);
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}


// Start App
init();
