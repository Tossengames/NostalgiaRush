// ============================================
// TENCHU SHIREN - SIMPLIFIED DEBUG VERSION
// ============================================

// Game state
let playerName = "Nameless Warrior";
let currentQuestionIndex = 0;
let questions = [];
let gameActive = false;
let correctAnswers = 0;
let currentScreen = 'menu';

// Simple player stats
let playerStats = {
    totalScore: 0,
    trialsCompleted: 0,
    coins: 0,
    currentRank: "apprentice"
};

// Load player stats
function loadPlayerStats() {
    try {
        const saved = localStorage.getItem('tenchuShirenStats');
        if (saved) {
            playerStats = JSON.parse(saved);
        }
        const savedName = localStorage.getItem('tenchuShirenPlayerName');
        if (savedName) {
            playerName = savedName;
            document.getElementById('player-name-input').value = playerName;
        }
    } catch (error) {
        console.log("No saved stats found, starting fresh");
    }
}

// Save player stats
function savePlayerStats() {
    try {
        localStorage.setItem('tenchuShirenStats', JSON.stringify(playerStats));
        localStorage.setItem('tenchuShirenPlayerName', playerName);
    } catch (error) {
        console.error("Error saving stats");
    }
}

// Show screen
function showScreen(screenId) {
    console.log("Showing screen:", screenId);
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        screen.classList.add('active');
        currentScreen = screenId;
    }
}

// Menu functions
function showPlayerNameScreen() {
    showScreen('player-name-screen');
    document.getElementById('player-name-input').focus();
}

function showInfo() {
    showScreen('info');
}

function showSupporters() {
    showScreen('supporters-screen');
}

function showStatsScreen() {
    showScreen('stats-screen');
    updateStatsDisplay();
}

function showMissionsScreen() {
    showScreen('missions-screen');
}

function backToMenu() {
    showScreen('menu');
    gameActive = false;
}

// Set player name
function setPlayerName() {
    const input = document.getElementById('player-name-input');
    if (input && input.value.trim() !== '') {
        playerName = input.value.trim();
        console.log("Player name set:", playerName);
        savePlayerStats();
    }
    startGame();
}

// Start game
async function startGame() {
    console.log("Starting game...");
    
    // Reset state
    currentQuestionIndex = 0;
    correctAnswers = 0;
    gameActive = true;
    
    try {
        // Load questions
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Failed to load questions');
        const data = await response.json();
        questions = data.slice(0, 5); // Take first 5 questions
        console.log("Loaded questions:", questions.length);
    } catch (error) {
        console.error("Error loading questions:", error);
        alert("Failed to load questions. Using default questions.");
        // Create default questions if file doesn't exist
        questions = [
            {
                question: "What is Rikimaru's signature weapon?",
                options: ["Katana", "Kunai", "Shuriken", "Izayoi"],
                answer: "Izayoi",
                commentator: "rikimaru",
                difficulty: "Easy"
            },
            {
                question: "What does 'Tenchu' mean?",
                options: ["Heaven's Punishment", "Shadow Warrior", "Silent Death", "Night Blade"],
                answer: "Heaven's Punishment",
                commentator: "ayame",
                difficulty: "Easy"
            }
        ];
    }
    
    showScreen('game');
    document.getElementById('current-player').textContent = playerName.toUpperCase();
    loadQuestion();
}

// Load question
function loadQuestion() {
    if (!gameActive || currentQuestionIndex >= questions.length) {
        showResults();
        return;
    }
    
    const question = questions[currentQuestionIndex];
    
    // Update UI
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('trial-number').textContent = currentQuestionIndex + 1;
    document.getElementById('current-trial').textContent = currentQuestionIndex + 1;
    
    // Create options
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
            // Disable all buttons
            const allButtons = optionsDiv.querySelectorAll('button');
            allButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            });
            
            // Check answer
            const isCorrect = option === question.answer;
            if (isCorrect) {
                correctAnswers++;
                button.style.borderColor = '#00ff00';
            } else {
                button.style.borderColor = '#ff0000';
            }
            
            // Move to next question
            setTimeout(() => {
                currentQuestionIndex++;
                loadQuestion();
            }, 1000);
        };
        
        optionsDiv.appendChild(button);
    });
}

// Show results
function showResults() {
    const totalQuestions = questions.length;
    const pointsEarned = correctAnswers * 20;
    const coinsEarned = correctAnswers * 2;
    
    // Update player stats
    playerStats.totalScore += pointsEarned;
    playerStats.trialsCompleted++;
    playerStats.coins += coinsEarned;
    savePlayerStats();
    
    // Update results display
    document.getElementById('result-correct').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('result-points').textContent = `+${pointsEarned}`;
    document.getElementById('result-coins').textContent = `+${coinsEarned}`;
    document.getElementById('result-total').textContent = playerStats.totalScore;
    
    // Show character feedback
    let feedbackText = "";
    if (correctAnswers === totalQuestions) {
        feedbackText = "Perfect! Your skills are exceptional.";
    } else if (correctAnswers >= totalQuestions / 2) {
        feedbackText = "Good performance. Continue your training.";
    } else {
        feedbackText = "You need more practice. Study the ancient ways.";
    }
    document.getElementById('feedback-text').textContent = feedbackText;
    
    // Show results screen
    const gameScreens = ['question-screen', 'appreciation-screen', 'result-screen'];
    gameScreens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        }
    });
    
    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) {
        resultScreen.classList.remove('hidden');
        resultScreen.classList.add('active');
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('stats-player-name').textContent = playerName.toUpperCase();
    document.getElementById('stat-total-score').textContent = playerStats.totalScore;
    document.getElementById('stat-trials-completed').textContent = playerStats.trialsCompleted;
    document.getElementById('stat-coins').textContent = playerStats.coins;
    
    // Calculate success rate
    const successRate = playerStats.trialsCompleted > 0 
        ? Math.round((playerStats.totalScore / (playerStats.trialsCompleted * 100)) * 100)
        : 0;
    document.getElementById('stat-success-rate').textContent = `${successRate}%`;
}

// Initialize
window.addEventListener('DOMContentLoaded', function() {
    console.log("Game initializing...");
    
    // Load stats
    loadPlayerStats();
    
    // Show menu
    showScreen('menu');
    
    // Setup name input
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
    
    console.log("Game initialized successfully");
});

// Export functions
window.showPlayerNameScreen = showPlayerNameScreen;
window.showInfo = showInfo;
window.showSupporters = showSupporters;
window.showStatsScreen = showStatsScreen;
window.showMissionsScreen = showMissionsScreen;
window.backToMenu = backToMenu;
window.setPlayerName = setPlayerName;
window.startGame = startGame;
window.showResults = showResults;