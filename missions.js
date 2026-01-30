// ============================================
// TENCHU MISSIONS - COMPLETE MISSIONS SYSTEM
// ============================================

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
let missionStatus = {};
let selectedMissionItems = [];

// Initialize missions system
async function loadMissions() {
    try {
        const response = await fetch('missions.json');
        const data = await response.json();
        missions = data.missions;
        
        // Load mission status from localStorage
        const savedStatus = localStorage.getItem('tenchuMissionsStatus');
        if (savedStatus) {
            missionStatus = JSON.parse(savedStatus);
        }
        
        console.log(`Loaded ${missions.length} missions`);
    } catch (error) {
        console.error("Error loading missions:", error);
        missions = [];
    }
}

// Get available missions based on player rank
function getAvailableMissions() {
    const rankOrder = ["apprentice", "shinobi", "assassin", "ninja", "masterNinja", "grandMaster"];
    const playerRankIndex = rankOrder.indexOf(playerStats.currentRank);
    
    return missions.filter(mission => {
        // Check rank requirement
        const missionRankIndex = rankOrder.indexOf(mission.requiredRank);
        if (missionRankIndex > playerRankIndex) return false;
        
        // Check status
        const status = missionStatus[mission.id];
        
        // Always show completed/failed for replay
        if (status === 'completed' || status === 'failed') return true;
        
        // Check coin requirements for new missions
        if (mission.requirements?.minCoins && playerStats.coins < mission.requirements.minCoins) {
            return false;
        }
        
        // Check prerequisites
        if (mission.prerequisites) {
            for (const prereq of mission.prerequisites) {
                if (missionStatus[prereq] !== 'completed') return false;
            }
        }
        
        return true;
    });
}

