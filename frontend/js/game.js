/**
 * SIMSOLDIER GAME
 * 打蚊子小遊戲邏輯
 */

import { state } from './state.js';
import { dom, switchTab } from './ui.js';

export function startGame() {
    state.game.isPlaying = true;
    state.game.score = 0;
    state.game.timeLeft = 30;
    state.game.mosquitoes = [];

    // UI Reset
    dom.gameLobby.classList.add('hidden');
    dom.gamePlayArea.classList.remove('hidden');
    dom.gameOver.classList.add('hidden');
    dom.gameScore.textContent = 0;
    dom.gameTimer.textContent = 30;
    dom.mosquitoContainer.innerHTML = '';

    // Start Loops
    state.game.timer = setInterval(gameTick, 1000);
    state.game.spawnTimer = setInterval(spawnMosquito, 800);
}

export function quitGame() {
    state.game.isPlaying = false;
    clearInterval(state.game.timer);
    clearInterval(state.game.spawnTimer);
    dom.gameLobby.classList.remove('hidden');
    dom.gamePlayArea.classList.add('hidden');
    dom.gameOver.classList.add('hidden');
}

function endGame() {
    state.game.isPlaying = false;
    clearInterval(state.game.timer);
    clearInterval(state.game.spawnTimer);

    dom.gamePlayArea.classList.add('hidden');
    dom.gameOver.classList.remove('hidden');
    dom.finalScore.textContent = state.game.score;

    // Message
    if (state.game.score < 5) {
        dom.finalMessage.textContent = "太菜了！蚊子都打不到！(菜逼八)";
        dom.finalMessage.className = "text-stone-500 font-bold mb-6";
    } else if (state.game.score < 15) {
        dom.finalMessage.textContent = "普通！還需要多練練！(普普通通)";
        dom.finalMessage.className = "text-yellow-500 font-bold mb-6";
    } else {
        dom.finalMessage.textContent = "神射手！今晚加菜！(榮譽假)";
        dom.finalMessage.className = "text-green-500 font-bold mb-6";
    }
}

function gameTick() {
    state.game.timeLeft--;
    dom.gameTimer.textContent = state.game.timeLeft;

    if (state.game.timeLeft <= 0) {
        endGame();
    }
}

function spawnMosquito() {
    if (!state.game.isPlaying) return;

    const mosquito = document.createElement('div');
    mosquito.className = 'absolute w-8 h-8 cursor-pointer transform hover:scale-110 transition-transform active:scale-90';

    // Random Position
    const maxX = dom.gamePlayArea.clientWidth - 40;
    const maxY = dom.gamePlayArea.clientHeight - 40;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    mosquito.style.left = x + 'px';
    mosquito.style.top = y + 'px';

    mosquito.innerHTML = '<i class="fa-solid fa-mosquito text-2xl text-stone-400"></i>';

    mosquito.addEventListener('mousedown', () => hitMosquito(mosquito));

    // Auto remove after 2s
    setTimeout(() => {
        if (mosquito.parentElement) {
            mosquito.remove();
        }
    }, 2000);

    dom.mosquitoContainer.appendChild(mosquito);
}

function hitMosquito(el) {
    if (!state.game.isPlaying) return;

    // Sound effect (optional)

    // Visual effect
    el.innerHTML = '<i class="fa-solid fa-burst text-3xl text-red-500"></i>';
    state.game.score++;
    dom.gameScore.textContent = state.game.score;

    setTimeout(() => {
        el.remove();
    }, 200);
}
