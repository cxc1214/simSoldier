/**
 * SIMSOLDIER - 大兵狂想曲 (Rhythm Game)
 * Zero Modification 規範：此腳本為獨立模組，不會覆寫現有任何 js 檔案。
 * 外部對接接口：window.RhythmGame.processPose(landmarks)
 */

const AUDIO_PATH = 'assets/audio/Taiwan Flag Anthem 國旗歌 (Divyns Remix).mp3';

const DigitalAssets = {
    'Reporting': {
        id: 'Reporting',
        name: '舉手答有',
        imageCount: 4,
        desc: `A.聞動令，舉右手，舉臂時大臂帶動小臂往上，手臂貼近耳際，手握拳、拳眼朝後、拳心向內、拳面頂平。
B.聞「手放下」口令，右手迅速自然放下，成立正姿勢。`
    },
    'kneel': {
        id: 'kneel',
        name: '蹲下',
        imageCount: 4,
        desc: `聞口令，左(右)腳順腳尖方向踏出30~40公分，身體蹲下，左(右)腳全腳掌著地，右(左)腳跟離地，體重置於右(左)腿，兩手掌心向下自然分置兩膝，上體保持正直。`
    },
    'turn': {
        id: 'turn',
        name: '停止間轉法',
        imageCount: 0,
        desc: `Ａ.向右（左）轉：以右（左）腳跟為軸向右（左）旋轉九十度，左（右）腳靠攏。
Ｂ.向後轉：右腳順原方向後引，以兩腳跟為軸向右旋轉一百八十度，右腳靠攏。`
    },
    'At_Ease': {
        id: 'At_Ease',
        name: '稍息',
        imageCount: 4,
        desc: `聞口令，左腳向左橫移三十公分，體重落於兩腳；同時兩臂向後，左手握右手置於腰帶下緣，上體正直。`
    },
    'Attention': {
        id: 'Attention',
        name: '立正',
        imageCount: 4,
        desc: `兩腳跟靠攏併齊，腳尖外分45度；上體正直微向前傾；小腹後收，胸部前挺；兩臂自然下垂，雙手中指貼於大腿外側。`
    },
    'Mark_Time': {
        id: 'Mark_Time',
        name: '原地跑步',
        imageCount: 4,
        desc: `A.預令：兩手握拳提向腰際。B.動令：先提左腳踏落，續提右腳，按照步速交互起落，兩臂自然擺動。`
    },
    'Salute': {
        id: 'Salute',
        name: '敬禮',
        imageCount: 2,
        desc: `Ａ.聞「敬禮」口令，舉右手小臂向上彎曲，中指及食指輕倚於帽簷右側四分之一處（未戴帽時倚於右眼眉梢），掌心稍向外，上臂與肩同高，向受禮者注目。\nＢ.聞「禮畢」口令，右手迅速自然放下，成立正姿勢。`
    },
    'Turning_on_the_March': {
        id: 'Turning_on_the_March',
        name: '行進間轉法',
        imageCount: 4,
        desc: `左(右)腳向前半步，以兩腳前腳掌為軸旋轉90度(半面45度)，同時邁出反向腳向新方向行進。`
    }
};

// 測試用譜面 (Dummy Beatmap for Taiwan Flag Anthem)
// time: 音樂時間(秒), duration: 動作維持/判定區間(秒)
const Beatmap = [
    { time: 2.0, action: 'Attention', duration: 1.5 },
    { time: 4.5, action: 'At_Ease', duration: 1.5 },
    { time: 7.0, action: 'Attention', duration: 1.0 },
    { time: 9.0, action: 'Reporting', duration: 1.0 },

    // 主歌開始
    { time: 13.0, action: 'Salute', duration: 2.0 },
    { time: 16.5, action: 'Attention', duration: 1.0 },
    { time: 19.0, action: 'turn', duration: 1.5 },

    // 副歌開始 (幅度變大)
    { time: 23.0, action: 'kneel', duration: 2.5 },
    { time: 27.0, action: 'Mark_Time', duration: 3.0 },
    { time: 31.0, action: 'Turning_on_the_March', duration: 2.0 },
    { time: 34.0, action: 'Reporting', duration: 1.5 },
    { time: 37.0, action: 'Attention', duration: 2.0 },
    // 日後可自由擴充陣列
];

