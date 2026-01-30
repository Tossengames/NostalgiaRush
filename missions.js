// missions.js - COMPLETE Tenchu Missions System
let missions = [];
let currentMission = null;
let currentScene = null;
let missionState = {
    spotted: false,
    alerts: 0,
    kills: 0,
    itemsUsed: {},
    discoveredPaths: [],
    stealthScore: 0,
    timeElapsed: 0
};
let playerInventory = {};

// Initialize missions system
async function loadMissions() {
    try {
        const response = await fetch('missions.json');
        const data = await response.json();
        missions = data.missions;
        
        // Load mission status
        const savedStatus = localStorage.getItem('tenchuMissionsStatus');
        if (savedStatus) missionStatus = JSON.parse(savedStatus);
        
        // Load inventory
        loadPlayerInventory();
        
        console.log(`Loaded ${missions.length} missions`);
        updateMissionsList();
    } catch (error) {
        console.error("Error loading missions:", error);
        missions = [];
    }
}

// Enhanced inventory system
function loadPlayerInventory() {
    const saved = localStorage.getItem('tenchuPlayerInventory');
    playerInventory = saved ? JSON.parse(saved) : {
        smoke_bomb: 3,
        shuriken: 10,
        grappling_hook: 1,
        firecracker: 5,
        sleeping_dart: 2,
        poison_rice: 3,
        medicinal_herb: 2
    };
    
    // Ensure all items have quantity
    const defaultItems = ['smoke_bomb', 'shuriken', 'grappling_hook', 'firecracker', 
                         'sleeping_dart', 'poison_rice', 'medicinal_herb'];
    defaultItems.forEach(item => {
        if (playerInventory[item] === undefined) playerInventory[item] = 0;
    });
}

function savePlayerInventory() {
    localStorage.setItem('tenchuPlayerInventory', JSON.stringify(playerInventory));
}

// Enhanced mission filtering
function getAvailableMissions() {
    const rankOrder = ["apprentice", "shinobi", "assassin", "ninja", "masterNinja", "grandMaster"];
    const playerRankIndex = rankOrder.indexOf(playerStats.currentRank);
    
    return missions.filter(mission => {
        // Check rank requirement
        const missionRankIndex = rankOrder.indexOf(mission.requiredRank);
        if (missionRankIndex > playerRankIndex) return false;
        
        // Check if already completed/failed
        const status = missionStatus[mission.id];
        
        // Always show completed/failed for replay
        if (status === 'completed' || status === 'failed') return true;
        
        // Check coin requirements for new missions
        if (mission.requirements?.minCoins && playerStats.coins < mission.requirements.minCoins) {
            return false;
        }
        
        // Check if prerequisites are met
        if (mission.prerequisites) {
            for (const prereq of mission.prerequisites) {
                if (missionStatus[prereq] !== 'completed') return false;
            }
        }
        
        return true;
    });
}

