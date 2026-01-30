// ============================================
// TENCHU SHIREN - UPDATED GAME ENGINE
// Score-based progression system
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

// Rank progression requirements
const rankRequirements = {
    "apprentice": { minScore: 0, stars: 3, nextRank: "shinobi", displayName: "APPRENTICE" },
    "shinobi": { minScore: 100, stars: 3, nextRank: "assassin", displayName: "SHINOBI" },
    "assassin": { minScore: 300, stars: 3, nextRank: "ninja", displayName: "ASSASSIN" },
    "ninja": { minScore: 600, stars: 3, nextRank: "masterNinja", displayName: "NINJA" },
    "masterNinja": { minScore: 1000, stars: 3, nextRank: "grandMaster", displayName: "MASTER NINJA" },
    "grandMaster": { minScore: 2000, stars: 3, nextRank: null, displayName: "GRAND MASTER" }
};

// Rank colors
const rankColors = {
    "apprentice": "#808080",
    "shinobi": "#9370db",
    "assassin": "#dc143c",
    "ninja": "#4169e1",
    "masterNinja": "#c0c0c0",
    "grandMaster": "#d4af37"
};

// Points system
const POINTS_PER_CORRECT = 20; // Reduced for slower progression
const POINTS_PER_GAME_COMPLETION = 50;
const COINS_PER_CORRECT = 2;
const COINS_PER_GAME = 10;

// Game elements
let currentScreen = 'menu';

// ==================== PLAYER PROGRESSION ====================

// Load player stats from localStorage
function loadPlayerStats() {
    try {
        const saved = localStorage.getItem('tenchuShirenStats');
        if (saved) {
            const parsed = JSON.parse(saved);
            playerStats = { ...playerStats, ...parsed };
            
            // Ensure all required properties exist
            if (playerStats.coins === undefined) playerStats.coins = 0;
            if (playerStats.rankStars === undefined) playerStats.rankStars = 0;
            if (playerStats.lastPlayed === undefined) playerStats.lastPlayed = new Date().toISOString();
            if (playerStats.highestRank === undefined) playerStats.highestRank = playerStats.currentRank;
            
            console.log("Loaded player stats:", playerStats);
        }
        
        // Load player name if exists
        const savedName = localStorage.getItem('tenchuShirenPlayerName');
        if (savedName) {
            playerName = savedName;
            document.getElementById('player-name-input').value = playerName;
        }
        
    } catch (error) {
        console.error("Error loading player stats:", error);
        // Start fresh if error
        playerStats = {
            totalScore: 0,
            trialsCompleted: 0,
            totalCorrectAnswers: 0,
            totalQuestionsAnswered: 0,
            currentRank: "apprentice",
            rankStars: 0,
            coins: 0,
            lastPlayed: new Date().toISOString(),
            highestRank: "apprentice"
        };
    }
}