// Update missions list display - REORDERED: Missions list first
function updateMissionsList() {
    const missionsList = document.getElementById('missions-list');
    if (!missionsList) return;
    
    const availableMissions = getAvailableMissions();
    
    let missionsHTML = '';
    
    // MISSIONS LIST SECTION - MOVED TO TOP
    if (availableMissions.length > 0) {
        missionsHTML += `
            <div class="available-missions-title">
                <h3><i class="fas fa-list"></i> AVAILABLE MISSIONS (${availableMissions.length})</h3>
            </div>
            
            <div class="missions-container">
        `;
        
        availableMissions.forEach(mission => {
            const status = missionStatus[mission.id] || 'new';
            const statusClass = status === 'completed' ? 'mission-completed' : 
                              status === 'failed' ? 'mission-failed' : 
                              status === 'in-progress' ? 'mission-in-progress' : 'mission-new';
            
            // Difficulty color
            let difficultyColor = '#00aa00';
            if (mission.difficulty === 'medium') difficultyColor = '#d4af37';
            if (mission.difficulty === 'hard') difficultyColor = '#8b0000';
            
            missionsHTML += `
                <div class="mission-item ${statusClass}">
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
                            <i class="fas fa-flag"></i>
                            <span>${mission.story ? mission.story.length : '5'} scenes</span>
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
                    
                    <button class="btn-ninja btn-mission-start" onclick="startMission('${mission.id}')">
                        ${getButtonText(status)}
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        });
        
        missionsHTML += `</div>`;
    }
    
    // INFORMATION SECTION - MOVED TO BOTTOM
    missionsHTML += `
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
    `;
    
    // Show "no missions" message only if there are none
    if (availableMissions.length === 0) {
        missionsHTML += `
            <div class="no-missions">
                <i class="fas fa-ban"></i>
                <h4>NO MISSIONS AVAILABLE</h4>
                <p>Increase your rank or complete trials to unlock missions!</p>
                <button class="btn-ninja" onclick="showStatsScreen()">
                    <i class="fas fa-chart-line"></i> CHECK YOUR RANK
                </button>
            </div>
        `;
    }
    
    missionsHTML += `
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
    
    missionsList.innerHTML = missionsHTML;
}

// Start mission flow
function startMission(missionId) {
    currentMission = missions.find(m => m.id === missionId);
    if (!currentMission) {
        console.error('Mission not found:', missionId);
        return;
    }
    
    // Set mission status if new
    if (!missionStatus[missionId]) {
        missionStatus[missionId] = 'in-progress';
        saveMissionStatus();
    }
    
    // Reset mission state
    missionState = {
        spotted: false,
        alerts: 0,
        kills: 0,
        itemsUsed: {},
        discoveredPaths: [],
        stealthScore: 0,
        timeElapsed: 0
    };
    
    selectedMissionItems = [];
    
    // Show mission briefing
    showMissionBriefing();
}

// Mission briefing screen
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

// Items selection screen
function showItemsScreen() {
    const itemsHTML = `
        <div class="items-selection">
            <div class="items-header">
                <h2><i class="fas fa-backpack"></i> MISSION EQUIPMENT</h2>
                <div class="inventory-summary">
                    <span class="coins-display"><i class="fas fa-coins"></i> ${playerStats.coins} coins available</span>
                </div>
            </div>
            
            <div class="items-instruction">
                <p><i class="fas fa-info-circle"></i> Select items for your mission. Each item has limited uses. Choose wisely.</p>
            </div>
            
            <div class="items-layout">
                <div class="shop-section">
                    <h3><i class="fas fa-store"></i> NINJA TOOL SHOP</h3>
                    <p class="section-desc">Purchase items with your coins.</p>
                    <div class="shop-items-grid" id="shop-items">
                        <!-- Shop items loaded here -->
                    </div>
                </div>
                
                <div class="selection-section">
                    <h3><i class="fas fa-toolbox"></i> SELECTED EQUIPMENT</h3>
                    <p class="section-desc">Items you'll bring on this mission.</p>
                    
                    <div class="selected-items-container">
                        <div class="selected-items-list" id="selected-items">
                            <div class="empty-state" id="empty-items">
                                <i class="fas fa-box-open"></i>
                                <p>No items selected</p>
                                <small>Select items from the shop</small>
                            </div>
                        </div>
                        
                        <div class="selection-stats">
                            <div class="stat-item">
                                <span>Items Selected:</span>
                                <span id="items-count">0</span>
                            </div>
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
}

// Load shop items
function loadShopItems() {
    const shopItems = [
        { id: 'grappling_hook', name: 'Grappling Hook', cost: 50, description: 'Scale walls and buildings' },
        { id: 'smoke_bomb', name: 'Smoke Bomb', cost: 30, description: 'Create cover for escape' },
        { id: 'sleeping_dart', name: 'Sleeping Dart', cost: 40, description: 'Silently incapacitate targets' },
        { id: 'firecracker', name: 'Firecracker', cost: 20, description: 'Create diversions' }
    ];
    
    const shopContainer = document.getElementById('shop-items');
    shopContainer.innerHTML = '';
    
    shopItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `
            <div class="shop-item-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="shop-item-cost">
                    <i class="fas fa-coins"></i> ${item.cost} coins
                </div>
            </div>
            <button class="btn-ninja btn-buy" onclick="buyItem('${item.id}', ${item.cost})" 
                    ${playerStats.coins < item.cost ? 'disabled' : ''}>
                <i class="fas fa-cart-plus"></i> BUY
            </button>
        `;
        shopContainer.appendChild(itemDiv);
    });
}

// Buy item
function buyItem(itemId, cost) {
    if (playerStats.coins >= cost) {
        playerStats.coins -= cost;
        if (!selectedMissionItems.includes(itemId)) {
            selectedMissionItems.push(itemId);
        }
        savePlayerStats();
        updateSelectedItems();
    }
}

// Update selected items display
function updateSelectedItems() {
    const selectedContainer = document.getElementById('selected-items');
    const itemsCount = document.getElementById('items-count');
    
    if (selectedMissionItems.length === 0) {
        selectedContainer.innerHTML = `
            <div class="empty-state" id="empty-items">
                <i class="fas fa-box-open"></i>
                <p>No items selected</p>
                <small>Select items from the shop</small>
            </div>
        `;
        itemsCount.textContent = '0';
    } else {
        selectedContainer.innerHTML = '';
        selectedMissionItems.forEach(itemId => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'selected-item';
            itemDiv.innerHTML = `
                <span class="item-name">${formatItemName(itemId)}</span>
                <button class="btn-remove" onclick="removeItem('${itemId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            selectedContainer.appendChild(itemDiv);
        });
        itemsCount.textContent = selectedMissionItems.length;
    }
    
    // Update start button
    const startBtn = document.getElementById('start-mission-btn');
    if (startBtn) {
        startBtn.disabled = false;
    }
}