class RhythmGameEngine {
    constructor() {
        this.isActive = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.audio = new Audio(AUDIO_PATH);
        this.currentNoteIndex = 0;
        this.activeNotes = [];
        this.lastFrameTime = 0;
        this.latestPose = null;
        this.isPreview = false;
        this.isPaused = false;

        // DOM Elements (將在 init 中綁定)
        this.dom = {
            view: null,
            trackZone: null,
            scoreBoard: null,
            comboBoard: null,
            judgment: null,
            resultScreen: null,
            finalScore: null,
            finalRank: null
        };
    }

    init() {
        this.dom.view = document.getElementById('rhapsody-game-stage');
        this.dom.trackZone = document.getElementById('rhythm-track-zone');
        this.dom.scoreBoard = document.getElementById('rhythm-score');
        this.dom.comboBoard = document.getElementById('rhythm-combo');
        this.dom.judgment = document.getElementById('rhythm-judgment');
        this.dom.resultScreen = document.getElementById('rhythm-result-screen');
        this.dom.finalScore = document.getElementById('rhythm-final-score');
        this.dom.finalRank = document.getElementById('rhythm-final-rank');
        this.dom.finalCombo = document.getElementById('rhythm-final-combo');

        // 綁定結束事件
        this.audio.addEventListener('ended', () => this.endGame());
    }

    openPreviewMode() {
        document.getElementById('rhapsody-lobby').classList.add('hidden');
        document.getElementById('rhapsody-preview').classList.remove('hidden');
        this.isPreview = true;

        // 將攝影機綁定到 Preview 畫布
        if (window.SharedAI) window.SharedAI.startCamera();
        const trainingCanvasContainer = document.getElementById('training-canvas-container');
        const previewBg = document.getElementById('rhythm-preview-bg');
        if (trainingCanvasContainer && previewBg) {
            previewBg.innerHTML = '';
            previewBg.appendChild(trainingCanvasContainer);
            trainingCanvasContainer.className = "absolute inset-0 w-full h-full";
        }

        this.dom.previewPose = document.getElementById('rhythm-preview-pose');
    }

    closePreviewMode() {
        document.getElementById('rhapsody-lobby').classList.remove('hidden');
        document.getElementById('rhapsody-preview').classList.add('hidden');
        this.isPreview = false;

        if (window.SharedAI) window.SharedAI.stopCamera();
        const trainingCanvasContainer = document.getElementById('training-canvas-container');
        const trainingCameraWrapper = document.getElementById('training-camera-wrapper');
        if (trainingCanvasContainer && trainingCameraWrapper) {
            trainingCanvasContainer.className = "relative w-full aspect-video bg-black rounded overflow-hidden";
            trainingCameraWrapper.appendChild(trainingCanvasContainer);
        }
    }

