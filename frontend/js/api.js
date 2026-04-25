/**
 * SIMSOLDIER API CLIENT
 * 負責所有資料存取 (已串接 FastAPI 後端)
 */

const DB_KEY = 'simSoldier_users';
const SESSION_KEY = 'simSoldier_token';

function getLocalUsers() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}

function saveLocalUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

export const api = {
    /**
     * 內部 Fetch 封裝 (包含 Timeout 處理)
     */
    async _fetch(url, options = {}, timeout = 15000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('伺服器連線逾時，請檢查網路或後端狀態');
            }
            throw error;
        }
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 登入
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        try {
            // FastAPI OAuth2PasswordRequestForm expects form data
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const res = await this._fetch('http://localhost:8000/api/login', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '帳號或密碼錯誤');
            }

            const data = await res.json();
            // 存儲 JWT Token
            localStorage.setItem(SESSION_KEY, data.access_token);
            // 同時記錄用戶名供 UI 顯示
            localStorage.setItem('simSoldier_username', username);

            return { success: true, username };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 檢查帳號是否存在
     * @param {string} username 
     */
    async checkUsernameExists(username) {
        await this._delay(300);
        const users = getLocalUsers();
        return !!users[username];
    },

    /**
     * 註冊
     * @param {object} params { username, password, profile: {...} }
     */
    async register({ username, password, profile }) {
        try {
            const res = await this._fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    role: profile.role === 'disability' ? 2 : 1,
                    date_of_birth: profile.birthday,
                    height: parseInt(profile.height),
                    weight: parseInt(profile.weight),
                    entrance_date: profile.date,
                    do_have_chronic_medications: profile.medication === true || profile.isMedicated === 'yes'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '註冊失敗');
            }

            return await this.login(username, password);
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 取得目前使用者資料
     */
    async getMe() {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            if (!token) throw new Error('Not logged in');

            const res = await this._fetch('http://localhost:8000/api/user_info', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem(SESSION_KEY);
                    throw new Error('Not logged in');
                }
                throw new Error('無法取得使用者資料');
            }

            const data = await res.json();
            return {
                username: data.username,
                profile: {
                    name: data.username,
                    date: data.entrance_date,
                    birthday: data.date_of_birth,
                    role: data.role === 2 ? 'disability' : 'regular',
                    height: data.height,
                    weight: data.weight,
                    medication: data.do_have_chronic_medications,
                    gold: data.game_currency
                }
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 更新使用者 Profile
     * @param {object} newProfile 
     */
    async updateProfile(profile) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            if (!token) throw new Error('Not logged in');

            const res = await this._fetch('http://localhost:8000/api/user_edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: profile.name,
                    date_of_birth: profile.birthday,
                    height: parseInt(profile.height),
                    weight: parseInt(profile.weight),
                    entrance_date: profile.date,
                    do_have_chronic_medications: profile.medication
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '更新失敗');
            }

            const json_res = await res.json();
            if (profile.name && profile.name !== localStorage.getItem('simSoldier_username')) {
                json_res._nameChanged = true;
            }
            return json_res;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 登出
     */
    logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('simSoldier_username');
        window.location.href = 'loadingbar.html?dest=login.html';
    },

    /**
     * 檢查是否已登入
     */
    checkAuth() {
        return !!localStorage.getItem(SESSION_KEY);
    },

    /**
     * 取得天兵課堂題庫
     * @param {number} limit 
     */
    async getRandomQuiz(limit = 5) {
        try {
            const res = await this._fetch(`http://localhost:8000/api/quiz/random?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch quiz');
            const data = await res.json();
            return data.map(q => ({
                id: q.id,
                question: q.question,
                options: {
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                },
                answer: q.correct_option,
                explanation: q.explanation,
                source: q.source
            }));
        } catch (e) {
            console.error(e);
            throw new Error('無法取得題庫，請稍後再試');
        }
    },

    /**
     * 開始體能訓練 (獲取 Session)
     */
    async startTraining(exerciseType) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const res = await this._fetch('http://localhost:8000/api/training/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ exercise_type: exerciseType })
            });
            if (!res.ok) throw new Error('無法啟動訓練連線');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw new Error('無法啟動訓練：' + e.message);
        }
    },

    /**
     * 提交訓練結果 (防作弊機制)
     * @param {Object} data {session_token, exercise_type, reps, duration_seconds, rep_timestamps}
     */
    async completeTraining(data) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const res = await this._fetch('http://localhost:8000/api/training/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('上傳訓練紀錄失敗');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw new Error('結算失敗：' + e.message);
        }
    },

    /**
     * 與魔鬼班長 (Gemini) 聊天
     * @param {string} question 
     */
    async askSimSoldier(question) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await this._fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ question })
            });
            if (!res.ok) throw new Error('伺服器連線失敗');
            return await res.json();
        } catch (e) {
            console.error(e);
            return '連線失敗，請稍後再試。';
        }
    }
};
