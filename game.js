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
    highestRank: "apprentice",
    missions: {
        attempted: 0,
        completed: 0,
        failed: 0,
        perfectStealth: 0,
        totalKills: 0,
        itemsUsed: 0,
        favoriteItem: null,
        bestMission: null,
        successRate: 0
    }
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

// Update player rank based on total score
function updatePlayerRank() {
    const ranks = Object.keys(rankRequirements);
    let newRank = "apprentice";
    let newStars = 0;
    let rankChanged = false;
    const oldRank = playerStats.currentRank;
    
    // Find current rank based on score
    for (let i = ranks.length - 1; i >= 0; i--) {
        const rank = ranks[i];
        if (playerStats.totalScore >= rankRequirements[rank].minScore) {
            newRank = rank;
            
            // Calculate stars within this rank
            const nextRank = rankRequirements[rank].nextRank;
            if (nextRank) {
                const currentMin = rankRequirements[rank].minScore;
                const nextMin = rankRequirements[nextRank].minScore;
                const progress = playerStats.totalScore - currentMin;
                const totalRange = nextMin - currentMin;
                const starProgress = (progress / totalRange) * 3;
                newStars = Math.min(2, Math.floor(starProgress));
            } else {
                // For grand master, show full stars
                newStars = 2;
            }
            break;
        }
    }
    
    // Check if rank changed
    rankChanged = (oldRank !== newRank);
    
    playerStats.currentRank = newRank;
    playerStats.rankStars = newStars;
    
    // Update highest rank
    const rankOrder = ["apprentice", "shinobi", "assassin", "ninja", "masterNinja", "grandMaster"];
    const currentIndex = rankOrder.indexOf(newRank);
    const highestIndex = rankOrder.indexOf(playerStats.highestRank);
    if (currentIndex > highestIndex) {
        playerStats.highestRank = newRank;
    }
    
    return rankChanged;
}

// Add score from current game
function addGameScore(gameScore, correctCount, totalQuestions) {
    const oldRank = playerStats.currentRank;
    
    playerStats.totalScore += gameScore;
    playerStats.trialsCompleted++;
    playerStats.totalCorrectAnswers += correctCount;
    playerStats.totalQuestionsAnswered += totalQuestions;
    
    // Add coins
    const coinsEarned = (correctCount * COINS_PER_CORRECT) + (correctCount === totalQuestions ? COINS_PER_GAME : 0);
    playerStats.coins += coinsEarned;
    
    // Update rank
    const rankChanged = updatePlayerRank();
    
    // Save stats
    savePlayerStats();
    
    // Update live stats
    updateLiveStats();
    
    return { score: gameScore, coins: coinsEarned, rankChanged: rankChanged, oldRank: oldRank, newRank: playerStats.currentRank };
}

// Get stars display (☆ = empty, ★ = filled)
function getStarsDisplay(stars) {
    switch(stars) {
        case 0: return "☆☆☆";
        case 1: return "★☆☆";
        case 2: return "★★☆";
        case 3: return "★★★";
        default: return "☆☆☆";
    }
}

// Get progress to next rank
function getRankProgress() {
    const currentRank = playerStats.currentRank;
    const nextRank = rankRequirements[currentRank].nextRank;
    
    if (!nextRank) {
        return { current: playerStats.totalScore, required: playerStats.totalScore, percent: 100 };
    }
    
    const currentMin = rankRequirements[currentRank].minScore;
    const nextMin = rankRequirements[nextRank].minScore;
    const progress = playerStats.totalScore - currentMin;
    const totalNeeded = nextMin - currentMin;
    const percent = Math.min(100, Math.floor((progress / totalNeeded) * 100));
    
    return {
        current: playerStats.totalScore,
        required: nextMin,
        percent: percent,
        currentMin: currentMin,
        nextMin: nextMin
    };
}

// ==================== LIVE STATS ====================

function updateLiveStats() {
    // Update live score
    const liveScore = document.getElementById('live-score');
    if (liveScore) liveScore.textContent = playerStats.totalScore;
    
    // Update live coins
    const liveCoins = document.getElementById('live-coins');
    if (liveCoins) liveCoins.textContent = playerStats.coins;
    
    // Update live rank
    const liveRank = document.getElementById('live-rank');
    if (liveRank) {
        const rankName = rankRequirements[playerStats.currentRank]?.displayName || "APPRENTICE";
        liveRank.textContent = rankName;
    }
}

// ==================== STATS SCREEN ====================

