// ============================================
// TENCHU SHIREN - FULL RESTORED ENGINE
// ============================================

let playerName = "Nameless Warrior";
let currentQuestionIndex = 0;
let questions = [];
let gameActive = false;
let correctAnswers = 0;

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
    "apprentice": { minScore: 0, label: "APPRENTICE", next: 100 },
    "shinobi": { minScore: 100, label: "SHINOBI", next: 300 },
    "assassin": { minScore: 300, label: "ASSASSIN", next: 600 },
    "ninja": { minScore: 600, label: "NINJA", next: 1000 },
    "masterNinja": { minScore: 1000, label: "MASTER NINJA", next: 2000 },
    "grandMaster": { minScore: 2000, label: "GRAND MASTER", next: null }
};

// --- CORE UTILITIES ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 10);
    }
}

function showSubScreen(id) {
    document.querySelectorAll('.game-content').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 10);
    }
}

// --- GAMEPLAY FLOW ---
async function startGame() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    gameActive = true;
    
    await loadQuestions();
    
    const pDisp = document.getElementById('current-player');
    if (pDisp) pDisp.textContent = playerName.toUpperCase();
    
    showScreen('game');
    loadQuestion();
}

async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        const data = await res.json();
        questions = data.sort(() => 0.5 - Math.random()).slice(0, 5);
    } catch (e) {
        console.error("Using fallback questions");
        questions = Array(5).fill({ 
            question: "What is the primary weapon of the Azuma?", 
            options: ["Ninjato", "Spear", "Bow", "Club"], 
            answer: "Ninjato" 
        });
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= 5) {
        handleEndSequence();
        return;
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('trial-number').textContent = currentQuestionIndex + 1;
    document.getElementById('current-trial').textContent = currentQuestionIndex + 1;
    document.getElementById('progress-current').textContent = currentQuestionIndex + 1;
    
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${((currentQuestionIndex + 1) / 5) * 100}%`;

    const opts = document.getElementById('options');
    opts.innerHTML = '';
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-ninja';
        btn.innerHTML = `<span>${opt}</span>`;
        btn.onclick = () => {
            const isCorrect = opt === q.answer;
            if (isCorrect) {
                correctAnswers++;
                if (window.createGameVFX) createGameVFX('correct');
            } else {
                triggerBloodOverlay();
                if (window.createGameVFX) createGameVFX('incorrect');
            }
            
            currentQuestionIndex++;
            setTimeout(loadQuestion, 600);
        };
        opts.appendChild(btn);
    });
    showSubScreen('question-screen');
}

function triggerBloodOverlay() {
    const overlay = document.getElementById('blood-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 500);
    }
}

// --- SEQUENCE CONTROL ---
function handleEndSequence() {
    // Supporter Appreciation (If logic exists in supporters.js)
    if (Math.random() < 0.4 && typeof supporters !== 'undefined' && supporters.length > 0) {
        const sup = supporters[Math.floor(Math.random() * supporters.length)];
        document.getElementById('honored-name').textContent = sup.name;
        document.getElementById('honored-handle').textContent = sup.handle || "";
        document.getElementById('appreciation-text').textContent = "The shadows honor those who pave the way...";
        showSubScreen('appreciation-screen');
    } else {
        showResults();
    }
}

function showResults() {
    const pts = (correctAnswers * 20) + (correctAnswers === 5 ? 50 : 0);
    const coins = (correctAnswers * 2);
    const oldTotal = playerStats.totalScore;

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

    // UI Updates
    document.getElementById('result-correct').textContent = `${correctAnswers}/5`;
    document.getElementById('result-points').textContent = `+${pts}`;
    document.getElementById('result-coins').textContent = `+${coins}`;
    document.getElementById('result-total').textContent = playerStats.totalScore;

    const rankNotif = document.getElementById('rank-notification');
    if (rankNotif) rankNotif.style.display = (oldRank !== playerStats.currentRank) ? 'flex' : 'none';

    // Character Comments (Restored)
    if (typeof getCharacterFeedback === 'function') {
        const feedback = getCharacterFeedback(correctAnswers);
        document.getElementById('feedback-text').textContent = feedback.text;
        const portrait = document.getElementById('feedback-portrait');
        if (portrait) portrait.style.backgroundImage = `url('${feedback.image}')`;
    }

    showSubScreen('result-screen');
    savePlayerStats();
}

// --- STATS PAGE ---
function updateStatsDisplay() {
    document.getElementById('stats-player-name').textContent = playerName.toUpperCase();
    document.getElementById('stat-total-score').textContent = playerStats.totalScore;
    document.getElementById('stat-trials-completed').textContent = playerStats.trialsCompleted;
    document.getElementById('stat-coins').textContent = playerStats.coins;
    
    const rate = playerStats.totalQuestionsAnswered > 0 
        ? Math.round((playerStats.totalCorrectAnswers / playerStats.totalQuestionsAnswered) * 100) : 0;
    document.getElementById('stat-success-rate').textContent = `${rate}%`;

    const rank = rankRequirements[playerStats.currentRank];
    document.getElementById('stat-rank-name').textContent = rank.label;
    
    if (rank.next) {
        const progress = playerStats.totalScore - rank.minScore;
        const totalNeeded = rank.next - rank.minScore;
        const percent = Math.min(100, (progress / totalNeeded) * 100);
        document.getElementById('stat-rank-progress').style.width = `${percent}%`;
        document.getElementById('stat-rank-progress-text').textContent = `${playerStats.totalScore}/${rank.next}`;
    }
}

// --- SYSTEM ---
function savePlayerStats() {
    localStorage.setItem('tenchuShirenStats', JSON.stringify(playerStats));
    localStorage.setItem('tenchuShirenPlayerName', playerName);
}

function loadPlayerStats() {
    const saved = localStorage.getItem('tenchuShirenStats');
    if (saved) playerStats = { ...playerStats, ...JSON.parse(saved) };
    const name = localStorage.getItem('tenchuShirenPlayerName');
    if (name) playerName = name;
}

// --- GLOBAL ATTACHMENTS ---
window.setPlayerName = () => {
    const input = document.getElementById('player-name-input');
    if (input && input.value) playerName = input.value;
    savePlayerStats();
    startGame();
};
window.showPlayerNameScreen = () => showScreen('player-name-screen');
window.showStatsScreen = () => { updateStatsDisplay(); showScreen('stats-screen'); };
window.showMissionsScreen = () => showScreen('missions-screen');
window.showSupporters = () => {
    if (typeof updateSupportersList === 'function') updateSupportersList();
    showScreen('supporters-screen');
};
window.backToMenu = () => showScreen('menu');
window.showResults = showResults; 

window.onload = loadPlayerStats;