// Remove item
function removeItem(itemId) {
    selectedMissionItems = selectedMissionItems.filter(item => item !== itemId);
    updateSelectedItems();
}

// Clear selected items
function clearSelectedItems() {
    selectedMissionItems = [];
    updateSelectedItems();
}

// Start mission gameplay
function startMissionGame() {
    if (!currentMission || !currentMission.story) {
        console.error('No mission or story data');
        return;
    }
    
    currentScene = currentMission.story[0];
    showMissionScene();
}

// Show mission scene - UPDATED: Add feedback system
function showMissionScene() {
    if (!currentScene) {
        endMission('failure');
        return;
    }
    
    const sceneHTML = `
        <div class="mission-scene">
            <div class="scene-header">
                <div class="scene-info">
                    <div class="scene-title">${currentMission.title}</div>
                </div>
            </div>
            
            <div class="scene-visual">
                <div class="scene-image" id="scene-image">
                    <div class="image-fallback">
                        <i class="fas fa-mountain"></i>
                        <div class="fallback-text">${currentScene.fallbackImage || 'Mission Scene'}</div>
                    </div>
                </div>
            </div>
            
            <div class="scene-content">
                <div class="scene-text">
                    <div class="text-header">
                        <i class="fas fa-quote-left"></i>
                        <h3>SITUATION</h3>
                    </div>
                    <p>${currentScene.text}</p>
                </div>
                
                <!-- Feedback Message Area -->
                <div id="mission-feedback" class="mission-feedback hidden">
                    <div class="feedback-content">
                        <i class="fas fa-comment-alt"></i>
                        <span id="feedback-message"></span>
                    </div>
                </div>
                
                <div class="scene-options-container">
                    <h4><i class="fas fa-crosshairs"></i> YOUR MOVE</h4>
                    <div class="scene-options" id="scene-options">
                        <!-- Options loaded here -->
                    </div>
                </div>
                
                <div class="inventory-panel">
                    <h4><i class="fas fa-toolbox"></i> YOUR ITEMS</h4>
                    <div class="items-panel" id="items-panel">
                        ${selectedMissionItems.map(item => `
                            <div class="available-item owned">
                                <i class="fas fa-check-circle"></i>
                                <span>${formatItemName(item)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showScreen('mission-game-screen');
    document.getElementById('mission-game-content').innerHTML = sceneHTML;
    
    // Load options
    loadSceneOptions(currentScene);
}

// Load scene options
function loadSceneOptions(scene) {
    const optionsContainer = document.getElementById('scene-options');
    if (!optionsContainer || !scene.options) return;
    
    optionsContainer.innerHTML = '';
    
    scene.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'btn-ninja option-btn';
        
        // Check if player has required item
        const hasItem = !option.requiredItem || selectedMissionItems.includes(option.requiredItem);
        
        optionBtn.innerHTML = `
            <span class="option-text">${option.text}</span>
            ${option.requiredItem ? `<span class="item-required">[${formatItemName(option.requiredItem)}]</span>` : ''}
        `;
        
        if (!hasItem) {
            optionBtn.disabled = true;
            optionBtn.title = `Requires: ${formatItemName(option.requiredItem)}`;
        }
        
        optionBtn.onclick = () => selectOption(option);
        optionsContainer.appendChild(optionBtn);
    });
}

// NEW: Show in-game feedback message
function showMissionFeedback(message, type = 'info') {
    const feedbackEl = document.getElementById('mission-feedback');
    const messageEl = document.getElementById('feedback-message');
    
    if (feedbackEl && messageEl) {
        messageEl.textContent = message;
        feedbackEl.className = `mission-feedback feedback-${type}`;
        feedbackEl.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            feedbackEl.style.display = 'none';
        }, 3000);
    }
}