    startCountdown() {
        // UI 切換: 從 preview 切到正式畫布
        document.getElementById('rhapsody-preview').classList.add('hidden');
        this.dom.view.classList.remove('hidden');

        const overlay = document.getElementById('rhapsody-countdown');
        overlay.classList.remove('hidden');
        const numText = document.getElementById('rhapsody-countdown-num');

        let count = 3;
        numText.textContent = count;

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                numText.textContent = count;
            } else if (count === 0) {
                numText.textContent = 'GO!';
            } else {
                clearInterval(timer);
                overlay.classList.add('hidden');

                // 從 Preview 將畫布移交給真正的遊戲空間
                this.isPreview = false;
                const trainingCanvasContainer = document.getElementById('training-canvas-container');
                const myVideoBg = document.getElementById('rhythm-video-bg');
                if (trainingCanvasContainer && myVideoBg) {
                    myVideoBg.innerHTML = '';
                    myVideoBg.appendChild(trainingCanvasContainer);
                }

                this.startGameLoop();
            }
        }, 1000);
    }

    startGameLoop() {
        this.isActive = true;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentNoteIndex = 0;
        this.activeNotes = [];
        this.dom.trackZone.innerHTML = ''; // 清空軌道

        this.updateScoreBoard();
        this.audio.currentTime = 0;
        this.audio.play();

        requestAnimationFrame((now) => {
            this.lastFrameTime = now;
            this.gameLoop(now);
        });
    }

    togglePause() {
        if (!this.isActive) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.audio.pause();
            document.getElementById('rhapsody-pause-menu').classList.remove('hidden');
        } else {
            this.audio.play();
            document.getElementById('rhapsody-pause-menu').classList.add('hidden');
            requestAnimationFrame((now) => {
                this.lastFrameTime = now;
                this.gameLoop(now);
            });
        }
    }

    restartGame() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPaused = false;
        document.getElementById('rhapsody-pause-menu').classList.add('hidden');
        this.isActive = false;
        this.dom.view.classList.add('hidden');
        this.dom.resultScreen.classList.add('hidden');
        this.activeNotes = [];
        this.dom.trackZone.innerHTML = '';

        // 返回大廳但不直接重開，讓玩家自己點擊
        this.closePreviewMode();
    }

    gameLoop(now) {
        if (!this.isActive || this.isPaused) return;

        // 絕對依賴音訊時間作為基準
        const currentTime = this.audio.currentTime;

        // 1. 生成音符 (預先生成前方 2.5 秒的音符)
        const PRE_SPAWN_TIME = 2.5;
        while (this.currentNoteIndex < Beatmap.length && Beatmap[this.currentNoteIndex].time <= currentTime + PRE_SPAWN_TIME) {
            this.spawnNote(Beatmap[this.currentNoteIndex]);
            this.currentNoteIndex++;
        }

        // 2. 移動音符與判定
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            const timeDiff = noteObj.config.time - currentTime;

            // X 軸計算 (從右到左捲動)
            // 假設判定線在 trackZone 左側 50px 處
            const hitZoneX = 50;
            const xPos = hitZoneX + (timeDiff * this.speed);
            noteObj.element.style.transform = `translateX(${xPos}px)`;

            // Hit 判定點區間 (+/- 0.4 秒)
            if (timeDiff > -0.4 && timeDiff < 0.4 && !noteObj.isHit) {
                noteObj.element.classList.add('border-green-400', 'border-2', 'shadow-[0_0_15px_#4ade80]');
                const judgment = this.evaluatePose(noteObj.config.action);
                if (judgment) {
                    this.applyJudgment(judgment, noteObj);
                }
            } else if (timeDiff < -0.4 && !noteObj.isHit) {
                // Miss 過期
                this.applyJudgment('Miss', noteObj);
            }
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    spawnNote(config) {
        const el = document.createElement('div');
        el.className = 'absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-stone-800 rounded-lg flex items-center justify-center text-xs font-bold text-stone-300 border border-stone-600 transition-colors pointer-events-none shadow-lg whitespace-pre-wrap text-center leading-tight';
        el.textContent = DigitalAssets[config.action].name;

        this.dom.trackZone.appendChild(el);

        this.activeNotes.push({
            config: config,
            element: el,
            isHit: false
        });
    }

    // 將外部傳來的 Pose 資料暫存
    processPose(landmarks, ctx) {
        if (this.isActive) {
            this.latestPose = landmarks;
        } else if (this.isPreview) {
            const detected = this.detectSimplePoseDetailed(landmarks);
            if (this.dom.previewPose) {
                let colorClass = 'text-red-500 drop-shadow-[0_0_10px_#ef4444]';
                if (detected.matchedAction !== '未偵測') {
                    colorClass = 'text-green-400 drop-shadow-[0_0_10px_#4ade80]';
                }
                this.dom.previewPose.className = `text-4xl font-bold transition-colors ${colorClass}`;
                this.dom.previewPose.textContent = detected.matchedAction;
            }

            // [可註解區塊] 準備畫面中的各個動作判斷值 Debug UI
            if (ctx) {
                this.drawDebugOverlay(ctx, detected.debugVals);
            }
        }
    }

    // [Preview 模式專用] 帶有 Debug 數值的詳細動作辨識
    detectSimplePoseDetailed(lm) {
        if (!lm || lm.length < 33) return { matchedAction: "未偵測", debugVals: [] };

        const rw = lm[16], rs = lm[12], rear = lm[8], rh = lm[24], rk = lm[26];
        const lw = lm[15], ls = lm[11], lh = lm[23], lk = lm[25];

        let matched = null;

        // 蹲下高度差
        const kneelDiff = Math.min(lk.y - lh.y, rk.y - rh.y); // 平常約 0.4。向下 <0.15 達標, <0.25 接近
        const isKneel = kneelDiff < 0.15;
        if (isKneel) matched = "蹲下";

        // 舉手/敬禮 高度差與距離
        const reportDiff = rw.y - rs.y; // 平常為正(手在下)，舉手 < -0.1 達標, < 0.0 接近。
        const saluteDist = Math.hypot(rw.x - rear.x, rw.y - rear.y); // <0.15 達標, < 0.25 接近
        const isReport = reportDiff < -0.1;

        if (!matched && isReport) {
            if (saluteDist < 0.15) matched = "敬禮";
            else matched = "舉手答有";
        }

        // 原地跑步落差
        const markTimeDiff = Math.abs(lk.y - rk.y); // 平常 0.0。 > 0.08 達標, >0.04 接近
        if (!matched && markTimeDiff > 0.08) matched = "原地跑步";

        if (!matched) matched = "立正 / 稍息";

        // 整理 Debug 數值，用於畫在畫布上
        const debugVals = [
            { name: "蹲下高度差", val: kneelDiff.toFixed(2), target: "< 0.15", isGreen: kneelDiff < 0.15, isYellow: kneelDiff < 0.25 },
            { name: "舉手高度差", val: reportDiff.toFixed(2), target: "< -0.10", isGreen: reportDiff < -0.1, isYellow: reportDiff < 0.0 },
            { name: "敬禮距離", val: saluteDist.toFixed(2), target: "< 0.15", isGreen: saluteDist < 0.15, isYellow: saluteDist < 0.25 },
            { name: "跑步膝蓋落差", val: markTimeDiff.toFixed(2), target: "> 0.08", isGreen: markTimeDiff > 0.08, isYellow: markTimeDiff > 0.04 },
        ];

        return { matchedAction: matched, debugVals };
    }

    // 在畫面上繪製測試數據
    drawDebugOverlay(ctx, debugVals) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(10, 10, 220, 140);

        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        ctx.fillText("📌 動作閾值測試儀表板", 20, 20);

        let startY = 45;
        debugVals.forEach((item) => {
            // 決定顏色：達標(綠) > 接近(黃) > 未達標(紅)
            if (item.isGreen) ctx.fillStyle = "#4ade80";
            else if (item.isYellow) ctx.fillStyle = "#facc15";
            else ctx.fillStyle = "#f87171";

            ctx.fillText(`${item.name}: ${item.val} (目標 ${item.target})`, 20, startY);
            startY += 20;
        });

        ctx.restore();
    }

    // 評估骨架與目標動作的誤差 (動態計分系統)
    evaluatePose(targetActionId) {
        if (!this.latestPose || this.latestPose.length === 0) return null;

        // 輕量化數學：已在 detectSimplePoseDetailed 中實作
        const detected = this.detectSimplePoseDetailed(this.latestPose);
        const targetActionName = DigitalAssets[targetActionId].name;

        // 只要任一瞬間的預測結果相符，給予成功判定。此處簡化均給予 Perfect。
        if (detected.matchedAction === targetActionName) {
            return 'Perfect';
        }

        return null;
    }

    applyJudgment(type, noteObj) {
        noteObj.isHit = true;
        noteObj.element.classList.add('opacity-0', 'scale-150'); // 漸隱動畫

        // 0.2 秒後移除 DOM
        setTimeout(() => {
            if (noteObj.element.parentElement) noteObj.element.parentElement.removeChild(noteObj.element);
            this.activeNotes = this.activeNotes.filter(n => n !== noteObj);
        }, 200);

        this.dom.judgment.textContent = type;
        this.dom.judgment.classList.remove('hidden', 'animate-ping');
        // Force reflow for animation
        void this.dom.judgment.offsetWidth;

        if (type === 'Perfect') {
            this.score += 100 * (1 + (this.combo * 0.1));
            this.combo++;
            this.dom.judgment.className = "absolute top-1/4 left-1/2 -translate-x-1/2 text-5xl font-bold font-italic text-yellow-400 drop-shadow-[0_0_10px_#facc15] animate-bounce z-50";
        } else if (type === 'Good') {
            this.score += 50 * (1 + (this.combo * 0.1));
            this.combo++;
            this.dom.judgment.className = "absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl font-bold font-italic text-green-400 drop-shadow-[0_0_10px_#4ade80] animate-pulse z-50";
        } else {
            this.combo = 0;
            this.dom.judgment.className = "absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl font-bold font-italic text-red-500 drop-shadow-[0_0_10px_#ef4444] z-50";
        }

        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        this.updateScoreBoard();

        setTimeout(() => {
            this.dom.judgment.classList.add('hidden');
        }, 500);
    }

    updateScoreBoard() {
        this.dom.scoreBoard.textContent = Math.floor(this.score).toString().padStart(6, '0');
        this.dom.comboBoard.textContent = this.combo;
    }

    endGame() {
        this.isActive = false;
        this.dom.view.classList.add('hidden');
        this.dom.resultScreen.classList.remove('hidden');

        this.dom.finalScore.textContent = Math.floor(this.score);
        this.dom.finalCombo.textContent = this.maxCombo;

        // 計算 Rank (假設滿分大約 3000)
        let rank = 'C';
        if (this.score > 2000) rank = 'S';
        else if (this.score > 1200) rank = 'A';
        else if (this.score > 600) rank = 'B';

        this.dom.finalRank.textContent = rank;

        // 賦予特殊顏色
        const rankColors = { 'S': 'text-yellow-400', 'A': 'text-purple-400', 'B': 'text-blue-400', 'C': 'text-stone-400' };
        this.dom.finalRank.className = `text-8xl font-bold mb-4 drop-shadow-2xl ${rankColors[rank]}`;
    }

    quitGame() {
        this.isActive = false;
        this.audio.pause();
        this.dom.view.classList.add('hidden');
        this.dom.resultScreen.classList.add('hidden');
        document.getElementById('rhapsody-lobby').classList.remove('hidden');

        // 【核心修正】關閉攝影機並將 Canvas 歸還原位
        if (window.SharedAI) window.SharedAI.stopCamera();
        const trainingCanvasContainer = document.getElementById('training-canvas-container');
        const trainingCameraWrapper = document.getElementById('training-camera-wrapper');
        if (trainingCanvasContainer && trainingCameraWrapper) {
            // 還原為原本的大小
            trainingCanvasContainer.className = "relative w-full aspect-video bg-black rounded overflow-hidden";
            // 放回 #view-training 的原位
            trainingCameraWrapper.appendChild(trainingCanvasContainer);
        }
    }
}

