// ============================================
// TENCHU SHIREN - COMPLETE GAME ENGINE
// ============================================

// Game state
let playerName = "Nameless Warrior";
let currentQuestionIndex = 0;
let questions = [];
let gameActive = false;
let correctAnswers = 0;
let playerAnswers = [];
let currentScreen = 'menu';

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

// Rank progression requirements
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

// ==================== SCREEN MANAGEMENT ====================

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);
        currentScreen = screenId;
    }
    
    if (typeof createGameVFX === 'function') createGameVFX('screenChange');
}

function showGameSubScreen(type) {
    const screens = ['question-screen', 'appreciation-screen', 'result-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) { el.classList.add('hidden'); el.classList.remove('active'); }
    });
    const target = document.getElementById(type + '-screen');
    if (target) { 
        target.classList.remove('hidden'); 
        setTimeout(() => target.classList.add('active'), 50);
    }
}

// ==================== GAME LOGIC ====================

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
        // Load 5 random questions
        questions = data.sort(() => Math.random() - 0.5).slice(0, 5);
    } catch (e) {
        console.error("Question load failed:", e);
        questions = [{
            question: "Is the Azuma Clan ready?",
            options: ["Always", "No", "Perhaps", "Soon"],
            answer: "Always",
            difficulty: "EASY"
        }];
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        // Show appreciation if supporters are defined in supporters.js
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
    const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    updateText('current-trial', currentQuestionIndex + 1);
    updateText('trial-number', currentQuestionIndex + 1);
    updateText('progress-current', currentQuestionIndex + 1);

    const diff = document.querySelector('.diff-level');
    if (diff) diff.textContent = q.difficulty || "NORMAL";

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;

    const optionsDiv = document.getElementById('options');
    if (optionsDiv) {
        optionsDiv.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-ninja';
            btn.innerHTML = `<span class="option-text">${opt}</span>`;
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
        const txt = btn.querySelector('.option-text')?.textContent;
        if (txt === correct) btn.style.borderColor = "#00ff00";
        if (txt === selected && !isCorrect) btn.style.borderColor = "#ff0000";
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
    }, 1500);
}

// ==================== APPRECIATION LOGIC ====================

function showAppreciationScreen() {
    if (typeof supporters === 'undefined' || supporters.length === 0) {
        showResults();
        return;
    }
    
    const supporter = supporters[Math.floor(Math.random() * supporters.length)];
    const characters = ['rikimaru', 'ayame', 'tatsumaru'];
    const randomChar = characters[Math.floor(Math.random() * characters.length)];
    
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    
    set('honored-name', supporter.name);
    set('honored-handle', supporter.handle || '');
    set('appreciation-text', `Master ${randomChar.toUpperCase()} acknowledges your support.`);
    
    const portrait = document.getElementById('appreciation-portrait');
    if (portrait && typeof getCharacterPortrait === 'function') {
        portrait.style.backgroundImage = `url('${getCharacterPortrait(randomChar)}')`;
    }
    
    showGameSubScreen('appreciation');
    if (typeof createGameVFX === 'function') createGameVFX('appreciation');
}

// ==================== RESULTS & PROGRESSION ====================