// Enhanced missions list display
function updateMissionsList() {
    const missionsList = document.getElementById('missions-list');
    if (!missionsList) return;
    
    // Clear and add introduction
    missionsList.innerHTML = `
        <div class="missions-intro">
            <h3><i class="fas fa-info-circle"></i> AZUMA CLAN MISSIONS</h3>
            <p class="intro-text">
                Test your skills with special operations. Each mission challenges your stealth, 
                judgment, and knowledge of ninja arts.
            </p>
            
            <div class="mission-guide">
                <h4><i class="fas fa-book"></i> HOW MISSIONS WORK:</h4>
                <ul>
                    <li><i class="fas fa-user-secret"></i> <strong>Stealth Required:</strong> If detected even once, mission fails instantly</li>
                    <li><i class="fas fa-arrow-up"></i> <strong>Rank-Based:</strong> Higher rank unlocks more challenging missions</li>
                    <li><i class="fas fa-tools"></i> <strong>Items Help:</strong> Use tools from your inventory for better options</li>
                    <li><i class="fas fa-sync-alt"></i> <strong>Branching Paths:</strong> Your choices create different outcomes</li>
                    <li><i class="fas fa-coins"></i> <strong>Rewards:</strong> Earn coins and points for successful missions</li>
                </ul>
            </div>
            
            <div class="mission-rules-box">
                <h4><i class="fas fa-scroll"></i> MISSION RULES:</h4>
                <div class="rule-item">
                    <div class="rule-icon"><i class="fas fa-eye-slash"></i></div>
                    <div class="rule-content">
                        <h5>STEALTH IS EVERYTHING</h5>
                        <p>Once an enemy sees you, the mission fails immediately. Stay in shadows, avoid line of sight.</p>
                    </div>
                </div>
                <div class="rule-item">
                    <div class="rule-icon"><i class="fas fa-chess-board"></i></div>
                    <div class="rule-content">
                        <h5>BRANCHING NARRATIVE</h5>
                        <p>Your choices matter. Each decision leads to different scenes and outcomes.</p>
                    </div>
                </div>
                <div class="rule-item">
                    <div class="rule-icon"><i class="fas fa-box-open"></i></div>
                    <div class="rule-content">
                        <h5>ITEM MANAGEMENT</h5>
                        <p>Use items from your inventory. Plan carefully - they're limited!</p>
                    </div>
                </div>
            </div>
            
            <div class="missions-development">
                <h4><i class="fas fa-hourglass-half"></i> MORE MISSIONS COMING!</h4>
                <p class="update-notice">
                    New missions are added regularly with complex scenarios and unique challenges. 
                    Your support helps create more content for the Azuma clan!
                </p>
                <button class="btn-ninja btn-support-small" onclick="showSupporters()">
                    <i class="fas fa-heart"></i> SUPPORT DEVELOPMENT
                </button>
            </div>
        </div>
    `;
    
    // Add available missions
    const availableMissions = getAvailableMissions();
    const sortedMissions = sortMissions(availableMissions);
    
    if (sortedMissions.length === 0) {
        missionsList.innerHTML += `
            <div class="no-missions">
                <i class="fas fa-ban"></i>
                <h4>NO MISSIONS AVAILABLE</h4>
                <p>Increase your rank or earn more coins to unlock missions!</p>
                <button class="btn-ninja" onclick="showStatsScreen()">
                    <i class="fas fa-chart-line"></i> IMPROVE YOUR RANK
                </button>
            </div>
        `;
        return;
    }
    
    const missionsContainer = document.createElement('div');
    missionsContainer.className = 'missions-container';
    missionsContainer.innerHTML = `<h3 class="available-missions-title"><i class="fas fa-list"></i> AVAILABLE MISSIONS</h3>`;
    
    sortedMissions.forEach(mission => {
        const status = missionStatus[mission.id] || 'new';
        const statusClass = status === 'completed' ? 'mission-completed' : 
                          status === 'failed' ? 'mission-failed' : 
                          status === 'in-progress' ? 'mission-in-progress' : 'mission-new';
        
        const missionItem = document.createElement('div');
        missionItem.className = `mission-item ${statusClass}`;
        
        // Difficulty color coding
        let difficultyColor = '#00aa00';
        if (mission.difficulty === 'medium') difficultyColor = '#d4af37';
        if (mission.difficulty === 'hard') difficultyColor = '#8b0000';
        
        missionItem.innerHTML = `
            <div class="mission-header">
                <div class="mission-title-section">
                    <h3>${mission.title}</h3>
                    <span class="mission-theme">${mission.theme ? mission.theme.toUpperCase() : 'STEALTH'}</span>
                </div>
                <div class="mission-meta">
                    <span class="mission-difficulty" style="border-color: ${difficultyColor}; color: ${difficultyColor}">
                        ${mission.difficulty.toUpperCase()}
                    </span>
                    <span class="mission-status">${getStatusText(status)}</span>
                </div>
            </div>
            
            <p class="mission-description">${mission.description}</p>
            
            <div class="mission-details">
                <div class="detail-item">
                    <i class="fas fa-moon"></i>
                    <span>${mission.timeOfDay || 'NIGHT'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>Rank: ${mission.requiredRank.toUpperCase()}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${estimateMissionLength(mission)} scenes</span>
                </div>
            </div>
            
            <div class="mission-rewards">
                <div class="reward-item">
                    <i class="fas fa-coins" style="color: #d4af37;"></i>
                    <span>${mission.reward.coins} Coins</span>
                </div>
                <div class="reward-item">
                    <i class="fas fa-star" style="color: #8b0000;"></i>
                    <span>${mission.reward.points} Points</span>
                </div>
                ${mission.reward.unlockItem ? `
                <div class="reward-item">
                    <i class="fas fa-gift" style="color: #9370db;"></i>
                    <span>Unlocks: ${formatItemName(mission.reward.unlockItem)}</span>
                </div>` : ''}
            </div>
            
            <button class="btn-ninja btn-mission-start" onclick="startMission('${mission.id}')"
                    ${status === 'completed' ? 'style="background: rgba(0,170,0,0.2)"' : ''}>
                ${getButtonText(status)}
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
        
        missionsContainer.appendChild(missionItem);
    });
    
    missionsList.appendChild(missionsContainer);
}

// Enhanced mission briefing
function showMissionBriefing() {
    const briefingHTML = `
        <div class="mission-briefing">
            <div class="briefing-header">
                <h2>${currentMission.title}</h2>
                <div class="mission-tags">
                    <span class="tag-difficulty ${currentMission.difficulty}">${currentMission.difficulty.toUpperCase()}</span>
                    <span class="tag-theme">${currentMission.theme?.toUpperCase() || 'STEALTH'}</span>
                    <span class="tag-time"><i class="fas fa-clock"></i> ${currentMission.timeOfDay?.toUpperCase() || 'NIGHT'}</span>
                </div>
            </div>
            
            <div class="briefing-content">
                <div class="briefing-story">
                    <h4><i class="fas fa-scroll"></i> BRIEFING</h4>
                    <p>${currentMission.description}</p>
                    
                    <div class="mission-objective">
                        <h5><i class="fas fa-bullseye"></i> PRIMARY OBJECTIVE</h5>
                        <p>Complete infiltration without being detected. Detection equals mission failure.</p>
                    </div>
                </div>
                
                <div class="briefing-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p><strong>WARNING:</strong> This is a Tenchu-style mission. Stealth is mandatory. Combat is a last resort.</p>
                </div>
                
                <div class="briefing-sections">
                    <div class="briefing-section">
                        <h4><i class="fas fa-trophy"></i> REWARDS</h4>
                        <div class="rewards-grid">
                            <div class="reward-card">
                                <div class="reward-icon gold"><i class="fas fa-coins"></i></div>
                                <div class="reward-info">
                                    <div class="reward-value">${currentMission.reward.coins}</div>
                                    <div class="reward-label">Coins</div>
                                </div>
                            </div>
                            <div class="reward-card">
                                <div class="reward-icon blood"><i class="fas fa-star"></i></div>
                                <div class="reward-info">
                                    <div class="reward-value">${currentMission.reward.points}</div>
                                    <div class="reward-label">Points</div>
                                </div>
                            </div>
                            ${currentMission.reward.unlockItem ? `
                            <div class="reward-card">
                                <div class="reward-icon purple"><i class="fas fa-gift"></i></div>
                                <div class="reward-info">
                                    <div class="reward-value">${formatItemName(currentMission.reward.unlockItem)}</div>
                                    <div class="reward-label">Item Unlock</div>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <div class="briefing-section">
                        <h4><i class="fas fa-clipboard-check"></i> REQUIREMENTS</h4>
                        <div class="requirements-list">
                            <div class="req-item">
                                <i class="fas fa-shield-alt"></i>
                                <div>
                                    <div class="req-title">Minimum Rank</div>
                                    <div class="req-value ${playerStats.currentRank === currentMission.requiredRank ? 'met' : 'unmet'}">
                                        ${currentMission.requiredRank.toUpperCase()}
                                        ${playerStats.currentRank === currentMission.requiredRank ? 
                                          '<i class="fas fa-check"></i>' : 
                                          '<i class="fas fa-times"></i>'}
                                    </div>
                                </div>
                            </div>
                            ${currentMission.requirements?.minCoins ? `
                            <div class="req-item">
                                <i class="fas fa-coins"></i>
                                <div>
                                    <div class="req-title">Minimum Coins</div>
                                    <div class="req-value ${playerStats.coins >= currentMission.requirements.minCoins ? 'met' : 'unmet'}">
                                        ${currentMission.requirements.minCoins}
                                        ${playerStats.coins >= currentMission.requirements.minCoins ? 
                                          '<i class="fas fa-check"></i>' : 
                                          '<i class="fas fa-times"></i>'}
                                    </div>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="briefing-stealth-tips">
                    <h4><i class="fas fa-user-secret"></i> STEALTH TIPS</h4>
                    <ul>
                        <li>Stay in shadows whenever possible</li>
                        <li>Move during patrol gaps</li>
                        <li>Use items strategically</li>
                        <li>Plan your route before moving</li>
                        <li>Remember: detection = instant failure</li>
                    </ul>
                </div>
            </div>
            
            <div class="briefing-buttons">
                <button class="btn-ninja btn-back" onclick="backToMissionsList()">
                    <i class="fas fa-arrow-left"></i> BACK TO MISSIONS
                </button>
                <button class="btn-ninja btn-next" onclick="showItemsScreen()"
                        ${!checkMissionRequirements() ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i> SELECT EQUIPMENT
                    ${!checkMissionRequirements() ? '<span class="btn-warning">Requirements not met</span>' : ''}
                </button>
            </div>
        </div>
    `;
    
    showScreen('mission-briefing-screen');
    document.getElementById('briefing-content').innerHTML = briefingHTML;
}

// Enhanced items screen with inventory display
function showItemsScreen() {
    const itemsHTML = `
        <div class="items-selection">
            <div class="items-header">
                <h2><i class="fas fa-backpack"></i> MISSION EQUIPMENT</h2>
                <div class="inventory-summary">
                    <span class="coins-display"><i class="fas fa-coins"></i> ${playerStats.coins} coins available</span>
                    <button class="btn-inventory-view" onclick="showInventoryStats()">
                        <i class="fas fa-boxes"></i> View Full Inventory
                    </button>
                </div>
            </div>
            
            <div class="items-instruction">
                <p><i class="fas fa-info-circle"></i> Select items for your mission. Each item has limited uses. Choose wisely.</p>
            </div>
            
            <div class="items-layout">
                <div class="shop-section">
                    <h3><i class="fas fa-store"></i> NINJA TOOL SHOP</h3>
                    <p class="section-desc">Purchase items with your coins. These will be added to your permanent inventory.</p>
                    <div class="shop-items-grid" id="shop-items">
                        <!-- Shop items loaded here -->
                    </div>
                </div>
                
                <div class="selection-section">
                    <h3><i class="fas fa-toolbox"></i> SELECTED EQUIPMENT</h3>
                    <p class="section-desc">Items you'll bring on this mission. Click items to remove them.</p>
                    
                    <div class="selected-items-container">
                        <div class="selected-items-list" id="selected-items">
                            <div class="empty-state" id="empty-items">
                                <i class="fas fa-box-open"></i>
                                <p>No items selected</p>
                                <small>Select items from the shop or your inventory</small>
                            </div>
                        </div>
                        
                        <div class="selection-stats">
                            <div class="stat-item">
                                <span>Items Selected:</span>
                                <span id="items-count">0</span>
                            </div>
                            <div class="stat-item">
                                <span>Total Cost:</span>
                                <span id="total-cost">0</span> coins
                            </div>
                            <div class="stat-item">
                                <span>Can Afford:</span>
                                <span id="afford-status" class="afford-yes">YES</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="current-inventory">
                        <h4><i class="fas fa-boxes"></i> YOUR CURRENT INVENTORY</h4>
                        <div class="inventory-items" id="current-inventory">
                            <!-- Current inventory items -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="items-buttons">
                <button class="btn-ninja btn-back" onclick="showMissionBriefing()">
                    <i class="fas fa-arrow-left"></i> BACK
                </button>
                <button class="btn-ninja btn-clear" onclick="clearSelectedItems()">
                    <i class="fas fa-trash"></i> CLEAR SELECTION
                </button>
                <button class="btn-ninja btn-start" onclick="startMissionGame()" id="start-mission-btn">
                    <i class="fas fa-play"></i> BEGIN MISSION
                </button>
            </div>
        </div>
    `;
    
    showScreen('mission-items-screen');
    document.getElementById('items-content').innerHTML = itemsHTML;
    loadShopItems();
    updateSelectedItems();
    updateCurrentInventory();
}

// Enhanced mission gameplay with Tenchu rules
function showMissionScene() {
    if (missionState.spotted) {
        endMission('failure');
        return;
    }
    
    const scene = findScene(currentScene);
    if (!scene) {
        endMission('success');
        return;
    }
    
    const sceneHTML = `
        <div class="mission-scene">
            <div class="scene-header">
                <div class="scene-info">
                    <div class="scene-title">${currentMission.title}</div>
                    <div class="scene-progress">
                        Scene <span id="scene-current">${getSceneIndex(currentScene) + 1}</span> / 
                        <span id="scene-total">${estimateMissionLength(currentMission)}</span>
                    </div>
                </div>
                <div class="mission-status-display">
                    <div class="status-item ${missionState.alerts > 0 ? 'alert' : ''}">
                        <i class="fas fa-bell"></i>
                        <span>Alerts: ${missionState.alerts}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-skull"></i>
                        <span>Kills: ${missionState.kills}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-user-secret"></i>
                        <span>Stealth: ${missionState.stealthScore}</span>
                    </div>
                </div>
            </div>
            
            <div class="scene-visual">
                <div class="scene-image" id="scene-image">
                    <div class="image-fallback">
                        <i class="fas fa-mountain"></i>
                        <div class="fallback-text">${scene.fallbackImage || 'Mission Scene'}</div>
                    </div>
                </div>
                ${scene.timeOfDay ? `<div class="scene-time">${scene.timeOfDay.toUpperCase()}</div>` : ''}
            </div>
            
            <div class="scene-content">
                <div class="scene-text">
                    <div class="text-header">
                        <i class="fas fa-quote-left"></i>
                        <h3>SITUATION</h3>
                    </div>
                    <p>${scene.text}</p>
                    
                    ${scene.ifSpotted ? `
                    <div class="warning-box">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p><strong>CRITICAL:</strong> ${scene.ifSpotted}</p>
                    </div>` : ''}
                </div>
                
                <div class="scene-options-container">
                    <h4><i class="fas fa-crosshairs"></i> YOUR MOVE</h4>
                    <div class="scene-options" id="scene-options">
                        <!-- Options loaded here -->
                    </div>
                </div>
                
                <div class="inventory-panel">
                    <h4><i class="fas fa-toolbox"></i> AVAILABLE ITEMS</h4>
                    <div class="items-panel" id="items-panel">
                        <!-- Available items loaded here -->
                    </div>
                    <div class="inventory-help">
                        <i class="fas fa-info-circle"></i>
                        <small>Items may unlock additional options. Click to use if available.</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showScreen('mission-game-screen');
    document.getElementById('mission-game-content').innerHTML = sceneHTML;
    
    // Try to load image with fallback
    const imageContainer = document.getElementById('scene-image');
    if (scene.image) {
        const img = new Image();
        img.src = scene.image;
        img.onload = function() {
            imageContainer.style.backgroundImage = `url('${scene.image}')`;
            imageContainer.innerHTML = '';
        };
        img.onerror = function() {
            // Keep fallback if image fails to load
        };
    }
    
    // Load options
    loadSceneOptions(scene);
    
    // Load available items
    loadAvailableItems(scene);
}

// Enhanced stats screen integration
function updateMissionStats() {
    // Update mission stats in playerStats
    if (!playerStats.missions) {
        playerStats.missions = {
            attempted: 0,
            completed: 0,
            failed: 0,
            perfectStealth: 0,
            totalKills: 0,
            itemsUsed: 0,
            favoriteItem: null,
            bestMission: null
        };
    }
    
    // This would be called after each mission
    savePlayerStats();
}

// Utility functions
function estimateMissionLength(mission) {
    return mission.story ? mission.story.length : 5;
}

function getStatusText(status) {
    const texts = {
        'new': 'NEW',
        'in-progress': 'IN PROGRESS',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
    };
    return texts[status] || status.toUpperCase();
}

function getButtonText(status) {
    const texts = {
        'new': 'START MISSION',
        'in-progress': 'CONTINUE MISSION',
        'completed': 'REPLAY MISSION',
        'failed': 'TRY AGAIN'
    };
    return texts[status] || 'START MISSION';
}

function formatItemName(itemId) {
    return itemId.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function checkMissionRequirements() {
    if (!currentMission) return false;
    
    // Check rank
    const rankOrder = ["apprentice", "shinobi", "assassin", "ninja", "masterNinja", "grandMaster"];
    const playerRankIndex = rankOrder.indexOf(playerStats.currentRank);
    const missionRankIndex = rankOrder.indexOf(currentMission.requiredRank);
    
    if (missionRankIndex > playerRankIndex) return false;
    
    // Check coins
    if (currentMission.requirements?.minCoins && 
        playerStats.coins < currentMission.requirements.minCoins) {
        return false;
    }
    
    // Check prerequisites
    if (currentMission.prerequisites) {
        for (const prereq of currentMission.prerequisites) {
            if (missionStatus[prereq] !== 'completed') return false;
        }
    }
    
    return true;
}

// Initialize missions system
function initializeMissions() {
    loadMissions();
}

// Export functions
window.startMission = startMission;
window.showMissionsListScreen = showMissionsListScreen;
window.backToMissionsList = backToMissionsList;
window.showMissionBriefing = showMissionBriefing;
window.showItemsScreen = showItemsScreen;
window.showInventoryStats = function() {
    // Could show a modal with full inventory stats
    alert(`Full Inventory:\n${Object.entries(playerInventory)
        .map(([item, qty]) => `${formatItemName(item)}: ${qty}`)
        .join('\n')}`);
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMissions);
} else {
    initializeMissions();
}