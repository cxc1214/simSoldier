// State Management
const state = {
    user: JSON.parse(localStorage.getItem('soldier_user')) || null,
    coins: parseInt(localStorage.getItem('soldier_coins') || '0'),
    tasks: [
        { id: 1, title: '完成晨間內務整理', reward: 50, completed: false },
        { id: 2, title: '閱讀一則軍旅知識', reward: 30, completed: false },
        { id: 3, title: '參加一次大兵狂想曲', reward: 100, completed: false },
    ],
    // Helper to save state
    save: function () {
        if (this.user) localStorage.setItem('soldier_user', JSON.stringify(this.user));
        else localStorage.removeItem('soldier_user');
        localStorage.setItem('soldier_coins', this.coins.toString());
    }
};

const app = document.getElementById('app');

// --- Screen Render Functions ---

function renderLogin() {
    app.innerHTML = `
        <div class="screen" style="justify-content: center; align-items: center; text-align: center;">
            <h1 style="color: var(--color-primary); font-size: 2.5rem; margin-bottom: 2rem;">模擬大兵</h1>
            <div class="card" style="width: 100%; max-width: 400px; margin: 0 auto;">
                <h2 style="margin-bottom: 1.5rem;">登入</h2>
                <input type="text" id="usernameInput" class="input-field" placeholder="輸入您的名字" />
                <button class="btn-primary" onclick="handleLogin()">開始登入</button>
                 <div style="margin-top: 1.5rem;">
                    <p style="color: #666; margin-bottom: 1rem;">或使用</p>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary">Google</button>
                        <button class="btn-secondary">Facebook</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderCreateRole() {
    app.innerHTML = `
        <div class="screen" style="justify-content: center;">
            <div style="max-width: 500px; margin: 0 auto; width: 100%;">
                <h2 style="text-align: center; color: var(--color-secondary); margin-bottom: 1.5rem;">建立角色</h2>
                <div class="card">
                    <p style="margin-bottom: 1.5rem; line-height: 1.6;">歡迎來到部隊。為了計算你的退伍日期，請輸入你的入伍日期。</p>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--color-primary);">入伍日期</label>
                    <input type="date" id="dateInput" class="input-field" required />
                    <button class="btn-primary" onclick="handleCreateRole()">確認並開始</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderDashboard() {
    // Calculcate dates
    const today = new Date();
    const start = new Date(state.user.enlistDate);
    // Mock 4 months service
    const end = new Date(start);
    end.setMonth(end.getMonth() + 4);

    // Safety check needed if date invalid
    if (isNaN(start.getTime())) {
        // Fallback or just don't crash
    }

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, totalDays - daysPassed);
    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    // Dashboard using new Layout Structure
    app.innerHTML = `
        <div class="screen dashboard-screen">
            <div class="dashboard-layout">
                <!-- Left Panel: Info -->
                <div class="dashboard-left">
                    <header class="header">
                        <div>
                            <h1 style="color: var(--color-primary); font-size: 1.5rem; font-weight: bold;">${state.user.username}</h1>
                            <p style="font-size: 1rem; color: #666;">${state.user.rank}</p>
                        </div>
                        <div style="background-color: #FFF8E1; padding: 6px 14px; border-radius: 20px; color: #B7791F; display: flex; align-items: center; gap: 6px; box-shadow: inset 0 0 0 1px #FDE68A;">
                            <span>💰</span>
                            <b>${state.coins}</b>
                        </div>
                    </header>

                    <div class="card countdown-card">
                        <h2 style="font-size: 1rem; color: #666; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">距離退伍還有</h2>
                        <div class="days-left-number" style="font-size: 3.5rem; font-weight: 800; color: var(--color-primary); line-height: 1.2; margin-bottom: 1rem;">
                            ${daysLeft} <span style="font-size: 1.5rem; font-weight: 600;">天</span>
                        </div>
                        <div style="width: 100%; height: 12px; background-color: #E5E7EB; border-radius: 6px; overflow: hidden; margin-bottom: 1rem;">
                            <div style="width: ${progress}%; height: 100%; background-color: var(--color-primary); transition: width 1s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #6B7280;">
                            <span>目前進度: ${progress.toFixed(1)}%</span>
                            <span>總役期: ${totalDays} 天</span>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Menu Grid -->
                <div class="dashboard-right-menu">
                    <button onclick="navigateTo('tasks')" class="grid-item">
                        <i data-lucide="clipboard-list" color="#4B5563" size="36"></i>
                        <span style="font-weight: 600; color: #4B5563; font-size: 1.1rem;">每日任務</span>
                    </button>
                    <button onclick="navigateTo('knowledge')" class="grid-item">
                        <i data-lucide="book-open" color="#2563EB" size="36"></i>
                        <span style="font-weight: 600; color: #4B5563; font-size: 1.1rem;">知識問答</span>
                    </button>
                    <button onclick="navigateTo('game')" class="grid-item">
                        <i data-lucide="gamepad-2" color="#DC2626" size="36"></i>
                        <span style="font-weight: 600; color: #4B5563; font-size: 1.1rem;">大兵狂想曲</span>
                    </button>
                    <button onclick="navigateTo('store')" class="grid-item">
                        <i data-lucide="shopping-bag" color="#D97706" size="36"></i>
                        <span style="font-weight: 600; color: #4B5563; font-size: 1.1rem;">福利社</span>
                    </button>
                    <button onclick="navigateTo('settings')" class="grid-item">
                        <i data-lucide="settings" color="#4B5563" size="36"></i>
                        <span style="font-weight: 600; color: #4B5563; font-size: 1.1rem;">設定</span>
                    </button>
                    <button onclick="handleLogout()" class="grid-item logout-item">
                        <i data-lucide="log-out" color="#EF4444" size="36"></i>
                        <span style="font-weight: 600; color: #EF4444; font-size: 1.1rem;">登出</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderTasks() {
    const taskListHtml = state.tasks.map(task => `
        <div class="task-item" style="opacity: ${task.completed ? 0.7 : 1}">
            <div>
                <h3 style="font-size: 1rem; margin-bottom: 0.25rem; text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.title}</h3>
                <p style="color: #D97706; font-size: 0.875rem;">+${task.reward} 金幣</p>
            </div>
            <button onclick="completeTask(${task.id})" ${task.completed ? 'disabled' : ''}>
                <i data-lucide="${task.completed ? 'check-circle' : 'circle'}" color="${task.completed ? 'var(--color-primary)' : '#ccc'}"></i>
            </button>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="screen">
            <div class="app-container" style="background: white; border-radius: 12px; padding: 1.5rem; min-height: auto;">
                <div class="header">
                    <button class="back-btn" onclick="navigateTo('dashboard')"><i data-lucide="chevron-left"></i></button>
                    <h2 style="font-size: 1.25rem; font-weight: bold;">每日任務</h2>
                    <div style="width: 24px;"></div>
                </div>
                <div style="display: flex; flexDirection: column; gap: 1rem;">
                    ${taskListHtml}
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Reuse similar container wrapper for other pages to look good on desktop
function renderGame() {
    app.innerHTML = `
        <div class="screen">
            <div class="app-container" style="background: white; border-radius: 12px; padding: 1.5rem; min-height: auto;">
                <div class="header">
                    <button class="back-btn" onclick="navigateTo('dashboard')"><i data-lucide="chevron-left"></i></button>
                    <h2 style="font-size: 1.25rem; font-weight: bold;">大兵狂想曲</h2>
                    <div style="width: 24px;"></div>
                </div>
                <div id="game-content" style="text-align: center; margin-top: 2rem;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">情境模擬</h3>
                    <p style="color: #666; margin-bottom: 2rem;">準備好面對軍中的突發狀況了嗎？</p>
                    <button class="btn-primary" onclick="startGameParams()">開始挑戰</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderStore() {
    // Generate Items HTML
    app.innerHTML = `
        <div class="screen">
           <div class="app-container" style="background: white; border-radius: 12px; padding: 1.5rem; min-height: auto;">
             <div class="header">
                 <div style="display:flex; align-items:center">
                    <button class="back-btn" onclick="navigateTo('dashboard')"><i data-lucide="chevron-left"></i></button>
                    <h2 style="font-size: 1.25rem; font-weight: bold;">福利社</h2>
                 </div>
                 <div style="color: #B7791F">💰 ${state.coins}</div>
            </div>
            <div class="store-grid">
                <div class="card" style="display: flex; flex-direction: column; align-items: center; margin:0;">
                    <div style="width: 64px; height: 64px; background-color: #eee; border-radius: 50%; margin-bottom: 1rem;"></div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.25rem">榮譽勳章</h3>
                    <p style="color: #D97706; font-weight: bold; margin-bottom: 1rem;">$500</p>
                    <button class="btn-secondary" style="padding: 8px 16px;">購買</button>
                </div>
                 <div class="card" style="display: flex; flex-direction: column; align-items: center; margin:0;">
                    <div style="width: 64px; height: 64px; background-color: #eee; border-radius: 50%; margin-bottom: 1rem;"></div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.25rem">防蚊液</h3>
                    <p style="color: #D97706; font-weight: bold; margin-bottom: 1rem;">$100</p>
                    <button class="btn-secondary" style="padding: 8px 16px;">購買</button>
                </div>
                 <div class="card" style="display: flex; flex-direction: column; align-items: center; margin:0;">
                    <div style="width: 64px; height: 64px; background-color: #eee; border-radius: 50%; margin-bottom: 1rem;"></div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.25rem">豪華床墊</h3>
                    <p style="color: #D97706; font-weight: bold; margin-bottom: 1rem;">$1000</p>
                    <button class="btn-secondary" style="padding: 8px 16px;">購買</button>
                </div>
            </div>
          </div>
        </div>
    `;
    lucide.createIcons();
}

function renderSettings() {
    app.innerHTML = `
        <div class="screen">
          <div class="app-container" style="background: white; border-radius: 12px; padding: 1.5rem; min-height: auto;">
             <div class="header">
                 <button class="back-btn" onclick="navigateTo('dashboard')"><i data-lucide="chevron-left"></i></button>
                 <h2 style="font-size: 1.25rem; font-weight: bold;">設定</h2>
                 <div style="width: 24px;"></div>
            </div>
            <div class="card">
                <h3 style="color: var(--color-primary); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">個人資料</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="font-size: 0.875rem; color: #666;">姓名</label>
                    <p style="font-size: 1.1rem;">${state.user.username}</p>
                </div>
                <div>
                     <label style="font-size: 0.875rem; color: #666;">入伍日期</label>
                    <p style="font-size: 1.1rem;">${state.user.enlistDate}</p>
                </div>
            </div>
          </div>
        </div>
    `;
    lucide.createIcons();
}

function renderKnowledge() {
    app.innerHTML = `
        <div class="screen">
          <div class="app-container" style="background: white; border-radius: 12px; padding: 1.5rem; min-height: auto;">
            <div class="header">
                 <button class="back-btn" onclick="navigateTo('dashboard')"><i data-lucide="chevron-left"></i></button>
                 <h2 style="font-size: 1.25rem; font-weight: bold;">知識問答</h2>
                 <div style="width: 24px;"></div>
            </div>
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--color-primary); margin-bottom: 1rem;">熱門文章</h3>
                <div class="card" style="margin-bottom: 0.75rem;">
                    <span style="font-size: 0.75rem; background: #eee; padding: 2px 6px; border-radius: 4px;">新訓</span>
                    <h4 style="margin-top: 0.5rem;">新訓流程懶人包</h4>
                </div>
                <div class="card" style="margin-bottom: 0.75rem;">
                    <span style="font-size: 0.75rem; background: #eee; padding: 2px 6px; border-radius: 4px;">內務</span>
                    <h4 style="margin-top: 0.5rem;">內務整理技巧：棉被怎麼折？</h4>
                </div>
            </div>
          </div>
        </div>
    `;
    lucide.createIcons();
}

// --- Logic ---

function navigateTo(screen) {
    if (screen !== 'login' && screen !== 'createRole') {
        if (!state.user) {
            renderLogin();
            return;
        }
        if (!state.user.enlistDate) {
            renderCreateRole();
            return;
        }
    }

    switch (screen) {
        case 'login': renderLogin(); break;
        case 'createRole': renderCreateRole(); break;
        case 'dashboard': renderDashboard(); break;
        case 'tasks': renderTasks(); break;
        case 'game': renderGame(); break;
        case 'store': renderStore(); break;
        case 'settings': renderSettings(); break;
        case 'knowledge': renderKnowledge(); break;
        default: renderLogin();
    }
}

function handleLogin() {
    const input = document.getElementById('usernameInput');
    if (input.value.trim()) {
        state.user = {
            username: input.value,
            rank: '二等兵',
            enlistDate: null
        };
        state.save();
        navigateTo('createRole');
    }
}

function handleCreateRole() {
    const date = document.getElementById('dateInput').value;
    if (date) {
        state.user.enlistDate = date;
        state.save();
        navigateTo('dashboard');
    }
}

function handleLogout() {
    // Check if modal already exists
    if (document.getElementById('logout-modal')) return;

    const modalHtml = `
        <div id="logout-modal" class="modal-overlay">
            <div class="modal-content">
                <h3 style="font-size: 1.5rem; color: var(--color-secondary); margin-bottom: 1rem;">確定要登出嗎？</h3>
                <p style="color: #666; margin-bottom: 0.5rem;">登出後您將需要重新登入才能繼續。</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeLogoutModal()">取消</button>
                    <button class="btn-primary" style="background-color: #EF4444;" onclick="confirmLogout()">確定登出</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) modal.remove();
}

