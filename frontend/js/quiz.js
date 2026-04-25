import { api } from './api.js';
import { dom } from './ui.js';

let quizData = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 10;
let canAnswer = false;

// Quiz DOM Elements (Local because they are not in ui.js yet)
const quizDom = {
    lobby: document.getElementById('quiz-lobby'),
    playArea: document.getElementById('quiz-play-area'),
    resultArea: document.getElementById('quiz-result-area'),
    progress: document.getElementById('quiz-progress'),
    score: document.getElementById('quiz-score'),
    timer: document.getElementById('quiz-timer'),
    timerBar: document.getElementById('quiz-timer-bar'),
    questionText: document.getElementById('quiz-question-text'),
    options: document.querySelectorAll('.quiz-option'),
    explanationArea: document.getElementById('quiz-explanation-area'),
    explanationText: document.getElementById('quiz-explanation-text'),
    sourceText: document.getElementById('quiz-source-text'),
    feedbackOverlay: document.getElementById('quiz-feedback-overlay'),
    feedbackIcon: document.getElementById('quiz-feedback-icon'),
    finalScore: document.getElementById('quiz-final-score'),
    rankText: document.getElementById('quiz-rank-text'),
};

export function initQuiz() {
    const btnStart = document.getElementById('btn-start-quiz');
    if (btnStart) btnStart.onclick = startQuiz;

    const btnNext = document.getElementById('btn-next-question');
    if (btnNext) btnNext.onclick = nextQuestion;

    const btnRetry = document.getElementById('btn-retry-quiz');
    if (btnRetry) btnRetry.onclick = startQuiz;

    const btnExit = document.getElementById('btn-exit-quiz');
    if (btnExit) btnExit.onclick = exitQuiz;

    const btnQuit = document.getElementById('btn-quit-quiz');
    if (btnQuit) btnQuit.onclick = exitQuiz;

    quizDom.options.forEach(btn => {
        btn.onclick = () => selectOption(btn.dataset.option);
    });
}

async function startQuiz() {
    try {
        // Reset State
        currentIndex = 0;
        score = 0;
        quizDom.score.textContent = '0';
        
        // UI Switch
        quizDom.lobby.classList.add('hidden');
        quizDom.resultArea.classList.add('hidden');
        quizDom.playArea.classList.remove('hidden');
        
        // Fetch Questions
        quizDom.questionText.textContent = '正在裝填題目...';
        quizData = await api.getRandomQuiz(5);
        
        if (!quizData || quizData.length === 0) {
            throw new Error('找不到題目');
        }

        loadQuestion();
    } catch (e) {
        alert(e.message);
        exitQuiz();
    }
}

function loadQuestion() {
    const q = quizData[currentIndex];
    canAnswer = true;
    
    // Update Text
    quizDom.progress.textContent = `${currentIndex + 1}/${quizData.length}`;
    quizDom.questionText.textContent = q.question;
    
    // Update Options
    quizDom.options.forEach(btn => {
        const optKey = btn.dataset.option;
        const textSpan = btn.querySelector('.option-text');
        textSpan.textContent = q.options[optKey] || '---';
        
        // Reset Button States
        btn.classList.remove('border-green-500', 'border-red-500', 'bg-green-900/20', 'bg-red-900/20', 'opacity-50');
        btn.disabled = false;
    });

    // Hide Explanation
    quizDom.explanationArea.classList.add('hidden');
    quizDom.feedbackOverlay.classList.add('hidden');

    // Start Timer
    resetTimer();
}

function resetTimer() {
    if (timer) clearInterval(timer);
    timeLeft = 10;
    updateTimerUI();
    
    timer = setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timer);
            handleTimeOut();
        }
        updateTimerUI();
    }, 100);
}

function updateTimerUI() {
    quizDom.timer.textContent = timeLeft.toFixed(1);
    const percent = (timeLeft / 10) * 100;
    quizDom.timerBar.style.width = `${percent}%`;
    
    // Color change
    if (timeLeft < 3) {
        quizDom.timerBar.classList.replace('bg-green-500', 'bg-red-500');
    } else {
        quizDom.timerBar.classList.replace('bg-red-500', 'bg-green-500');
    }
}

function selectOption(choice) {
    if (!canAnswer) return;
    canAnswer = false;
    clearInterval(timer);

    const q = quizData[currentIndex];
    const isCorrect = choice === q.answer;

    // Show Feedback Icon
    quizDom.feedbackOverlay.classList.remove('hidden');
    quizDom.feedbackIcon.innerHTML = isCorrect 
        ? '<i class="fa-solid fa-check text-green-500"></i>' 
        : '<i class="fa-solid fa-xmark text-red-500"></i>';
    quizDom.feedbackIcon.className = "text-8xl animate-bounce-in opacity-100 transition-all duration-300";

    // Auto-hide the feedback overlay so the explanation is clear and readable
    setTimeout(() => {
        quizDom.feedbackOverlay.classList.add('hidden');
    }, 800);

    // Highlight Buttons
    quizDom.options.forEach(btn => {
        btn.disabled = true;
        const optKey = btn.dataset.option;
        if (optKey === q.answer) {
            btn.classList.add('border-green-500', 'bg-green-900/20');
        } else if (optKey === choice && !isCorrect) {
            btn.classList.add('border-red-500', 'bg-red-900/20');
        } else {
            btn.classList.add('opacity-50');
        }
    });

    // Update Score
    if (isCorrect) {
        // Bonus for speed
        const bonus = Math.round(timeLeft * 10);
        score += 100 + bonus;
        quizDom.score.textContent = score;
    }

    // Show Explanation
    quizDom.explanationArea.classList.remove('hidden');
    quizDom.explanationText.textContent = q.explanation || '本題無詳細說明。';
    quizDom.sourceText.textContent = `出處：${q.source || '國防部規章'}`;
}

function handleTimeOut() {
    selectOption(null); // Force incorrect
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    quizDom.playArea.classList.add('hidden');
    quizDom.resultArea.classList.remove('hidden');
    
    quizDom.finalScore.textContent = score;
    
    // Determine Rank
    let rank = "新兵戰士";
    let color = "text-stone-400";
    
    if (score >= 600) { rank = "精實模範生"; color = "text-green-400"; }
    else if (score >= 400) { rank = "及格邊緣人"; color = "text-yellow-400"; }
    else { rank = "純種大天兵"; color = "text-red-400"; }
    
    quizDom.rankText.textContent = `等級：${rank}`;
    quizDom.rankText.className = `text-xl font-bold mb-8 tracking-wider ${color}`;

    // Add Confetti for high score
    if (score >= 500 && window.confetti) {
        window.confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function exitQuiz() {
    if (timer) clearInterval(timer);
    quizDom.playArea.classList.add('hidden');
    quizDom.resultArea.classList.add('hidden');
    quizDom.lobby.classList.remove('hidden');
}
