/**
 * SIMSOLDIER GAME
 * 役種抽籤小遊戲邏輯
 */

import { state } from './state.js';
import { dom, switchTab } from './ui.js';

let btnDrawVillage, drawAnimationText, resultCard, resultTag, resultNumber, resultMessage, shockOverlay, btnBackHome;

function initGameDOM() {
    if (!btnDrawVillage) {
        btnDrawVillage = document.getElementById('btn-draw-village');
        drawAnimationText = document.getElementById('draw-animation-text');
        resultCard = document.getElementById('result-card');
        resultTag = document.getElementById('result-tag');
        resultNumber = document.getElementById('result-number');
        resultMessage = document.getElementById('result-message');
        shockOverlay = document.getElementById('shock-overlay');
        btnBackHome = document.getElementById('btn-back-home');

        if (btnDrawVillage) {
            btnDrawVillage.addEventListener('click', () => {
                startDraw(true);
            });
        }
        if (btnBackHome) {
            btnBackHome.addEventListener('click', () => {
                quitGame();
            });
        }
    }
}

// 供 main.js 呼叫 (親自抽籤)
export function startGame() {
    startDraw(false);
}

export function quitGame() {
    initGameDOM();
    const gameLobby = document.getElementById('game-lobby');
    const gamePlayArea = document.getElementById('game-play-area');
    const gameOver = document.getElementById('game-over');
    
    if (gameLobby) gameLobby.classList.remove('hidden');
    if (gamePlayArea) gamePlayArea.classList.add('hidden');
    if (gameOver) gameOver.classList.add('hidden');
    if (shockOverlay) shockOverlay.classList.add('hidden');
}

function startDraw(isVillageHead) {
    initGameDOM();
    
    const gameLobby = document.getElementById('game-lobby');
    const gamePlayArea = document.getElementById('game-play-area');
    const gameOver = document.getElementById('game-over');
    
    // UI Reset
    if (gameLobby) gameLobby.classList.add('hidden');
    if (gamePlayArea) gamePlayArea.classList.remove('hidden');
    if (gameOver) gameOver.classList.add('hidden');
    if (shockOverlay) shockOverlay.classList.add('hidden');
    
    drawAnimationText.textContent = isVillageHead ? "里長代抽中..." : "籤筒搖晃中...";

    // 模擬抽籤延遲 (1.5秒)
    setTimeout(() => {
        finishDraw(isVillageHead);
    }, 1500);
}

function finishDraw(isVillageHead) {
    const gamePlayArea = document.getElementById('game-play-area');
    const gameOver = document.getElementById('game-over');
    
    // 權重設定
    const branches = [
        { name: '陸軍', weight: isVillageHead ? 16.6 : 65, colorClass: 'bg-green-700 border-green-500 text-green-100', msg: '常山趙子龍，草綠服穿到退伍！', msgClass: 'text-green-500' },
        { name: '海軍艦艇兵', weight: isVillageHead ? 16.6 : 10, colorClass: 'bg-blue-900 border-blue-600 text-blue-100', msg: '暈船藥準備好，乘風破浪去！', msgClass: 'text-blue-400' },
        { name: '空軍', weight: isVillageHead ? 16.6 : 10, colorClass: 'bg-sky-800 border-sky-400 text-sky-100', msg: '少爺兵爽爽當？防空警衛歡迎你！', msgClass: 'text-sky-400' },
        { name: '海軍陸戰隊', weight: isVillageHead ? 50.2 : 15, colorClass: 'bg-red-900 border-red-500 text-red-100', msg: '一日陸戰隊，終身陸戰隊！(全場默哀)', msgClass: 'text-red-500 font-bold animate-pulse' }
    ];

    // 加權隨機抽取
    const totalWeight = branches.reduce((sum, branch) => sum + branch.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedBranch = branches[0];

    for (const branch of branches) {
        if (randomNum < branch.weight) {
            selectedBranch = branch;
            break;
        }
        randomNum -= branch.weight;
    }

    // 隨機號碼 1-1000 補零
    const lotNumber = Math.floor(Math.random() * 1000) + 1;
    const paddedNumber = String(lotNumber).padStart(4, '0');

    // 更新 UI
    resultTag.textContent = selectedBranch.name;
    resultTag.className = `inline-block px-6 py-2 rounded font-bold text-xl mb-6 shadow-inner border-2 ${selectedBranch.colorClass}`;
    
    resultNumber.textContent = paddedNumber;
    
    resultMessage.textContent = selectedBranch.msg;
    resultMessage.className = `text-lg mb-8 h-8 ${selectedBranch.msgClass}`;
    resultCard.className = `bg-stone-800 border-2 rounded-xl shadow-2xl p-8 max-w-md w-full text-center transform scale-100 transition-transform duration-300 ${selectedBranch.name === '海軍陸戰隊' ? 'border-red-600' : 'border-stone-600'}`;

    // 切換畫面
    if (gamePlayArea) gamePlayArea.classList.add('hidden');
    if (gameOver) gameOver.classList.remove('hidden');

    // 海陸特殊效果
    if (selectedBranch.name === '海軍陸戰隊') {
        if (shockOverlay) {
            shockOverlay.classList.remove('hidden');
            // 自動隱藏特效
            setTimeout(() => {
                shockOverlay.classList.add('hidden');
            }, 1500);
        }
    }
}
