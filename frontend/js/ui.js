/**
 * SIMSOLDIER UI
 *DOM 元素選取與視圖切換邏輯
 */

import { state } from './state.js';

// DOM Elements Cache
export const dom = {
    // --- Views ---
    views: {
        home: document.getElementById('view-home'),
        training: document.getElementById('view-training'),
        inventory: document.getElementById('view-inventory'),
        chat: document.getElementById('view-chat'),
        docs: document.getElementById('view-docs'),
        rhapsody: document.getElementById('view-rhapsody'),
        video: document.getElementById('view-video'),
        game: document.getElementById('view-game'),
        locations: document.getElementById('view-locations'),
        quiz: document.getElementById('view-quiz')
    },

    // --- Training ---
    trainingProgressBar: document.getElementById('training-progress-bar'),
    trainingProgressText: document.getElementById('training-progress-text'),
    trainingContent: document.getElementById('training-content'),

    // --- Inventory ---
    inventoryListRequired: document.getElementById('inventory-list-required'),
    inventoryListOptional: document.getElementById('inventory-list-optional'),

    // --- Chat ---
    chatInput: document.getElementById('chat-input'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),

    // --- Docs ---
    modalDocs: document.getElementById('modal-docs'),
    docsModalTitle: document.getElementById('docs-modal-title'),
    docsModalContent: document.getElementById('docs-modal-content'),
    modalDocs: document.getElementById('modal-docs'),
    docsModalTitle: document.getElementById('docs-modal-title'),
    docsModalContent: document.getElementById('docs-modal-content'),
    docsModalLink: document.getElementById('docs-modal-link'),
    btnCloseDocs: document.getElementById('btn-close-docs'),

    // --- Video ---
    videoPlayer: document.getElementById('video-player'),
    videoGallery: document.getElementById('video-gallery'),
    btnCloseVideo: document.getElementById('close-video-player'),
    btnClosePlayer: document.getElementById('close-video-player'), // Alias for main.js compatibility
    playerTag: document.getElementById('player-tag'),
    playerTitle: document.getElementById('player-title'),
    playerDesc: document.getElementById('player-desc'),

    // --- Tasks (Daily) ---
    dailyTaskBar: document.getElementById('daily-task-bar'), // Need to check HTML if this exists
    dailyTaskPercent: document.getElementById('daily-task-percent'), // Need to check HTML
    taskCheckboxes: document.querySelectorAll('.task-checkbox'),

    // --- Sidebar & Header ---
    sidebarNav: document.getElementById('sidebar-nav'),
    userInfoSidebar: document.getElementById('user-info-sidebar'),
    sidebarName: document.getElementById('sidebar-name'),
    sidebarRole: document.getElementById('sidebar-role'),
    btnLoginSidebar: document.getElementById('btn-login-sidebar'),

    headerGuestTools: document.getElementById('header-guest-tools'),
    headerUserTools: document.getElementById('header-user-tools'),
    btnLoginHeader: document.getElementById('btn-login-header'),
    btnEditProfile: document.getElementById('btn-edit-profile'),
    headerNameMobile: document.getElementById('header-name-mobile'),
    headerStatusMobile: document.getElementById('header-status-mobile'),

    // --- Onboarding Modal ---
    modalOnboarding: document.getElementById('modal-onboarding'),
    inputName: document.getElementById('input-name'),
    // Date Pickers (Custom)
    pickerInputDate: document.getElementById('picker-input-date'),
    pickerInputBirthday: document.getElementById('picker-input-birthday'),

    // Split Inputs - Date
    inputDateY: document.getElementById('input-date-y'),
    inputDateM: document.getElementById('input-date-m'),
    inputDateD: document.getElementById('input-date-d'),

    // Split Inputs - Birthday
    inputBirthdayY: document.getElementById('input-birthday-y'),
    inputBirthdayM: document.getElementById('input-birthday-m'),
    inputBirthdayD: document.getElementById('input-birthday-d'),
    inputRole: document.getElementById('input-role'),
    inputDisabilityType: document.getElementById('input-disability-type'),
    sectionDisability: document.getElementById('section-disability'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputMeds: document.getElementById('input-meds'),
    btnSubmitOnboarding: document.getElementById('btn-submit-onboarding'),
    btnCloseOnboarding: document.getElementById('btn-close-onboarding'),
    btnUnlockGuest: document.getElementById('btn-unlock-guest'),
    btnSetupDate: document.getElementById('btn-setup-date'),

    // --- Logout Modal ---
    modalLogout: document.getElementById('modal-logout'),
    btnCancelLogout: document.getElementById('btn-cancel-logout'),
    btnConfirmLogout: document.getElementById('btn-confirm-logout'),

    // --- Home Widgets ---
    widgetStatus: document.getElementById('widget-status-report'),
    widgetGuest: document.getElementById('widget-guest-prompt'),
    statusType: document.getElementById('status-type'),
    statusReason: document.getElementById('status-reason'),
    statusInstruction: document.getElementById('status-instruction'),
    statusIcon: document.getElementById('status-icon'),
    widgetLocation: document.getElementById('widget-location'),
    locationDisplay: document.getElementById('location-display'),

    // --- Countdown ---
    countdownTitle: document.getElementById('countdown-title'),
    btnEndFake: document.getElementById('btn-end-fake'),
    countdownContentGuest: document.getElementById('countdown-content-guest'),
    countdownContentUser: document.getElementById('countdown-content-user'),
    countdownContentExempt: document.getElementById('countdown-content-exempt'),
    daysLeftCount: document.getElementById('days-left-count'),
    btnFakeCountdown: document.getElementById('btn-fake-countdown'),
    countdownRing: document.getElementById('countdown-ring'),

    // --- Tasks ---
    tasksCard: document.getElementById('tasks-card'),
    tasksLockOverlay: document.getElementById('tasks-lock-overlay'),

    // --- Game ---
    // (Game DOM elements might be handled in game.js, but keeping references here is fine)
    linkGame: document.getElementById('link-game'),
    linkVideo: document.getElementById('link-video'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnQuitGame: document.getElementById('btn-quit-game'),
    btnRetryGame: document.getElementById('btn-retry-game'),
    btnBackHome: document.getElementById('btn-back-home'),

    // --- Calendar ---
    calendarPanel: document.getElementById('calendar-panel'),
    calendarGrid: document.getElementById('calendar-grid'),
    calendarMonthYear: document.getElementById('calendar-month-year'),

    // --- Settings Menu ---
    btnSettingsSidebar: document.getElementById('btn-settings-sidebar'),
    settingsMenuSidebar: document.getElementById('settings-menu-sidebar'),
    btnEditProfileSidebar: document.getElementById('btn-edit-profile-sidebar'),
    btnGameBackpackSidebar: document.getElementById('btn-game-backpack-sidebar'),
    btnDeleteAccountSidebar: document.getElementById('btn-delete-account-sidebar'),
    btnLogoutSidebar: document.getElementById('btn-logout-sidebar'),
};

/**
 * 切換側邊欄與主畫面 View
 * @param {string} tabId - 目標 Tab ID (home, training, etc.)
 */
export function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle Views
    Object.keys(dom.views).forEach(key => {
        const view = dom.views[key];
        if (!view) return; // Guard against missing DOM

        if (key === tabId) {
            view.classList.remove('hidden');
            view.classList.add('animate-fade-in');
        } else {
            view.classList.add('hidden');
            view.classList.remove('animate-fade-in');
        }
    });

    // Update Sidebar Nav
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        if (isActive) {
            btn.classList.add('bg-green-900/30', 'text-green-400', 'border-green-800/50');
            btn.classList.remove('text-stone-400', 'hover:bg-stone-800', 'hover:text-stone-200');
        } else {
            btn.classList.remove('bg-green-900/30', 'text-green-400', 'border-green-800/50');
            btn.classList.add('text-stone-400', 'hover:bg-stone-800', 'hover:text-stone-200');
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
}
