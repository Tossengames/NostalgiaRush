/**
 * TENCHU SHIREN - Master Game Engine
 * Synchronized with index.html
 */

// --- Global State ---
let playerName = "Nameless Warrior";
let currentQuestionIndex = 0;
let questions = [];
let gameActive = false;
let correctAnswers = 0;
let playerAnswers = [];

let playerStats = {
    totalScore: 0,
    trialsCompleted: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    currentRank: "apprentice",
    rankStars: 0,
    coins: 0,
    lastPlayed: null
};

const rankRequirements = {
    "apprentice": { minScore: 0, displayName: "APPRENTICE", nextRank: "shinobi" },
    "shinobi": { minScore: 100, displayName: "SHINOBI", nextRank: "assassin" },
    "assassin": { minScore: 300, displayName: "ASSASSIN", nextRank: "ninja" },
    "ninja": { minScore: 600, displayName: "NINJA", nextRank: "masterNinja" },
    "masterNinja": { minScore: 1000, displayName: "MASTER NINJA", nextRank: "grandMaster" },
    "grandMaster": { minScore: 2000, displayName: "GRAND MASTER", nextRank: null }
};

const POINTS_PER_CORRECT = 20;
const COMPLETION_BONUS = 50;
const COINS_PER_CORRECT = 2;

// --- Initialization ---
window.addEventListener('load', () => {
    loadPlayerStats();
    // Set viewport height for mobile
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

function loadPlayerStats() {
    try {
        const saved = localStorage.getItem('tenchuShirenStats');
        if (saved) playerStats = { ...playerStats, ...JSON.parse(saved) };
        
        const savedName = localStorage.getItem('tenchuShirenPlayerName');
        if (savedName) {
            playerName = savedName;
            const input = document.getElementById('player-name-input');
            if (input) input.value = playerName;
        }
    } catch (e) { console.error("Stats load failed", e); }
}

function savePlayerStats() {
    localStorage.setItem('tenchuShirenStats', JSON.stringify(playerStats));
    localStorage.setItem('tenchuShirenPlayerName', playerName);
}

// --- Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);
    }
}

function showGameSubScreen(type) {
    const subScreens = ['question-screen', 'appreciation-screen', 'result-screen'];
    subScreens.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.classList.remove('active'); }
    });
    
    const target = document.getElementById(type);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);
    }
}

// --- Gameplay ---
async function startGame() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    gameActive = true;
    
    await loadQuestions();
    
    const pDisplay = document.getElementById('current-player');
    if (pDisplay) pDisplay.textContent = playerName.toUpperCase();
    
    showScreen('game');
    loadQuestion();
}

async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        const data = await res.json();
        questions = data.sort(() => 0.5 - Math.random()).slice(0, 5);
    } catch (e) {
        questions = [{ question: "Azuma Clan Status?", options: ["Ready", "Wait"], answer: "Ready" }];
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        handleTrialEnd();
        return;
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('trial-number').textContent = currentQuestionIndex + 1;
    document.getElementById('progress-current').textContent = currentQuestionIndex + 1;
    document.getElementById('progress-fill').style.width = `${(currentQuestionIndex / 5) * 100}%`;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-ninja';
        btn.innerHTML = `<span>${opt}</span>`;
        btn.onclick = () => {
            if (opt === q.answer) {
                correctAnswers++;
                if (window.createGameVFX) createGameVFX('correct');
            } else {
                if (window.createGameVFX) createGameVFX('incorrect');
            }
            
            // Visual feedback before next question
            const allBtns = optionsDiv.querySelectorAll('button');
            allBtns.forEach(b => {
                b.disabled = true;
                if (b.textContent === q.answer) b.style.borderColor = "#00ff00";
            });

            setTimeout(() => {
                currentQuestionIndex++;
                loadQuestion();
            }, 1000);
        };
        optionsDiv.appendChild(btn);
    });
    showGameSubScreen('question-screen');
}

// --- Sequence Control ---
function handleTrialEnd() {
    // 30% chance to show appreciation if supporters.js is loaded
    if (Math.random() < 0.3 && typeof supporters !== 'undefined' && supporters.length > 0) {
        const sup = supporters[Math.floor(Math.random() * supporters.length)];
        const nameEl = document.getElementById('honored-name');
        if (nameEl) nameEl.textContent = sup.name;
        
        const handleEl = document.getElementById('honored-handle');
        if (handleEl) handleEl.textContent = sup.handle || "";

        showGameSubScreen('appreciation-screen');
    } else {
        showResults();
    }
}