// Save player stats to localStorage
function savePlayerStats() {
    try {
        playerStats.lastPlayed = new Date().toISOString();
        localStorage.setItem('tenchuShirenStats', JSON.stringify(playerStats));
        localStorage.setItem('tenchuShirenPlayerName', playerName);
        console.log("Saved player stats");
    } catch (error) {
        console.error("Error saving player stats:", error);
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
    
    console.log(`Player rank updated: ${newRank} (${newStars} stars)${rankChanged ? ' - RANK CHANGED!' : ''}`);
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
    
    console.log(`Added game score: ${gameScore}. Total: ${playerStats.totalScore}. Coins: +${coinsEarned}`);
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

// Get rank display name
function getRankDisplayName(rankKey) {
    return rankRequirements[rankKey]?.displayName || "APPRENTICE";
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

// ==================== STATS SCREEN ====================

// Update stats display
function updateStatsDisplay() {
    // Update player name
    document.getElementById('stats-player-name').textContent = playerName.toUpperCase();
    
    // Update stats values
    document.getElementById('stat-total-score').textContent = playerStats.totalScore;
    document.getElementById('stat-trials-completed').textContent = playerStats.trialsCompleted;
    document.getElementById('stat-coins').textContent = playerStats.coins;
    
    // Calculate success rate
    const successRate = playerStats.totalQuestionsAnswered > 0 
        ? Math.round((playerStats.totalCorrectAnswers / playerStats.totalQuestionsAnswered) * 100)
        : 0;
    document.getElementById('stat-success-rate').textContent = `${successRate}%`;
    
    // Update rank display
    const rankName = getRankDisplayName(playerStats.currentRank);
    document.getElementById('stat-rank-name').textContent = rankName;
    
    // Update stars
    const starsDisplay = getStarsDisplay(playerStats.rankStars);
    document.getElementById('stat-rank-stars').textContent = starsDisplay;
    
    // Update progress bar
    const progress = getRankProgress();
    document.getElementById('stat-rank-progress-text').textContent = `${progress.current}/${progress.required}`;
    document.getElementById('stat-rank-progress').style.width = `${progress.percent}%`;
    
    // Set rank color
    document.getElementById('stat-rank-name').style.color = rankColors[playerStats.currentRank] || "#808080";
}

// Share player stats
function sharePlayerStats() {
    const rankName = getRankDisplayName(playerStats.currentRank);
    const stars = getStarsDisplay(playerStats.rankStars);
    const successRate = playerStats.totalQuestionsAnswered > 0 
        ? Math.round((playerStats.totalCorrectAnswers / playerStats.totalQuestionsAnswered) * 100)
        : 0;
    
    const shareText = `🏯 Tenchu Shiren 天誅試練
Rank: ${rankName} ${stars}
Score: ${playerStats.totalScore} points
Coins: ${playerStats.coins}
Success Rate: ${successRate}%

Can you beat my score?`;

    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Tenchu Shiren Stats',
            text: shareText,
            url: shareUrl
        }).then(() => {
            console.log('Stats shared successfully');
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share method
function fallbackShare(shareText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Stats copied to clipboard! Share it with your fellow shinobi.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Share this text:\n\n' + shareText);
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Stats copied to clipboard! Share it with your fellow shinobi.');
        } catch (err) {
            alert('Share this text:\n\n' + shareText);
        }
        document.body.removeChild(textArea);
    }
}

// ==================== SCREEN MANAGEMENT ====================

// Show screen with transition effects
function showScreen(screenId) {
    if (typeof createGameVFX === 'function' && currentScreen !== screenId) {
        createGameVFX('screenChange');
    }
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
        setTimeout(() => {
            screen.classList.add('hidden');
        }, 50);
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        setTimeout(() => {
            screen.classList.add('active');
        }, 100);
        
        currentScreen = screenId;
        console.log(`Showing screen: ${screenId}`);
    }
}

// ==================== GAME FUNCTIONS ====================

function setPlayerName() {
    const input = document.getElementById('player-name-input');
    if (input && input.value.trim() !== '') {
        playerName = input.value.trim();
        console.log(`Player name: ${playerName}`);
        savePlayerStats();
    }
    
    startGame();
}

async function startGame() {
    console.log("Starting game...");
    
    // Reset game state
    currentQuestionIndex = 0;
    correctAnswers = 0;
    gameActive = true;
    playerAnswers = [];
    showAppreciation = false;
    
    // Load questions
    await loadQuestions();
    
    // Show game screen
    showScreen('game');
    showGameScreen('question');
    
    // Update player display
    document.getElementById('current-player').textContent = playerName.toUpperCase();
    
    // Create game start VFX
    if (typeof createGameVFX === 'function') {
        createGameVFX('gameStart');
    }
    
    // Load first question with delay for transition
    setTimeout(() => {
        loadQuestion();
    }, 500);
}

// Show specific screen within game with transition
function showGameScreen(screenType) {
    const screens = ['question-screen', 'appreciation-screen', 'result-screen'];
    
    // Hide all game screens with fade out
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen && screen.classList.contains('active')) {
            screen.classList.remove('active');
            setTimeout(() => {
                screen.classList.add('hidden');
            }, 300);
        }
    });
    
    // Show requested screen with fade in
    let screenToShow;
    switch(screenType) {
        case 'question':
            screenToShow = 'question-screen';
            break;
        case 'appreciation':
            screenToShow = 'appreciation-screen';
            break;
        case 'results':
            screenToShow = 'result-screen';
            break;
    }
    
    const screen = document.getElementById(screenToShow);
    if (screen) {
        screen.classList.remove('hidden');
        setTimeout(() => {
            screen.classList.add('active');
            screen.classList.add('question-transition');
            
            setTimeout(() => {
                screen.classList.remove('question-transition');
            }, 500);
        }, 50);
    }
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            const data = await response.json();
            questions = data.sort(() => Math.random() - 0.5).slice(0, 5);
            console.log(`Loaded ${questions.length} questions`);
        } else {
            throw new Error('Failed to load questions.json');
        }
    } catch (error) {
        console.error("Error loading questions:", error);
        alert("Failed to load questions. Please check questions.json file.");
        backToMenu();
        return;
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
    
    const question = questions[currentQuestionIndex];
    
    // Update UI with transition
    const questionText = document.getElementById('question-text');
    questionText.style.opacity = '0';
    
    setTimeout(() => {
        questionText.textContent = question.question;
        questionText.style.opacity = '1';
        
        // Update other UI elements
        document.getElementById('trial-number').textContent = currentQuestionIndex + 1;
        document.getElementById('current-trial').textContent = currentQuestionIndex + 1;
        document.getElementById('progress-current').textContent = currentQuestionIndex + 1;
        
        // Update progress bar
        const progressPercentage = (currentQuestionIndex / questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
        
        // Update difficulty display
        const diffElement = document.querySelector('.diff-level');
        if (diffElement && question.difficulty) {
            diffElement.textContent = question.difficulty;
        }
        
        // Create options
        createOptions(question);
        
    }, 300);
    
    showGameScreen('question');
}

function createOptions(question) {
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'btn-ninja';
        button.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        
        button.onclick = () => {
            button.classList.add('option-selected');
            
            const allButtons = optionsDiv.querySelectorAll('button');
            allButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.6';
            });
            
            button.style.background = 'linear-gradient(145deg, #2a1a1a, #1a1111)';
            button.style.borderColor = '#8b0000';
            
            setTimeout(() => {
                checkAnswer(option, question.answer, question.commentator);
            }, 300);
        };
        
        optionsDiv.appendChild(button);
    });
}