// Handle option selection - UPDATED: Use in-game feedback
function selectOption(option) {
    // Disable all buttons during processing
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    // Check if spotted
    if (option.ifSpotted === "MISSION_FAILED") {
        missionState.spotted = true;
        setTimeout(() => {
            showMissionFeedback("You've been detected! Mission failed.", 'failure');
            setTimeout(() => endMission('failure'), 2000);
        }, 1000);
        return;
    }
    
    // Track item usage
    if (option.itemUsed) {
        if (!missionState.itemsUsed[option.itemUsed]) {
            missionState.itemsUsed[option.itemUsed] = 0;
        }
        missionState.itemsUsed[option.itemUsed]++;
        
        // Remove from selected items
        const itemIndex = selectedMissionItems.indexOf(option.itemUsed);
        if (itemIndex > -1) {
            selectedMissionItems.splice(itemIndex, 1);
        }
        
        // Update inventory display
        const itemsPanel = document.getElementById('items-panel');
        if (itemsPanel) {
            itemsPanel.innerHTML = selectedMissionItems.map(item => `
                <div class="available-item owned">
                    <i class="fas fa-check-circle"></i>
                    <span>${formatItemName(item)}</span>
                </div>
            `).join('');
        }
        
        // Show item usage feedback
        showMissionFeedback(`Used: ${formatItemName(option.itemUsed)}`, 'item');
    }
    
    // Track kills
    if (option.kills) {
        missionState.kills += option.kills;
        showMissionFeedback(`Silent kill. Enemy eliminated.`, 'stealth');
    }
    
    // Track stealth score and show feedback
    if (option.stealthBonus || option.stealthPenalty) {
        const scoreChange = (option.stealthBonus || 0) - (option.stealthPenalty || 0);
        missionState.stealthScore += scoreChange;
        
        if (scoreChange > 0) {
            showMissionFeedback(`Stealthy move! +${scoreChange} stealth`, 'success');
        } else if (scoreChange < 0) {
            showMissionFeedback(`Risk detected! ${scoreChange} stealth`, 'warning');
        }
    }
    
    // Show general feedback if provided
    if (option.feedback) {
        setTimeout(() => {
            showMissionFeedback(option.feedback, 'info');
        }, 500);
    }
    
    // VFX based on action
    if (typeof createGameVFX === 'function') {
        if (option.stealthBonus > (option.stealthPenalty || 0)) {
            setTimeout(() => createGameVFX('correct'), 300);
        } else if (option.stealthPenalty) {
            setTimeout(() => createGameVFX('incorrect'), 300);
        }
    }
    
    // Find next scene
    if (option.nextScene) {
        setTimeout(() => {
            const nextScene = findSceneByName(option.nextScene);
            if (nextScene) {
                currentScene = nextScene;
                showMissionScene();
            } else {
                // No next scene - mission complete
                endMission('success');
            }
        }, 1500);
    } else {
        // No next scene specified - mission complete
        setTimeout(() => endMission('success'), 1500);
    }
}

// Find scene by name
function findSceneByName(sceneName) {
    if (!currentMission || !currentMission.story) return null;
    return currentMission.story.find(scene => scene.scene === sceneName);
}

// End mission
function endMission(result) {
    const missionId = currentMission.id;
    
    if (result === 'success') {
        missionStatus[missionId] = 'completed';
        
        // Award rewards
        playerStats.coins += currentMission.reward.coins;
        playerStats.totalScore += currentMission.reward.points;
        
        // Update missions stats
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
        
        playerStats.missions.attempted++;
        playerStats.missions.completed++;
        playerStats.missions.totalKills += missionState.kills;
        
        // Check for perfect stealth
        if (missionState.alerts === 0 && missionState.kills === 0) {
            playerStats.missions.perfectStealth++;
        }
        
        savePlayerStats();
        saveMissionStatus();
        
        // Show success screen
        showMissionEndScreen('success');
        
    } else {
        missionStatus[missionId] = 'failed';
        
        // Update missions stats
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
        
        playerStats.missions.attempted++;
        playerStats.missions.failed++;
        
        savePlayerStats();
        saveMissionStatus();
        showMissionEndScreen('failure');
    }
}

