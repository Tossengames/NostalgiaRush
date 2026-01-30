// ============================================
// TENCHU SHIREN - game.js (Fixed Engine)
// ============================================

// Game state
let playerName = "Nameless Warrior";
let currentQuestionIndex = 0;
let questions = [];
let gameActive = false;
let correctAnswers = 0;
let playerAnswers = [];
let showAppreciation = false;

// Player progression system
let playerStats = {
    totalScore: 0,
    trialsCompleted: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    currentRank: "apprentice",
    rankStars: 0,
    coins: 0,
    lastPlayed: null,
    highestRank: "apprentice"
};

// Rank requirements matching your HTML/Stats
const rankRequirements = {
    "apprentice": { minScore: 0, stars: 3, nextRank: "shinobi", displayName: "APPRENTICE" },
    "shinobi": { minScore: 100, stars: 3, nextRank: "assassin", displayName: "SHINOBI" },
    "assassin": { minScore: 300, stars: 3, nextRank: "ninja", displayName: "ASSASSIN" },
    "ninja": { minScore: 600, stars: 3, nextRank: "masterNinja", displayName: "NINJA" },
    "masterNinja": { minScore: 1000, stars: 3, nextRank: "grandMaster", displayName: "MASTER NINJA" },
    "grandMaster": { minScore: 2000, stars: 3, nextRank: null, displayName: "GRAND MASTER" }
};

const POINTS_PER_CORRECT = 20;
const POINTS_PER_GAME_COMPLETION = 50;
const COINS_PER_CORRECT = 2;
const COINS_PER_GAME = 10;
let currentScreen = 'menu';

// ==================== INITIALIZATION & PERSISTENCE ====================

function loadPlayerStats() {
    try {
        const saved = localStorage.getItem('tenchuShirenStats');
        if (saved) {
            const parsed = JSON.parse(saved);
            playerStats = { ...playerStats, ...parsed };
        }
        
        const savedName = localStorage.getItem('tenchuShirenPlayerName');
        if (savedName) {
            playerName = savedName;
            const input = document.getElementById('player-name-input');
            if (input) input.value = playerName;
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

function savePlayerStats() {
    try {
        playerStats.lastPlayed = new Date().toISOString();
        localStorage.setItem('tenchuShirenStats', JSON.stringify(playerStats));
        localStorage.setItem('tenchuShirenPlayerName', playerName);
    } catch (error) {
        console.error("Error saving stats:", error);
    }
}

// ==================== SCREEN NAVIGATION ====================

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        // Small delay to allow CSS transitions
        setTimeout(() => target.classList.add('active'), 50);
        currentScreen = screenId;
    }
    
    if (typeof createGameVFX === 'function') createGameVFX('screenChange');
}

function backToMenu() {
    gameActive = false;
    showScreen('menu');
}

function showInfo() { showScreen('info'); }
function showSupporters() { showScreen('supporters-screen'); }
function showPlayerNameScreen() { showScreen('player-name-screen'); }

// ==================== GAME LOGIC ====================

function setPlayerName() {
    const input = document.getElementById('player-name-input');
    if (input && input.value.trim() !== '') {
        playerName = input.value.trim();
        savePlayerStats();
    }
    startGame();
}

async function startGame() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    gameActive = true;
    playerAnswers = [];
    
    await loadQuestions();
    
    showScreen('game');
    showGameSubScreen('question');
    
    const playerDisp = document.getElementById('current-player');
    if (playerDisp) playerDisp.textContent = playerName.toUpperCase();
    
    if (typeof createGameVFX === 'function') createGameVFX('gameStart');
    loadQuestion();
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("JSON missing");
        const data = await response.json();
        questions = data.sort(() => Math.random() - 0.5).slice(0, 5);
    } catch (e) {
        // Fallback if file doesn't exist to prevent black screen
        questions = [{
            question: "File questions.json not found! Is it in your folder?",
            options: ["Yes", "No", "Maybe", "Check Console"],
            answer: "Check Console",
            difficulty: "ERROR"
        }];
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        // 40% chance to show supporter appreciation if they exist
        if (Math.random() < 0.4 && typeof supporters !== 'undefined' && supporters.length > 0) {
            showAppreciationScreen();
        } else {
            showResults();
        }
        return;
    }

    const q = questions[currentQuestionIndex];
    const qText = document.getElementById('question-text');
    if (qText) qText.textContent = q.question;
    
    // Update Trial Counters
    ['current-trial', 'trial-number', 'progress-current'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = currentQuestionIndex + 1;
    });

    // Update Difficulty
    const diff = document.querySelector('.diff-level');
    if (diff) diff.textContent = q.difficulty || "NORMAL";

    // Progress Bar
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;

    const optionsDiv = document.getElementById('options');
    if (optionsDiv) {
        optionsDiv.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-ninja';
            btn.innerHTML = `<span>${opt}</span>`;
            btn.onclick = () => checkAnswer(opt, q.answer);
            optionsDiv.appendChild(btn);
        });
    }
    showGameSubScreen('question');
}