function updateStatsDisplay() {
    // Update player name
    const playerNameEl = document.getElementById('stats-player-name');
    if (playerNameEl) playerNameEl.textContent = playerName.toUpperCase();
    
    // Update basic stats
    document.getElementById('stat-total-score').textContent = playerStats.totalScore;
    document.getElementById('stat-trials-completed').textContent = playerStats.trialsCompleted;
    document.getElementById('stat-coins').textContent = playerStats.coins;
    
    // Calculate success rate for trials
    const successRate = playerStats.totalQuestionsAnswered > 0 
        ? Math.round((playerStats.totalCorrectAnswers / playerStats.totalQuestionsAnswered) * 100)
        : 0;
    document.getElementById('stat-success-rate').textContent = `${successRate}%`;
    
    // Update rank display
    const rankName = rankRequirements[playerStats.currentRank]?.displayName || "APPRENTICE";
    document.getElementById('stat-rank-name').textContent = rankName;
    
    // Update stars
    const starsDisplay = getStarsDisplay(playerStats.rankStars);
    document.getElementById('stat-rank-stars').textContent = starsDisplay;
    
    // Update progress bar
    const progress = getRankProgress();
    document.getElementById('stat-rank-progress-text').textContent = `${playerStats.totalScore}/${progress.required}`;
    
    const progressBar = document.getElementById('stat-rank-progress');
    if (progressBar) {
        progressBar.style.width = `${progress.percent}%`;
    }
    
    // Set rank color
    const rankNameEl = document.getElementById('stat-rank-name');
    if (rankNameEl) {
        const rankColors = {
            "apprentice": "#808080",
            "shinobi": "#9370db",
            "assassin": "#dc143c",
            "ninja": "#4169e1",
            "masterNinja": "#c0c0c0",
            "grandMaster": "#d4af37"
        };
        rankNameEl.style.color = rankColors[playerStats.currentRank] || "#808080";
    }
    
    // ADD MISSIONS STATS SECTION
    updateMissionsStats();
}

