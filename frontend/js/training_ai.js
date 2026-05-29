/**
 * AI Pose Detection – Multi-Exercise Training Session
 * Exercises: Squat → Push-up → Crunch (3 in total)
 * DB upload happens only after all 3 are completed.
 */

import { api } from './api.js';

// ── Exercise catalogue ──────────────────────────────────────────────────────
const EXERCISES = [
    {
        key: 'squats',
        name: '徒手深蹲 (Squats)',
        targetReps: 3,
        viewHint: '💡 正面或側面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '下蹲至大腿約平行地面', '完全站直完成一次'],
        type: 'squat'
    },
    {
        key: 'pushups',
        name: '伏地挺身 (Push-ups)',
        targetReps: 3,
        viewHint: '💡 側面朝向鏡頭，手臂與身體完整入鏡',
        rules: ['偵測到人體，全身入鏡', '臂彎至胸接近地面', '完全撐起完成一次'],
        type: 'pushup'
    },
    {
        key: 'legraise',
        name: '平躺抬腿 (Leg Raise)',
        targetReps: 3,
        viewHint: '💡 側面平躺，雙腿伸直朝上抬，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '雙腳伸直抬高至約90° (偵測中)', '穩住核心，慢慢放腳回原位計一次'],
        type: 'legraise'
    }
];

// ── DOM cache ────────────────────────────────────────────────────────────────
const ui = {};

function initElements() {
    ui.canvas = document.getElementById('training-canvas');
    if (!ui.canvas) return false;
    ui.ctx = ui.canvas.getContext('2d');
    ui.video = document.getElementById('training-video');
    ui.cameraBtn = document.getElementById('btn-start-camera');
    ui.uploadInput = document.getElementById('training-video-upload');
    ui.overlay = document.getElementById('training-overlay');
    ui.statusText = document.getElementById('ai-status-text');
    ui.exerciseName = document.getElementById('training-exercise-name');
    ui.stepLabel = document.getElementById('training-step-label');
    ui.repCount = document.getElementById('training-rep-count');
    ui.repTarget = document.getElementById('training-rep-target');
    ui.feedback = document.getElementById('training-feedback');
    ui.submitBtn = document.getElementById('btn-submit-training');
    ui.rule1 = document.getElementById('rule-1');
    ui.rule2 = document.getElementById('rule-2');
    ui.rule3 = document.getElementById('rule-3');
    ui.viewHint = document.getElementById('training-view-hint');
    return true;
}

// ── Session / global state ───────────────────────────────────────────────────
let poseTracker = null;
let camera = null;
let isVideoMode = false;
let cameraRunning = false;

let currentExIdx = 0;          // 0=squat, 1=pushup, 2=crunch
let currentReps = 0;
let squatState = 'up';
let lastTransitionTime = 0;     // debounce: ms timestamp of last state change
const DEBOUNCE_DOWN_MS = 300;   // min ms to accept 'down' after 'up' (reduced to avoid dropping fast reps)
const DEBOUNCE_UP_MS = 400;   // min ms to accept 'up' (rep count) after 'down'
let repTimestamps = [];
let sessionToken = null;

// Accumulate results across exercises
const completedResults = [];    // [{session_token, exercise_type, reps, duration_seconds, rep_timestamps}, …]

// ── Helpers ──────────────────────────────────────────────────────────────────
function angle3(a, b, c) {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let deg = Math.abs(r * 180 / Math.PI);
    return deg > 180 ? 360 - deg : deg;
}

function currentExercise() { return EXERCISES[currentExIdx]; }

// ── UI helpers ────────────────────────────────────────────────────────────────
function updateFeedback(msg, textCls = 'text-white', bgCls = 'bg-stone-800') {
    if (!ui.feedback) return;
    ui.feedback.textContent = msg;
    ui.feedback.className = `${textCls} font-bold ${bgCls} px-3 py-1 rounded transition-colors`;
}

function setRules(ex) {
    [ui.rule1, ui.rule2, ui.rule3].forEach((el, i) => {
        if (el) { el.textContent = ex.rules[i]; el.className = 'transition-colors text-stone-400'; }
    });
    if (ui.viewHint) ui.viewHint.textContent = ex.viewHint;
}

function setSubmitLocked(text = '訓練尚未完成') {
    ui.submitBtn.disabled = true;
    ui.submitBtn.innerHTML = `<span class="relative z-10 flex items-center justify-center gap-2"><i class="fa-solid fa-lock"></i> ${text}</span>`;
    ui.submitBtn.className = 'w-full py-4 rounded-xl font-bold text-stone-400 bg-stone-700 cursor-not-allowed transition-all duration-300';
}