// Show mission end screen
function showMissionEndScreen(result) {
    const isSuccess = result === 'success';
    const endData = isSuccess ? currentMission.successScene : currentMission.failureScene;
    
    const endHTML = `
        <div class="mission-end-screen ${result}">
            <div class="end-header">
                <h2>${isSuccess ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}</h2>
                <div class="end-subtitle">${currentMission.title}</div>
            </div>
            
            <div class="end-image-container">
                <div class="end-image-placeholder">
                    <i class="fas fa-${isSuccess ? 'trophy' : 'skull-crossbones'}"></i>
                </div>
            </div>
            
            <div class="end-text">
                <p>${endData.text}</p>
            </div>
            
            ${isSuccess ? `
            <div class="end-rewards">
                <h4><i class="fas fa-gift"></i> REWARDS EARNED</h4>
                <div class="rewards-earned">
                    <div class="reward-earned">
                        <i class="fas fa-coins"></i>
                        <span>+${currentMission.reward.coins} Coins</span>
                    </div>
                    <div class="reward-earned">
                        <i class="fas fa-star"></i>
                        <span>+${currentMission.reward.points} Points</span>
                    </div>
                    ${currentMission.reward.unlockItem ? 
                      `<div class="reward-earned">
                        <i class="fas fa-unlock"></i>
                        <span>Unlocked: ${formatItemName(currentMission.reward.unlockItem)}</span>
                      </div>` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="mission-stats">
                <h4><i class="fas fa-chart-bar"></i> MISSION STATISTICS</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span>Stealth Score:</span>
                        <span>${missionState.stealthScore}</span>
                    </div>
                    <div class="stat-item">
                        <span>Silent Kills:</span>
                        <span>${missionState.kills}</span>
                    </div>
                    <div class="stat-item">
                        <span>Items Used:</span>
                        <span>${Object.keys(missionState.itemsUsed).length}</span>
                    </div>
                    <div class="stat-item">
                        <span>Alerts Raised:</span>
                        <span>${missionState.alerts}</span>
                    </div>
                </div>
            </div>
            
            <div class="end-buttons">
                <button class="btn-ninja btn-retry" onclick="startMission('${currentMission.id}')">
                    <i class="fas fa-redo"></i> ${isSuccess ? 'PLAY AGAIN' : 'TRY AGAIN'}
                </button>
                <button class="btn-ninja btn-missions" onclick="backToMissionsList()">
                    <i class="fas fa-list"></i> MISSIONS LIST
                </button>
                <button class="btn-ninja btn-menu" onclick="backToMenu()">
                    <i class="fas fa-home"></i> MAIN MENU
                </button>
            </div>
        </div>
    `;
    
    showScreen('mission-end-screen');
    document.getElementById('mission-end-content').innerHTML = endHTML;
    
    if (isSuccess && typeof createGameVFX === 'function') {
        createGameVFX('victory');
    }
}

// Utility functions
function getStatusText(status) {
    const statusTexts = {
        'new': 'NEW',
        'in-progress': 'IN PROGRESS',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
    };
    return statusTexts[status] || status.toUpperCase();
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
    
    return true;
}

function saveMissionStatus() {
    localStorage.setItem('tenchuMissionsStatus', JSON.stringify(missionStatus));
}

// Navigation functions
function backToMissionsList() {
    showScreen('missions-screen');
    updateMissionsList();
}

// Initialize missions system
function initializeMissions() {
    loadMissions();
}

// Export functions for global access
window.updateMissionsList = updateMissionsList;
window.showMissionsScreen = function() {
    showScreen('missions-screen');
    updateMissionsList();
};
window.startMission = startMission;
window.backToMissionsList = backToMissionsList;
window.showMissionBriefing = showMissionBriefing;
window.showItemsScreen = showItemsScreen;
window.buyItem = buyItem;
window.removeItem = removeItem;
window.clearSelectedItems = clearSelectedItems;
window.showMissionFeedback = showMissionFeedback;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMissions);
} else {
    initializeMissions();
}