function updateMissionsStats() {
    // Create or update missions stats section
    let missionsStatsHTML = `
        <div class="missions-stats-section">
            <h4><i class="fas fa-flag"></i> MISSIONS STATISTICS</h4>
            <div class="missions-stats-grid">
    `;
    
    // Add missions stats
    if (playerStats.missions) {
        const missions = playerStats.missions;
        const totalMissions = missions.attempted || 0;
        const successRate = totalMissions > 0 ? Math.round((missions.completed / totalMissions) * 100) : 0;
        
        missionsStatsHTML += `
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-crosshairs"></i></div>
                <div class="mission-stat-title">MISSIONS ATTEMPTED</div>
                <div class="mission-stat-value">${totalMissions}</div>
            </div>
            
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="mission-stat-title">MISSIONS COMPLETED</div>
                <div class="mission-stat-value">${missions.completed || 0}</div>
            </div>
            
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-times-circle"></i></div>
                <div class="mission-stat-title">MISSIONS FAILED</div>
                <div class="mission-stat-value">${missions.failed || 0}</div>
            </div>
            
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-percentage"></i></div>
                <div class="mission-stat-title">SUCCESS RATE</div>
                <div class="mission-stat-value">${successRate}%</div>
            </div>
            
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-user-secret"></i></div>
                <div class="mission-stat-title">PERFECT STEALTH</div>
                <div class="mission-stat-value">${missions.perfectStealth || 0}</div>
            </div>
            
            <div class="mission-stat-card">
                <div class="mission-stat-icon"><i class="fas fa-skull"></i></div>
                <div class="mission-stat-title">SILENT KILLS</div>
                <div class="mission-stat-value">${missions.totalKills || 0}</div>
            </div>
        `;
    } else {
        missionsStatsHTML += `
            <div class="no-missions-data">
                <i class="fas fa-ban"></i>
                <p>No mission data yet. Complete your first mission!</p>
            </div>
        `;
    }
    
    missionsStatsHTML += `
            </div>
        </div>
    `;
    
    // Add to stats screen
    const existingMissionsStats = document.querySelector('.missions-stats-section');
    if (existingMissionsStats) {
        existingMissionsStats.innerHTML = missionsStatsHTML;
    } else {
        // Insert after rank info box
        const rankInfoBox = document.querySelector('.rank-info-box');
        if (rankInfoBox) {
            rankInfoBox.insertAdjacentHTML('afterend', missionsStatsHTML);
        }
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
    if (typeof createGameVFX === 'function') createGameVFX('menuOpen');
}

function showInfo() { showScreen('info'); }
function showSupporters() { showScreen('supporters-screen'); }
function showPlayerNameScreen() { 
    showScreen('player-name-screen'); 
    const input = document.getElementById('player-name-input');
    if (input) {
        setTimeout(() => input.focus(), 300);
    }
}

function showStatsScreen() {
    showScreen('stats-screen');
    updateStatsDisplay();
}

function showMissionsScreen() {
    showScreen('missions-screen');
    // Missions list will be updated by missions.js
    if (typeof updateMissionsList === 'function') {
        updateMissionsList();
    }
}

function showStatsScreenFromResults() {
    showScreen('stats-screen');
    updateStatsDisplay();
}

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
    showAppreciation = false;
    
    await loadQuestions();
    
    showScreen('game');
    showGameSubScreen('question');
    
    const playerDisp = document.getElementById('current-player');
    if (playerDisp) playerDisp.textContent = playerName.toUpperCase();
    
    if (typeof createGameVFX === 'function') createGameVFX('gameStart');
    
    // Load first question with small delay for transition
    setTimeout(() => {
        loadQuestion();
    }, 300);
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("JSON missing");
        const data = await response.json();
        questions = data.sort(() => Math.random() - 0.5).slice(0, 5);
        console.log(`Loaded ${questions.length} questions`);
    } catch (e) {
        console.error("Error loading questions:", e);
        // Fallback if file doesn't exist to prevent black screen
        questions = [{
            question: "A true shinobi moves like...",
            options: ["A storm", "A shadow", "A flame", "A river"],
            answer: "A shadow",
            difficulty: "Easy",
            commentator: "rikimaru"
        }, {
            question: "The Azuma clan's sacred blade is called...",
            options: ["Kusanagi", "Izayoi", "Muramasa", "Masamune"],
            answer: "Izayoi",
            difficulty: "Medium",
            commentator: "rikimaru"
        }, {
            question: "What does 'Tenchu' mean?",
            options: ["Heaven's Punishment", "Shadow Blade", "Silent Death", "Night Warrior"],
            answer: "Heaven's Punishment",
            difficulty: "Medium",
            commentator: "ayame"
        }, {
            question: "Which tool is used for blinding enemies?",
            options: ["Shuriken", "Kunai", "Metsubishi", "Shuko"],
            answer: "Metsubishi",
            difficulty: "Hard",
            commentator: "tatsumaru"
        }, {
            question: "Rikimaru's signature technique is...",
            options: ["Hiryu", "Tobikomi", "Shikoro", "Kazekiri"],
            answer: "Hiryu",
            difficulty: "Hard",
            commentator: "rikimaru"
        }];
    }
}

function loadQuestion() {
    if (!gameActive) return;
    
    // Check if all questions are answered
    if (currentQuestionIndex >= questions.length) {
        showAppreciation = Math.random() < 0.4;
        
        if (showAppreciation && typeof supporters !== 'undefined' && supporters.length > 0) {
            showAppreciationScreen();
        } else {
            showResults();
        }
        return;
    }

    const q = questions[currentQuestionIndex];
    const qText = document.getElementById('question-text');
    if (qText) {
        qText.style.opacity = '0';
        setTimeout(() => {
            qText.textContent = q.question;
            qText.style.opacity = '1';
        }, 200);
    }
    
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

    // Create options with letters
    const optionsDiv = document.getElementById('options');
    if (optionsDiv) {
        optionsDiv.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-ninja';
            btn.innerHTML = `<span class="option-letter">${letters[index]}</span><span class="option-text">${opt}</span>`;
            btn.onclick = () => checkAnswer(opt, q.answer, q.commentator || 'rikimaru');
            optionsDiv.appendChild(btn);
        });
    }
    showGameSubScreen('question');
}