function setSubmitNext(label) {
    ui.submitBtn.disabled = false;
    ui.submitBtn.innerHTML = `<span class="relative z-10 flex items-center justify-center gap-2"><i class="fa-solid fa-circle-check"></i> ${label} <i class="fa-solid fa-arrow-right"></i></span>`;
    ui.submitBtn.className = 'w-full py-4 rounded-xl font-bold text-white bg-green-600 cursor-pointer hover:bg-green-500 transition-all duration-300';
}

function setCameraActive(active) {
    if (active) {
        ui.cameraBtn.innerHTML = '<i class="fa-solid fa-video-slash mr-2"></i>關閉鏡頭';
        ui.cameraBtn.className = 'btn-primary bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2';
    } else {
        ui.cameraBtn.innerHTML = '<i class="fa-solid fa-video mr-2"></i>開啟鏡頭';
        ui.cameraBtn.className = 'btn-primary bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2';
    }
}

function loadExerciseUI(idx) {
    const ex = EXERCISES[idx];
    if (ui.exerciseName) ui.exerciseName.textContent = ex.name;
    if (ui.stepLabel) ui.stepLabel.textContent = `第 ${idx + 1} / ${EXERCISES.length} 項`;
    if (ui.repCount) ui.repCount.textContent = '0';
    if (ui.repTarget) ui.repTarget.textContent = `/ ${ex.targetReps}`;
    setRules(ex);
    updateFeedback('請準備...', 'text-yellow-400', 'bg-yellow-900/30');
    setSubmitLocked();
}

function resetExerciseState() {
    currentReps = 0;
    squatState = 'up';
    repTimestamps = [];
    sessionToken = null;
    if (ui.repCount) ui.repCount.textContent = '0';
    [ui.rule1, ui.rule2, ui.rule3].forEach(el => { if (el) el.className = 'transition-colors text-stone-400'; });
    updateFeedback('請準備...', 'text-yellow-400', 'bg-yellow-900/30');
    setSubmitLocked();
}

// ── Backend session ──────────────────────────────────────────────────────────
async function startSession() {
    try {
        const data = await api.startTraining();
        sessionToken = data.session_token;
        console.log('Session started:', sessionToken);
        return true;
    } catch (e) {
        console.error(e);
        updateFeedback('無法連線到伺服器（將繼續本地記錄）', 'text-orange-400', 'bg-orange-900/30');
        return false; // continue without session
    }
}