function showResults() {
    const pts = (correctAnswers * POINTS_PER_CORRECT) + (correctAnswers === 5 ? COMPLETION_BONUS : 0);
    const coins = (correctAnswers * COINS_PER_CORRECT);
    const oldTotal = playerStats.totalScore;

    // Update Data
    playerStats.totalScore += pts;
    playerStats.coins += coins;
    playerStats.trialsCompleted++;
    playerStats.totalCorrectAnswers += correctAnswers;
    playerStats.totalQuestionsAnswered += 5;

    // Rank Logic
    const oldRank = playerStats.currentRank;
    for (const [key, req] of Object.entries(rankRequirements)) {
        if (playerStats.totalScore >= req.minScore) playerStats.currentRank = key;
    }
    
    savePlayerStats();

    // UI Updates
    document.getElementById('result-correct').textContent = `${correctAnswers}/5`;
    document.getElementById('result-points').textContent = `+${pts}`;
    document.getElementById('result-coins').textContent = `+${coins}`;
    
    animateValue('result-total', oldTotal, playerStats.totalScore, 1000);

    const rankNotif = document.getElementById('rank-notification');
    if (rankNotif) rankNotif.style.display = (oldRank !== playerStats.currentRank) ? 'flex' : 'none';

    // Character Comments
    if (typeof getCharacterFeedback === 'function') {
        const feedback = getCharacterFeedback(correctAnswers);
        document.getElementById('feedback-text').textContent = feedback.text;
        const portrait = document.getElementById('feedback-portrait');
        if (portrait) portrait.style.backgroundImage = `url('${feedback.image}')`;
    }

    showGameSubScreen('result-screen');
}

// --- Stats Screen Logic ---
function updateStatsDisplay() {
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    
    set('stats-player-name', playerName.toUpperCase());
    set('stat-total-score', playerStats.totalScore);
    set('stat-trials-completed', playerStats.trialsCompleted);
    set('stat-coins', playerStats.coins);
    
    const rate = playerStats.totalQuestionsAnswered > 0 
        ? Math.round((playerStats.totalCorrectAnswers / playerStats.totalQuestionsAnswered) * 100) : 0;
    set('stat-success-rate', `${rate}%`);

    const rank = rankRequirements[playerStats.currentRank];
    set('stat-rank-name', rank.displayName);
    
    // Star Logic (0-3)
    if (rank.nextRank) {
        const next = rankRequirements[rank.nextRank];
        const progress = playerStats.totalScore - rank.minScore;
        const totalNeeded = next.minScore - rank.minScore;
        const percent = Math.min(100, Math.floor((progress / totalNeeded) * 100));
        
        const stars = percent >= 90 ? "★★★" : (percent >= 60 ? "★★☆" : (percent >= 30 ? "★☆☆" : "☆☆☆"));
        set('stat-rank-stars', stars);
        set('stat-rank-progress-text', `${playerStats.totalScore}/${next.minScore}`);
        const bar = document.getElementById('stat-rank-progress');
        if (bar) bar.style.width = `${percent}%`;
    } else {
        set('stat-rank-stars', "★★★");
        set('stat-rank-progress-text', "MAX RANK");
    }
}

// --- Utilities ---
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- Global Hooks for HTML ---
window.setPlayerName = () => {
    const val = document.getElementById('player-name-input').value.trim();
    if (val) playerName = val;
    savePlayerStats();
    startGame();
};

window.showPlayerNameScreen = () => showScreen('player-name-screen');
window.showInfo = () => showScreen('info');
window.showStatsScreen = () => { showScreen('stats-screen'); updateStatsDisplay(); };
window.showStatsScreenFromResults = window.showStatsScreen;
window.showSupporters = () => showScreen('supporters-screen');
window.showMissionsScreen = () => showScreen('missions-screen');
window.backToMenu = () => showScreen('menu');
window.startGame = startGame;
window.showResults = showResults; // Hook for Appreciation button