function checkAnswer(selected, correct, commentator) {
    const isCorrect = (selected === correct);
    playerAnswers.push({ selected, correct, isCorrect, commentator });

    const btns = document.querySelectorAll('#options .btn-ninja');
    btns.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        
        const optionText = btn.querySelector('.option-text').textContent;
        if (optionText === correct) {
            btn.style.background = 'linear-gradient(145deg, #1a2a1a, #111a11)';
            btn.style.borderColor = '#00aa00';
        }
        if (optionText === selected && !isCorrect) {
            btn.style.background = 'linear-gradient(145deg, #2a1a1a, #1a1111)';
            btn.style.borderColor = '#ff0000';
        }
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

// ==================== RESULTS SCREEN ====================

function showResults() {
    console.log('DEBUG: showResults() called. Element exists:', document.getElementById('result-screen') !== null);
    
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Calculate points earned
    const pointsEarned = (correctAnswers * POINTS_PER_CORRECT) + 
                        (correctAnswers === totalQuestions ? POINTS_PER_GAME_COMPLETION : 0);
    
    // Add to player progression
    const gameResult = addGameScore(pointsEarned, correctAnswers, totalQuestions);
    
    // Update results screen
    updateResultsDisplay(pointsEarned, gameResult.coins, totalQuestions, correctAnswers, percentage, gameResult);
    
    // Show results screen - FIXED: SINGULAR 'result' NOT 'results'
    showGameSubScreen('result');
    
    // Create VFX based on performance
    if (typeof createGameVFX === 'function') {
        if (percentage >= 50) {
            createGameVFX('victory');
        } else {
            createGameVFX('defeat');
        }
    }
}

function updateResultsDisplay(pointsEarned, coinsEarned, totalQuestions, correctAnswers, percentage, gameResult) {
    // Update score breakdown
    document.getElementById('result-correct').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('result-points').textContent = `+${pointsEarned}`;
    document.getElementById('result-coins').textContent = `+${coinsEarned}`;
    document.getElementById('result-total').textContent = playerStats.totalScore;
    
    // Show rank notification if rank changed
    const rankNotification = document.getElementById('rank-notification');
    if (gameResult.rankChanged) {
        rankNotification.style.display = 'flex';
        rankNotification.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            <span>Rank Up! ${rankRequirements[gameResult.oldRank]?.displayName} → ${rankRequirements[gameResult.newRank]?.displayName}</span>
        `;
        
        // Add celebration effect
        if (typeof createGameVFX === 'function') {
            setTimeout(() => {
                createGameVFX('victory');
            }, 500);
        }
    } else {
        rankNotification.style.display = 'none';
    }
    
    // Get character feedback based on performance
    let feedbackCharacter;
    let feedbackMessage = "";
    
    // Determine which character gives feedback based on percentage
    if (percentage >= 80) {
        feedbackCharacter = 'rikimaru';
    } else if (percentage >= 60) {
        feedbackCharacter = 'ayame';
    } else {
        feedbackCharacter = 'tatsumaru';
    }
    
    // Get appropriate feedback message
    feedbackMessage = getPerformanceFeedback(feedbackCharacter, percentage, correctAnswers, totalQuestions);
    
    // Update feedback
    const feedbackText = document.getElementById('feedback-text');
    if (feedbackText) feedbackText.textContent = feedbackMessage;
    
    // Set character portrait if function exists
    if (typeof getCharacterPortrait === 'function') {
        const portrait = getCharacterPortrait(feedbackCharacter);
        const feedbackPortrait = document.getElementById('feedback-portrait');
        if (portrait && feedbackPortrait) {
            feedbackPortrait.style.backgroundImage = `url('${portrait}')`;
        }
    }
}

// Get performance feedback from characters
function getPerformanceFeedback(character, percentage, correct, total) {
    if (character === 'rikimaru') {
        if (percentage >= 80) {
            return "Your precision is commendable. Continue to hone your skills in the shadows.";
        } else if (percentage >= 60) {
            return "Acceptable performance. Focus on improving your judgment.";
        } else {
            return "Your technique needs refinement. Study the ancient scrolls.";
        }
    }
    
    if (character === 'ayame') {
        if (percentage >= 80) {
            return "Well done! Your intuition serves you well in the shadows!";
        } else if (percentage >= 60) {
            return "Good effort! Remember, a true kunoichi relies on both skill and wit!";
        } else {
            return "You need more practice! Don't lose heart - every master was once a beginner!";
        }
    }
    
    if (character === 'tatsumaru') {
        if (percentage >= 80) {
            return "Hmph. Not bad. You understand that strength comes from knowledge.";
        } else if (percentage >= 60) {
            return "Adequate. But true power requires perfection.";
        } else {
            return "Weak. The shadows have no mercy for the unprepared.";
        }
    }
    
    return "The trial is complete. Your performance has been recorded.";
}

// ==================== APPRECIATION SCREEN ====================

function showAppreciationScreen() {
    if (typeof supporters === 'undefined' || supporters.length === 0) {
        showResults();
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * supporters.length);
    const supporter = supporters[randomIndex];
    
    const characters = ['rikimaru', 'ayame', 'tatsumaru'];
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    
    let portrait = '';
    if (typeof getCharacterPortrait === 'function') {
        portrait = getCharacterPortrait(randomCharacter);
    }
    
    let characterName = "Azuma Master";
    if (typeof getCharacterDisplayName === 'function') {
        characterName = getCharacterDisplayName(randomCharacter);
    }
    
    const messages = [
        `${characterName} acknowledges your support.`,
        `${characterName} honors those who stand with the Azuma.`,
        `From the shadows, ${characterName} gives thanks.`,
        `${characterName} recognizes true allies of the clan.`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    document.getElementById('appreciation-text').textContent = randomMessage;
    document.getElementById('honored-name').textContent = supporter.name;
    document.getElementById('honored-handle').textContent = supporter.handle || '';
    
    const supporterRank = document.querySelector('.supporter-rank');
    if (supporterRank && supporter.rank) {
        // Use the local function from supporters.js
        if (typeof getRankInfo === 'function') {
            const rankInfo = getRankInfo(supporter.rank);
            if (rankInfo) {
                supporterRank.innerHTML = `
                    <i class="fas fa-shield-alt"></i>
                    <span>${rankInfo.name}</span>
                `;
            }
        } else {
            // Fallback if function not available
            supporterRank.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <span>HONORED ALLY</span>
            `;
        }
    }
    
    if (portrait) {
        const appreciationPortrait = document.getElementById('appreciation-portrait');
        if (appreciationPortrait) {
            appreciationPortrait.style.backgroundImage = `url('${portrait}')`;
        }
    }
    
    showGameSubScreen('appreciation');
    
    if (typeof createGameVFX === 'function') {
        createGameVFX('appreciation');
    }
}