// 建立全域物件
window.RhythmGame = new RhythmGameEngine();

// ======= 教學大廳渲染邏輯 ======= //
function initTutorialCarousel() {
    const selector = document.getElementById('tutorial-action-selector');
    const displayZone = document.getElementById('tutorial-display-zone');
    const descText = document.getElementById('tutorial-desc');

    // 建立按鈕
    Object.keys(DigitalAssets).forEach(key => {
        const asset = DigitalAssets[key];
        const btn = document.createElement('button');
        btn.className = 'px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-stone-200 border border-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[120px]';
        btn.textContent = asset.name;
        btn.onclick = () => renderTutorialContent(key);
        selector.appendChild(btn);
    });

    // 渲染函數
    function renderTutorialContent(key) {
        const asset = DigitalAssets[key];
        displayZone.innerHTML = ''; // 清空
        descText.innerHTML = `<strong class="text-green-400">${asset.name} 動作要領：</strong><br>${asset.desc.replace(/\\n/g, '<br>')}`;

        if (asset.imageCount === 0) {
            // 純文字替代畫面
            displayZone.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-stone-900 border border-stone-800 rounded-lg p-6 text-center">
                <i class="fa-solid fa-person-military-pointing text-6xl mb-4"></i>
                <p>純文字講義模式</p>
                <p class="text-sm">此動作無搭配影像，請熟讀要領。</p>
            </div>`;
        } else {
            // 建構輪播結構
            const container = document.createElement('div');
            container.className = 'w-full h-full relative overflow-hidden bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-center';

            // 嘗試載入圖片 (這裡只用數字作為檔案名，需放在您指定的目錄下)
            // 由於目前不確定精確的圖片目錄，這裏寫 relative
            // 如果讀取不到，會有 object-fit 特性保證版面不崩潰
            for (let i = 1; i <= asset.imageCount; i++) {
                const img = document.createElement('img');
                img.src = `assets/images/pose/${key}/${i}.png`; // 預設路徑結構
                img.className = 'absolute inset-0 w-full h-full object-contain transition-opacity duration-500 opacity-0';
                img.alt = `${asset.name} 步驟 ${i}`;
                container.appendChild(img);
            }
            displayZone.appendChild(container);

            // 簡易輪播動畫
            let currentIndex = 0;
            const images = container.querySelectorAll('img');
            if (images.length > 0) {
                images[0].classList.remove('opacity-0');

                // 將計時器存在 element 上方便清除 (若切換動作)
                if (displayZone.intervalId) clearInterval(displayZone.intervalId);
                displayZone.intervalId = setInterval(() => {
                    images[currentIndex].classList.add('opacity-0');
                    currentIndex = (currentIndex + 1) % images.length;
                    images[currentIndex].classList.remove('opacity-0');
                }, 15000);
            }
        }
    }

    // 初始化第一個動作
    if (Object.keys(DigitalAssets).length > 0) {
        renderTutorialContent(Object.keys(DigitalAssets)[0]);
    }
}

// 頁面載入時綁定事件
document.addEventListener('DOMContentLoaded', () => {
    initTutorialCarousel();
    window.RhythmGame.init();

    // 綁定 UI 按鈕
    const btnStart = document.getElementById('btn-rhapsody-start'); // 大廳按鈕 -> 開啟預備預覽
    if (btnStart) btnStart.addEventListener('click', () => window.RhythmGame.openPreviewMode());

    const btnRealStart = document.getElementById('btn-rhapsody-real-start'); // 預備畫面按鈕 -> 正式開始
    if (btnRealStart) btnRealStart.addEventListener('click', () => window.RhythmGame.startCountdown());

    const btnPreviewClose = document.getElementById('btn-rhapsody-preview-close');
    if (btnPreviewClose) btnPreviewClose.addEventListener('click', () => window.RhythmGame.closePreviewMode());

    // 遊戲中的 Pause 按鈕與覆蓋層選項
    const btnPause = document.getElementById('btn-rhythm-pause');
    if (btnPause) btnPause.addEventListener('click', () => window.RhythmGame.togglePause());

    const btnResume = document.getElementById('btn-rhythm-resume');
    if (btnResume) btnResume.addEventListener('click', () => window.RhythmGame.togglePause());

    const btnRestart = document.getElementById('btn-rhythm-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => window.RhythmGame.restartGame());

    const btnQuitNow = document.getElementById('btn-rhythm-quit-now');
    if (btnQuitNow) btnQuitNow.addEventListener('click', () => window.RhythmGame.quitGame());

    const btnQuit = document.getElementById('btn-rhapsody-quit');
    if (btnQuit) btnQuit.addEventListener('click', () => window.RhythmGame.quitGame());

    // 圖鑑開啟與關閉 (修正：同時隱藏/顯示大廳)
    const btnTutorialOpen = document.getElementById('btn-rhapsody-tutorial-open');
    const btnTutorialClose = document.getElementById('btn-rhapsody-tutorial-close');
    const tutorialView = document.getElementById('rhapsody-tutorial');
    const lobbyView = document.getElementById('rhapsody-lobby');

    if (btnTutorialOpen && tutorialView) {
        btnTutorialOpen.addEventListener('click', () => {
            tutorialView.classList.remove('hidden');
            if (lobbyView) lobbyView.classList.add('hidden');
        });
    }
    if (btnTutorialClose && tutorialView) {
        btnTutorialClose.addEventListener('click', () => {
            tutorialView.classList.add('hidden');
            if (lobbyView) lobbyView.classList.remove('hidden');
        });
    }
});