function showResults() {
    const ptsEarned = (correctAnswers * POINTS_PER_CORRECT) + (correctAnswers === 5 ? POINTS_PER_GAME_COMPLETION : 0);
    const coinsEarned = (correctAnswers * COINS_PER_CORRECT);
    
    const oldRank = playerStats.currentRank;
    const oldTotal = playerStats.totalScore;
    
    // Update Stats
    playerStats.totalScore += ptsEarned;
    playerStats.coins += coinsEarned;
    playerStats.trialsCompleted++;
    playerStats.totalCorrectAnswers += correctAnswers;
    playerStats.totalQuestionsAnswered += 5;
    
    // Check Rank Up
    for (const [key, req] of Object.entries(rankRequirements)) {
        if (playerStats.totalScore >= req.minScore) playerStats.currentRank = key;
    }
    
    savePlayerStats();

    // UI Updates
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    set('result-correct', `${correctAnswers}/5`);
    set('result-points', `+${ptsEarned}`);
    set('result-coins', `+${coinsEarned}`);
    
    // Animate total score
    animateValue('result-total', oldTotal, playerStats.totalScore, 1500);

    const rankNotif = document.getElementById('rank-notification');
    if (rankNotif) rankNotif.style.display = (oldRank !== playerStats.currentRank) ? 'flex' : 'none';

    // Character Feedback
    const percentage = (correctAnswers / 5) * 100;
    const feedbackChar = percentage >= 80 ? 'rikimaru' : (percentage >= 60 ? 'ayame' : 'tatsumaru');
    
    set('feedback-text', getPerformanceFeedback(feedbackChar, percentage));
    
    const fPortrait = document.getElementById('feedback-portrait');
    if (fPortrait && typeof getCharacterPortrait === 'function') {
        fPortrait.style.backgroundImage = `url('${getCharacterPortrait(feedbackChar)}')`;
    }

    showGameSubScreen('results');
    if (typeof createGameVFX === 'function') createGameVFX(percentage >= 60 ? 'victory' : 'defeat');
}

function getPerformanceFeedback(character, percentage) {
    if (character === 'rikimaru') return "Your precision is commendable. Continue to hone your skills.";
    if (character === 'ayame') return "Well done! Your intuition serves you well in the shadows!";
    return "Weak. The shadows have no mercy for the unprepared.";
}

// ==================== STATS DISPLAY ====================

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
    
    const stars = ["☆☆☆", "★☆☆", "★★☆", "★★★"][playerStats.rankStars] || "☆☆☆";
    set('stat-rank-stars', stars);

    if (rank.nextRank) {
        const next = rankRequirements[rank.nextRank];
        const progress = playerStats.totalScore - rank.minScore;
        const totalNeeded = next.minScore - rank.minScore;
        const percent = Math.min(100, Math.floor((progress / totalNeeded) * 100));
        
        set('stat-rank-progress-text', `${playerStats.totalScore}/${next.minScore}`);
        const bar = document.getElementById('stat-rank-progress');
        if (bar) bar.style.width = `${percent}%`;
    } else {
        set('stat-rank-progress-text', "MAX RANK REACHED");
    }
}

// ==================== UTILS ====================

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function sharePlayerStats() {
    const rank = rankRequirements[playerStats.currentRank].displayName;
    const text = `🏯 Tenchu Shiren\nRank: ${rank}\nScore: ${playerStats.totalScore}\nCan you beat me?`;
    if (navigator.share) {
        navigator.share({ title: 'My Shinobi Stats', text: text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(text).then(() => alert("Stats copied to clipboard!"));
    }
}

// ==================== EXPORTS FOR HTML ====================

window.setPlayerName = () => {
    const input = document.getElementById('player-name-input');
    if (input && input.value.trim()) {
        playerName = input.value.trim();
        savePlayerStats();
    }
    startGame();
};

window.showPlayerNameScreen = () => showScreen('player-name-screen');
window.showInfo = () => showScreen('info');
window.showSupporters = () => showScreen('supporters-screen');
window.showStatsScreen = () => { showScreen('stats-screen'); updateStatsDisplay(); };
window.showMissionsScreen = () => showScreen('missions-screen');
window.backToMenu = () => { gameActive = false; showScreen('menu'); };
window.showStatsScreenFromResults = () => { showScreen('stats-screen'); updateStatsDisplay(); };
window.shareStats = sharePlayerStats;
window.showResults = showResults; // Needed for the 'See Results' button

// Load stats on page load
window.addEventListener('load', () => {
    loadPlayerStats();
    // Initialize VH for mobile as per your index.html script
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});