// ==================== UTILS & MISSING FUNCTIONS ====================

function showGameSubScreen(type) {
    const screens = ['question-screen', 'appreciation-screen', 'result-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) { 
            el.classList.add('hidden'); 
            el.classList.remove('active'); 
        }
    });
    const target = document.getElementById(type + '-screen');
    if (target) { 
        target.classList.remove('hidden'); 
        setTimeout(() => target.classList.add('active'), 50);
    }
}

function shareStats() {
    const rank = document.getElementById('stat-rank-name')?.textContent || 'APPRENTICE';
    const stars = document.getElementById('stat-rank-stars')?.textContent || '☆☆☆';
    const score = document.getElementById('stat-total-score')?.textContent || '0';
    const text = `I achieved ${rank} ${stars} with ${score} points in Tenchu Shiren! 天誅試練`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Tenchu Shiren Stats',
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(text);
        });
    } else {
        fallbackShare(text);
    }
}

function fallbackShare(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Stats copied to clipboard! Share it with your fellow shinobi.');
        });
    } else {
        alert('Share this text:\n\n' + text);
    }
}

// Animate number counting up
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentValue = Math.floor(start + (range * easeProgress));
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }
    
    requestAnimationFrame(update);
}

// ==================== INITIALIZATION ====================

function initializeGame() {
    console.log('Tenchu Shiren - Initializing...');
    
    // Lock body scrolling
    document.body.style.overflow = 'hidden';
    
    // Initialize VFX if available
    if (typeof initVFX === 'function') {
        initVFX();
    }
    
    // Load player stats
    loadPlayerStats();
    
    // Initialize supporters list if available
    if (typeof updateSupportersList === 'function') {
        updateSupportersList();
    }
    
    // Setup name input
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                setPlayerName();
            }
        });
    }
    
    // Update live stats
    updateLiveStats();
    
    // Show menu after a short delay to ensure DOM is ready
    setTimeout(() => {
        showScreen('menu');
    }, 100);
    
    console.log('Game initialized successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// ==================== GLOBAL EXPORTS ====================

window.showPlayerNameScreen = showPlayerNameScreen;
window.showInfo = showInfo;
window.showSupporters = showSupporters;
window.showStatsScreen = showStatsScreen;
window.showMissionsScreen = showMissionsScreen;
window.showStatsScreenFromResults = showStatsScreenFromResults;
window.backToMenu = backToMenu;
window.setPlayerName = setPlayerName;
window.startGame = startGame;
window.showResults = showResults;
window.shareStats = shareStats;
window.updateStatsDisplay = updateStatsDisplay;
window.updateLiveStats = updateLiveStats;
window.loadPlayerStats = loadPlayerStats;
window.savePlayerStats = savePlayerStats;