function checkAnswer(selected, correct, commentator) {
    const isCorrect = selected === correct;
    
    playerAnswers.push({
        selected: selected,
        correct: correct,
        isCorrect: isCorrect,
        commentator: commentator
    });
    
    if (isCorrect) {
        correctAnswers++;
        if (typeof createGameVFX === 'function') {
            createGameVFX('correct');
        }
        highlightAnswerFeedback(true);
    } else {
        if (typeof createGameVFX === 'function') {
            createGameVFX('incorrect');
        }
        highlightAnswerFeedback(false);
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function highlightAnswerFeedback(isCorrect) {
    const options = document.querySelectorAll('#options .btn-ninja');
    options.forEach(button => {
        const optionText = button.querySelector('.option-text').textContent;
        button.style.transition = 'all 0.5s ease';
        
        if (isCorrect && optionText === questions[currentQuestionIndex].answer) {
            button.style.background = 'linear-gradient(145deg, #1a2a1a, #111a11)';
            button.style.borderColor = '#00aa00';
            button.style.color = '#00ff00';
        } else if (!isCorrect) {
            if (optionText === questions[currentQuestionIndex].answer) {
                button.style.background = 'linear-gradient(145deg, #1a2a1a, #111a11)';
                button.style.borderColor = '#00aa00';
                button.style.color = '#00ff00';
            }
            else if (optionText === playerAnswers[playerAnswers.length - 1].selected) {
                button.style.background = 'linear-gradient(145deg, #2a1a1a, #1a1111)';
                button.style.borderColor = '#ff0000';
                button.style.color = '#ff6666';
            }
        }
    });
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
        document.getElementById('appreciation-portrait').style.backgroundImage = `url('${portrait}')`;
    }
    
    showGameScreen('appreciation');
    
    if (typeof createGameVFX === 'function') {
        createGameVFX('appreciation');
    }
    
    console.log(`Showing appreciation for supporter: ${supporter.name}`);
}

// ==================== UPDATED RESULTS SCREEN (SCORE-BASED) ====================

function showResults() {
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Calculate points earned
    const pointsEarned = (correctAnswers * POINTS_PER_CORRECT) + (correctAnswers === totalQuestions ? POINTS_PER_GAME_COMPLETION : 0);
    
    // Add to player progression
    const gameResult = addGameScore(pointsEarned, correctAnswers, totalQuestions);
    
    // Update results screen with animations
    updateResultsDisplay(pointsEarned, gameResult.coins, totalQuestions, correctAnswers, percentage, gameResult);
    
    // Show results screen
    showGameScreen('results');
    
    // Create VFX based on performance
    if (typeof createGameVFX === 'function') {
        if (percentage >= 50) {
            createGameVFX('victory');
        } else {
            createGameVFX('defeat');
        }
    }
    
    console.log(`Game completed. Correct: ${correctAnswers}/${totalQuestions} (${percentage}%). Points: +${pointsEarned}. Rank changed: ${gameResult.rankChanged}`);
}

function updateResultsDisplay(pointsEarned, coinsEarned, totalQuestions, correctAnswers, percentage, gameResult) {
    // Update score breakdown
    document.getElementById('result-correct').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('result-points').textContent = `+${pointsEarned}`;
    document.getElementById('result-coins').textContent = `+${coinsEarned}`;
    
    // Calculate and animate total score
    const oldTotalScore = playerStats.totalScore - pointsEarned;
    const newTotalScore = playerStats.totalScore;
    
    // Animate the total score counting up
    animateValue('result-total', oldTotalScore, newTotalScore, 1500);
    
    // Show rank notification if rank changed
    const rankNotification = document.getElementById('rank-notification');
    if (gameResult.rankChanged) {
        rankNotification.style.display = 'flex';
        rankNotification.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            <span>Rank Up! ${getRankDisplayName(gameResult.oldRank)} → ${getRankDisplayName(gameResult.newRank)}</span>
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
    document.getElementById('feedback-text').textContent = feedbackMessage;
    
    // Set character portrait
    if (typeof getCharacterPortrait === 'function') {
        const portrait = getCharacterPortrait(feedbackCharacter);
        if (portrait) {
            document.getElementById('feedback-portrait').style.backgroundImage = `url('${portrait}')`;
        }
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

// Get performance feedback from characters
function getPerformanceFeedback(character, percentage, correct, total) {
    const characterName = typeof getCharacterDisplayName === 'function' 
        ? getCharacterDisplayName(character) 
        : "Master";
    
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

// ==================== MENU FUNCTIONS ====================

function showPlayerNameScreen() {
    showScreen('player-name-screen');
    document.getElementById('player-name-input').focus();
}

function showInfo() {
    showScreen('info');
}

function showSupporters() {
    showScreen('supporters-screen');
    
    const messageEl = document.getElementById('supporter-message');
    if (messageEl && typeof getSupporterAppreciation === 'function') {
        messageEl.textContent = getSupporterAppreciation();
    }
}

function showStatsScreen() {
    showScreen('stats-screen');
    updateStatsDisplay();
}

function showMissionsScreen() {
    showScreen('missions-screen');
}

function showStatsScreenFromResults() {
    showScreen('stats-screen');
    updateStatsDisplay();
}

function backToMenu() {
    showScreen('menu');
    gameActive = false;
    
    if (typeof createGameVFX === 'function') {
        createGameVFX('menuOpen');
    }
}

// ==================== INITIALIZATION ====================

// Wait for all scripts to load before showing menu
function initializeGame() {
    console.log('Tenchu Shiren - Score-Based Edition');
    
    if (typeof initVFX === 'function') {
        initVFX();
    }
    
    loadPlayerStats();
    
    // Wait a bit to ensure DOM is fully ready
    setTimeout(() => {
        showScreen('menu');
    }, 100);
    
    if (typeof updateSupportersList === 'function') {
        updateSupportersList();
    }
    
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                setPlayerName();
            }
        });
        
        if (playerName !== "Nameless Warrior") {
            nameInput.value = playerName;
        }
    }
    
    window.addEventListener('popstate', function() {
        if (currentScreen === 'game' && gameActive) {
            backToMenu();
        }
    });
    
    if (window.innerWidth >= 1024) {
        document.body.classList.add('fullscreen-enabled');
    }
    
    console.log('Score-based game initialized successfully');
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
window.sharePlayerStats = sharePlayerStats;
window.updateStatsDisplay = updateStatsDisplay;
window.loadPlayerStats = loadPlayerStats;
window.savePlayerStats = savePlayerStats;