function checkAnswer(selected, correct) {
    const isCorrect = (selected === correct);
    playerAnswers.push({ selected, correct, isCorrect });

    const btns = document.querySelectorAll('#options .btn-ninja');
    btns.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) btn.classList.add('correct-flash');
        if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect-flash');
    });

    if (isCorrect) {
        correctAnswers++;
        if (typeof createGameVFX === 'function') createGameVFX('correct');
    } else {
        if (typeof createGameVFX === 'function') createGameVFX('incorrect');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1200);
}

// ==================== RANKING & STATS ====================

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
    set('stat-rank-stars', ["☆☆☆", "★☆☆", "★★☆", "★★★"][playerStats.rankStars] || "☆☆☆");

    // Progress bar
    if (rank.nextRank) {
        const next = rankRequirements[rank.nextRank];
        const progress = playerStats.totalScore - rank.minScore;
        const total = next.minScore - rank.minScore;
        const percent = Math.min(100, Math.floor((progress / total) * 100));
        set('stat-rank-progress-text', `${playerStats.totalScore}/${next.minScore}`);
        const bar = document.getElementById('stat-rank-progress');
        if (bar) bar.style.width = `${percent}%`;
    }
}

function showResults() {
    const pts = (correctAnswers * POINTS_PER_CORRECT) + (correctAnswers === 5 ? POINTS_PER_GAME_COMPLETION : 0);
    const coins = (correctAnswers * COINS_PER_CORRECT);
    
    const oldRank = playerStats.currentRank;
    
    // Update Stats
    playerStats.totalScore += pts;
    playerStats.coins += coins;
    playerStats.trialsCompleted++;
    playerStats.totalCorrectAnswers += correctAnswers;
    playerStats.totalQuestionsAnswered += questions.length;
    
    // Determine Rank
    for (const [key, req] of Object.entries(rankRequirements)) {
        if (playerStats.totalScore >= req.minScore) playerStats.currentRank = key;
    }
    
    savePlayerStats();

    // UI Updates
    document.getElementById('result-correct').textContent = `${correctAnswers}/5`;
    document.getElementById('result-points').textContent = `+${pts}`;
    document.getElementById('result-coins').textContent = `+${coins}`;
    document.getElementById('result-total').textContent = playerStats.totalScore;

    const rankNotif = document.getElementById('rank-notification');
    if (rankNotif) rankNotif.style.display = (oldRank !== playerStats.currentRank) ? 'flex' : 'none';

    // Character Feedback
    const feedbackText = document.getElementById('feedback-text');
    if (feedbackText) {
        if (correctAnswers === 5) feedbackText.textContent = "Master Rikimaru: Excellence. You move like a shadow.";
        else if (correctAnswers >= 3) feedbackText.textContent = "Ayame: Not bad! You have the instincts of the Azuma.";
        else feedbackText.textContent = "Tatsumaru: Your training is incomplete. The darkness does not forgive.";
    }

    showGameSubScreen('results');
}

// ==================== UTILS ====================

function showGameSubScreen(type) {
    const screens = ['question-screen', 'appreciation-screen', 'result-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) { el.classList.add('hidden'); el.classList.remove('active'); }
    });
    const target = document.getElementById(type + '-screen');
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
}

function showAppreciationScreen() {
    showGameSubScreen('appreciation');
}

window.addEventListener('load', loadPlayerStats);