function confirmLogout() {
    state.user = null;
    state.save();
    closeLogoutModal();
    navigateTo('login');
}

function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
        task.completed = true;
        state.coins += task.reward;
        state.save();
        renderTasks();
    }
}

function startGameParams() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div style="text-align: left;">
            <div class="card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">營站購物遭遇戰</h3>
                <p>長官經過時，你正在營站買飲料。你應該：</p>
            </div>
            <div style="display: flex; flexDirection: column; gap: 1rem;">
                <button class="btn-secondary" onclick="answerGame(true)">A. 大聲問好</button>
                <button class="btn-secondary" onclick="answerGame(false)">B. 裝作沒看到繼續買</button>
                <button class="btn-secondary" onclick="answerGame(false)">C. 轉身逃跑</button>
            </div>
        </div>
    `;
}

function answerGame(isCorrect) {
    const gameContent = document.getElementById('game-content');
    if (isCorrect) {
        state.coins += 20;
        state.save();
        gameContent.innerHTML = `
            <div style="padding: 2rem; background-color: #F0FDF4; border-radius: var(--radius-lg); text-align: center;">
                <h3 style="color: #16A34A; font-size: 1.5rem; margin-bottom: 1rem;">判斷正確！</h3>
                <p>見到長官應主動問好，這是基本禮節。</p>
                <p style="font-weight: bold; color: #DAA520; margin: 1.5rem 0;">+20 金幣</p>
                <button class="btn-primary" onclick="renderGame()">再來一次</button>
            </div>
        `;
    } else {
        gameContent.innerHTML = `
            <div style="padding: 2rem; background-color: #FEF2F2; border-radius: var(--radius-lg); text-align: center;">
                <h3 style="color: #DC2626; font-size: 1.5rem; margin-bottom: 1rem;">大兵，你找死嗎？</h3>
                <p>見到長官應主動問好，這是基本禮節。</p>
                <button class="btn-primary" style="margin-top: 1.5rem;" onclick="renderGame()">再來一次</button>
            </div>
        `;
    }
}

if (state.user) {
    if (state.user.enlistDate) navigateTo('dashboard');
    else navigateTo('createRole');
} else {
    navigateTo('login');
}