// ── MediaPipe system ─────────────────────────────────────────────────────────
async function prepareSystem() {
    await startSession();          // Get session token (non-blocking fail ok)
    ui.overlay.classList.add('hidden');
    if (poseTracker) return;

    updateFeedback('載入 AI 模型中...', 'text-blue-400', 'bg-blue-900/30');
    poseTracker = new Pose({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    poseTracker.setOptions({
        modelComplexity: 0, // 改為 0 以大幅提升畫面偵數 (FPS)
        smoothLandmarks: true,
        enableSegmentation: false, smoothSegmentation: false,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
    });
    poseTracker.onResults(onResults);
    await poseTracker.initialize();
    updateFeedback('模型就緒，開始偵測', 'text-green-400', 'bg-green-900/30');
}

// ── Pose callback ─────────────────────────────────────────────────────────────
function onResults(results) {
    if (!ui.ctx) return;
    const w = ui.canvas.width, h = ui.canvas.height;
    ui.ctx.save();
    ui.ctx.clearRect(0, 0, w, h);

    if (!isVideoMode) { ui.ctx.translate(w, 0); ui.ctx.scale(-1, 1); }
    ui.ctx.drawImage(results.image, 0, 0, w, h);

    if (results.poseLandmarks) {
        if (isVideoMode) {
            //測試用節點
            drawConnectors(ui.ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            drawLandmarks(ui.ctx, results.poseLandmarks, { color: '#FF4444', lineWidth: 2, radius: 4 });
        }
        // 配合大兵狂想曲：在預備畫面中顯示骨架
        if (window.RhythmGame && window.RhythmGame.isPreview) {
            drawConnectors(ui.ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#4ade80', lineWidth: 3 }); // 綠色骨架
            drawLandmarks(ui.ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });
        }

        // 配合大兵狂想曲：正式遊戲畫面的骨架 (依照要求先註解掉)
        /*
        if (window.RhythmGame && window.RhythmGame.isActive) {
            drawConnectors(ui.ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#facc15', lineWidth: 3 });
            drawLandmarks(ui.ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });
        }
        */

        ui.ctx.restore(); ui.ctx.save();

        const ex = currentExercise();
        if (currentReps < ex.targetReps) {
            analyzeExercise(results.poseLandmarks, ex.type);
        }
        // 只有非大兵狂想曲模式才顯示普通的訓練 HUD
        if (!window.RhythmGame || (!window.RhythmGame.isPreview && !window.RhythmGame.isActive)) {
            drawHUD(w, h, ex.targetReps);
        }

        // 新增：將骨架資料與 Canvas Context 傳遞給大兵狂想曲引擎
        if (window.RhythmGame && (window.RhythmGame.isActive || window.RhythmGame.isPreview)) {
            window.RhythmGame.processPose(results.poseLandmarks, ui.ctx);
        }
    } else {
        ui.ctx.restore(); ui.ctx.save();
    }
    ui.ctx.restore();
}

// ── HUD overlay ──────────────────────────────────────────────────────────────
function drawHUD(w, h, target) {
    const pad = 12, boxW = 100, boxH = 62, x = w - boxW - pad, y = pad;
    ui.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ui.ctx, x, y, boxW, boxH, 10); ui.ctx.fill();
    ui.ctx.font = 'bold 11px sans-serif'; ui.ctx.fillStyle = '#9ca3af'; ui.ctx.textAlign = 'center';
    ui.ctx.fillText('完成次數', x + boxW / 2, y + 16);
    ui.ctx.font = 'bold 30px sans-serif';
    ui.ctx.fillStyle = currentReps >= target ? '#22c55e' : '#ffffff';
    ui.ctx.fillText(`${currentReps} / ${target}`, x + boxW / 2, y + 52);
}
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ── Exercise analysis dispatch ────────────────────────────────────────────────
function analyzeExercise(lm, type) {
    switch (type) {
        case 'squat': detectSquat(lm); break;
        case 'pushup': detectPushup(lm); break;
        case 'legraise': detectLegRaise(lm); break;
    }
}

// Shared state machine with debounce
function repStateMachine(isDown, isUp) {
    const now = Date.now();
    if (isDown && squatState === 'up' && (now - lastTransitionTime) > DEBOUNCE_DOWN_MS) {
        squatState = 'down';
        lastTransitionTime = now;
        if (ui.rule2) ui.rule2.className = 'transition-colors text-green-400';
        updateFeedback('很好！恢復原位', 'text-green-400', 'bg-green-900/30');
    } else if (isUp && squatState === 'down' && (now - lastTransitionTime) > DEBOUNCE_UP_MS) {
        squatState = 'up';
        lastTransitionTime = now;
        currentReps++;
        if (ui.repCount) ui.repCount.textContent = currentReps;
        repTimestamps.push(now);
        if (ui.rule3) ui.rule3.className = 'transition-colors text-green-400';
        setTimeout(() => {
            if (ui.rule2) ui.rule2.className = 'transition-colors text-stone-400';
            if (ui.rule3) ui.rule3.className = 'transition-colors text-stone-400';
        }, 600);
        checkCompletion();
    } else if (squatState === 'up') {
        updateFeedback('開始動作', 'text-yellow-400', 'bg-yellow-900/30');
    }
}

// ── Squat (front or side) ────────────────────────────────────────────────────
function detectSquat(lm) {
    const lH = lm[23], lK = lm[25], lA = lm[27], rH = lm[24], rK = lm[26], rA = lm[28];
    const sideOk = (lH.visibility > 0.5 && lK.visibility > 0.5 && lA.visibility > 0.5) ||
        (rH.visibility > 0.5 && rK.visibility > 0.5 && rA.visibility > 0.5);
    const frontOk = lK.visibility > 0.4 && rK.visibility > 0.4 && lH.visibility > 0.4 && rH.visibility > 0.4;
    if (!sideOk && !frontOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    let inDown, inUp;
    if (sideOk) {
        const angles = [];
        if (lH.visibility > 0.5 && lK.visibility > 0.5 && lA.visibility > 0.5) angles.push(angle3(lH, lK, lA));
        if (rH.visibility > 0.5 && rK.visibility > 0.5 && rA.visibility > 0.5) angles.push(angle3(rH, rK, rA));
        if (!angles.length) return;
        const avg = angles.reduce((a, b) => a + b, 0) / angles.length;
        inDown = avg < 100; inUp = avg > 155;
    } else {
        const d = ((lm[25].y + lm[26].y) / 2) - ((lm[23].y + lm[24].y) / 2);
        // Relaxed front-view thresholds: easier to hit the 'down' state (0.18 instead of 0.22)
        // and 'up' state (0.28 instead of 0.32)
        inDown = d < 0.18; inUp = d > 0.28;
    }
    repStateMachine(inDown, inUp);
}

// ── Push-up (side view: elbow angle) ────────────────────────────────────────
function detectPushup(lm) {
    const lS = lm[11], lE = lm[13], lW = lm[15];
    const rS = lm[12], rE = lm[14], rW = lm[16];
    const lOk = lS.visibility > 0.6 && lE.visibility > 0.6 && lW.visibility > 0.6;
    const rOk = rS.visibility > 0.6 && rE.visibility > 0.6 && rW.visibility > 0.6;
    if (!lOk && !rOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    // Use the side with higher average visibility for stability
    const useLeft = lOk && (!rOk || (lS.visibility + lE.visibility + lW.visibility) > (rS.visibility + rE.visibility + rW.visibility));
    const [S, E, W] = useLeft ? [lS, lE, lW] : [rS, rE, rW];
    const elbowAngle = angle3(S, E, W);

    // Require clear arm extension (>160°) and clear bend (<85°) with hysteresis
    repStateMachine(elbowAngle < 85, elbowAngle > 160);
}

// ── Lying Leg Raise (side view: ankle Y rise above hip Y) ────────────────
// Very stable: when lying flat, ankle ≈ hip Y. When raising, ankle goes ABOVE hip.
function detectLegRaise(lm) {
    const lHi = lm[23], lAn = lm[27];
    const rHi = lm[24], rAn = lm[28];
    const lOk = lHi.visibility > 0.5 && lAn.visibility > 0.5;
    const rOk = rHi.visibility > 0.5 && rAn.visibility > 0.5;
    if (!lOk && !rOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    // hipY - ankleY (normalized, 0=top): positive ⇒ ankles are higher than hips (legs raised)
    const hiY = ((lOk ? lHi.y : 0) + (rOk ? rHi.y : 0)) / (lOk && rOk ? 2 : 1);
    const anY = ((lOk ? lAn.y : 0) + (rOk ? rAn.y : 0)) / (lOk && rOk ? 2 : 1);
    const delta = hiY - anY;

    // Raised (“down” state in state machine): delta > 0.18: ankles clearly above hips
    // Flat (“up” / rest state): delta < 0.06
    repStateMachine(delta > 0.18, delta < 0.06);
}

// ── Completion logic ─────────────────────────────────────────────────────────
function checkCompletion() {
    const ex = currentExercise();
    if (currentReps < ex.targetReps) return;

    const isLast = currentExIdx === EXERCISES.length - 1;
    updateFeedback(`已完成 ${ex.targetReps} 下${ex.name}！`, 'text-green-400', 'bg-green-900/30');
    // Camera intentionally kept running so user can continue to next exercise without restarting

    // Save this exercise's result (do NOT stop camera)
    const dur = repTimestamps.length > 1
        ? Math.round((repTimestamps[repTimestamps.length - 1] - repTimestamps[0]) / 1000) : 1;
    completedResults.push({
        session_token: sessionToken,
        exercise_type: ex.key,
        reps: currentReps,
        duration_seconds: dur,
        rep_timestamps: [...repTimestamps]
    });
    // Note: camera keeps running so user doesn't need to restart it for the next exercise

    if (isLast) {
        setSubmitNext('上傳全部成績並完成');
    } else {
        setSubmitNext(`前往第 ${currentExIdx + 2} 項：${EXERCISES[currentExIdx + 1].name}`);
    }
}

// ── Retry current exercise ───────────────────────────────────────────────────
function retryExercise() {
    resetExerciseState();
    loadExerciseUI(currentExIdx);
    // stop video if playing
    isVideoMode = false;
    ui.video.pause(); ui.video.src = '';
    ui.overlay.classList.remove('hidden');
}

// ── Advance to next exercise (no reload) ─────────────────────────────────────
async function advanceOrSubmit() {
    if (currentReps < currentExercise().targetReps) return;

    const isLast = currentExIdx === EXERCISES.length - 1;

    if (isLast) {
        await submitAllResults();
    } else {
        // Move to next exercise — camera keeps running
        currentExIdx++;
        resetExerciseState();
        loadExerciseUI(currentExIdx);
        await startSession();   // fresh token for next exercise

        // Stop video if active (camera stays on)
        if (isVideoMode) {
            isVideoMode = false;
            ui.video.pause(); ui.video.src = '';
            ui.overlay.classList.remove('hidden');
        }
    }
}

// ── Submit all completed exercises to DB ─────────────────────────────────────
async function submitAllResults() {
    ui.submitBtn.disabled = true;
    ui.submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 上傳中...';

    for (const result of completedResults) {
        if (!result.session_token) continue;
        try {
            await api.completeTraining(result);
        } catch (e) {
            console.error('Upload failed for', result.exercise_type, e);
        }
    }

    // Stop camera
    if (camera) { camera.stop(); camera = null; cameraRunning = false; setCameraActive(false); }

    // Reset state for next time
    completedResults.length = 0;
    currentExIdx = 0;
    resetExerciseState();
    loadExerciseUI(0);
    isVideoMode = false;
    ui.video.pause(); ui.video.src = '';
    ui.overlay.classList.remove('hidden');
    if (ui.statusText) { ui.statusText.textContent = '系統就緒'; ui.statusText.className = 'text-green-400'; }

    // Show congratulation modal
    const modal = document.getElementById('training-complete-modal');
    if (modal) modal.classList.remove('hidden');
}

// ── Video loop ────────────────────────────────────────────────────────────────
async function processVideoFrame() {
    if (!ui.video.paused && !ui.video.ended && isVideoMode && poseTracker) {
        try { await poseTracker.send({ image: ui.video }); } catch (e) { console.warn(e); }
        requestAnimationFrame(processVideoFrame);
    } else {
        isVideoMode = false;
    }
}

// ── Event binding ─────────────────────────────────────────────────────────────
function bindEvents() {
    // Camera toggle
    const toggleCamera = async () => {
        if (cameraRunning) {
            if (camera) { camera.stop(); camera = null; }
            cameraRunning = false; setCameraActive(false);
            ui.overlay.classList.remove('hidden');
            return;
        }
        await prepareSystem();
        isVideoMode = false; ui.video.pause();
        // Configure Camera explicitly for performance
        camera = new Camera(ui.video, {
            onFrame: async () => { if (poseTracker) await poseTracker.send({ image: ui.video }); },
            width: 480,  // 降低解析度以提升效能
            height: 360
        });
        try {
            await camera.start();
            cameraRunning = true; setCameraActive(true);
        } catch (e) {
            updateFeedback('無法開啟攝影機：' + e.message, 'text-red-400', 'bg-red-900/30');
        }
    };
    ui.cameraBtn.addEventListener('click', toggleCamera);

    // 暴露給全域供其他模組調用
    window.SharedAI = {
        startCamera: async () => { if (!cameraRunning) await toggleCamera(); },
        stopCamera: async () => { if (cameraRunning) await toggleCamera(); }
    };

    // Video file upload
    ui.uploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        await prepareSystem();
        if (camera) { camera.stop(); camera = null; cameraRunning = false; setCameraActive(false); }
        isVideoMode = true;
        resetExerciseState();
        const url = URL.createObjectURL(file);
        ui.video.src = url; ui.video.muted = true; ui.video.loop = false;
        ui.video.classList.remove('hidden');
        ui.video.onloadedmetadata = () => {
            if (ui.video.videoWidth) ui.canvas.width = ui.video.videoWidth;
            if (ui.video.videoHeight) ui.canvas.height = ui.video.videoHeight;
            ui.video.play().then(() => requestAnimationFrame(processVideoFrame))
                .catch(e => updateFeedback('影片播放失敗：' + e.message, 'text-red-400', 'bg-red-900/30'));
        };
    });

    // Submit / advance button
    ui.submitBtn.addEventListener('click', advanceOrSubmit);

    // Retry button: reset current exercise
    const retryBtn = document.getElementById('btn-retry-training');
    if (retryBtn) retryBtn.addEventListener('click', retryExercise);

    // Modal close button
    const modalCloseBtn = document.getElementById('btn-close-complete-modal');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            const modal = document.getElementById('training-complete-modal');
            if (modal) modal.classList.add('hidden');
        });
    }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const training_ai = {
    init: () => {
        if (!initElements()) return;
        loadExerciseUI(0);
        bindEvents();
        if (ui.statusText) { ui.statusText.textContent = '系統就緒'; ui.statusText.className = 'text-green-400'; }
    }
};
