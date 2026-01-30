// supporters.js - Enhanced with Rank System
// Easy to edit: Just add new supporters to the array below

const supporters = [
    {
        name: "Shadow Walker",
        handle: "@NinjaPath",
        rank: "grandMaster",
        supportLevel: 5,
        supportText: "Clan Patron"
    },
    {
        name: "Silent Blade",
        handle: "@StealthMaster",
        rank: "masterNinja",
        supportLevel: 4,
        supportText: "Elite Ally"
    },
    {
        name: "Kunoichi",
        handle: "@NightFlower",
        rank: "ninja",
        supportLevel: 3,
        supportText: "Honored Ally"
    },
    {
        name: "Blood Moon",
        handle: "@BloodMoonNinja",
        rank: "assassin",
        supportLevel: 2,
        supportText: "Loyal Ally"
    },
    {
        name: "Ghost Whisper",
        handle: "@GhostPath",
        rank: "shinobi",
        supportLevel: 1,
        supportText: "Clan Friend"
    }
    // To add new supporters, simply copy the format above and paste here
    // {
    //     name: "New Supporter Name",
    //     handle: "@handle",
    //     rank: "apprentice", // or "shinobi", "assassin", "ninja", "masterNinja", "grandMaster"
    //     supportLevel: 1, // 1-5 (apprentice to grandMaster)
    //     supportText: "Support level description"
    // }
];

// Rank order for sorting (highest first)
const rankOrder = {
    "grandMaster": 6,
    "masterNinja": 5,
    "ninja": 4,
    "assassin": 3,
    "shinobi": 2,
    "apprentice": 1
};

// Rank display names
const rankDisplayNames = {
    "grandMaster": "GRAND MASTER",
    "masterNinja": "MASTER NINJA",
    "ninja": "NINJA",
    "assassin": "ASSASSIN",
    "shinobi": "SHINOBI",
    "apprentice": "APPRENTICE"
};

function updateSupportersList() {
    const list = document.getElementById('supporters-list');
    if (!list) return;
    
    // Clear list
    list.innerHTML = '';
    
    // Sort supporters by rank (highest first)
    const sortedSupporters = [...supporters].sort((a, b) => {
        return rankOrder[b.rank] - rankOrder[a.rank];
    });
    
    // Add each supporter
    sortedSupporters.forEach(supporter => {
        const li = document.createElement('li');
        li.className = 'supporter-item';
        
        // Determine rank color class
        const rankClass = supporter.rank;
        const rankDisplay = rankDisplayNames[supporter.rank] || supporter.rank.toUpperCase();
        
        li.innerHTML = `
            <div class="supporter-header">
                <div class="supporter-name">${supporter.name}</div>
                <div class="supporter-rank-badge ${rankClass}">${rankDisplay}</div>
            </div>
            <div class="supporter-handle">${supporter.handle}</div>
            <div class="supporter-support">${supporter.supportText || 'Clan Ally'}</div>
        `;
        
        list.appendChild(li);
    });
    
    console.log(`Updated supporters list with ${sortedSupporters.length} supporters`);
}

function getSupporterAppreciation() {
    const messages = [
        "The shadows remember their allies.",
        "Your support strengthens the Azuma clan.",
        "Honor to those who stand with the Azuma.",
        "The clan thrives with allies like you.",
        "True allies walk in shadow with us."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Add supporter dynamically (for future use)
function addSupporter(name, handle, rank = "apprentice", supportLevel = 1, supportText = "New Ally") {
    const newSupporter = {
        name: name,
        handle: handle || `@${name.replace(/\s+/g, '')}`,
        rank: rank,
        supportLevel: supportLevel,
        supportText: supportText
    };
    
    supporters.push(newSupporter);
    
    // Re-sort and update
    updateSupportersList();
    
    console.log(`Added new supporter: ${name} (${rank})`);
    return true;
}

// Get random supporter for appreciation screen
function getRandomSupporter() {
    return supporters[Math.floor(Math.random() * supporters.length)];
}

// Get supporter by rank
function getSupportersByRank(rank) {
    return supporters.filter(s => s.rank === rank);
}

// Get top supporters (highest ranks)
function getTopSupporters(count = 3) {
    const sorted = [...supporters].sort((a, b) => {
        return rankOrder[b.rank] - rankOrder[a.rank];
    });
    return sorted.slice(0, count);
}

// Get rank color for a supporter
function getRankColor(rank) {
    const colors = {
        "grandMaster": "#d4af37",
        "masterNinja": "#c0c0c0",
        "ninja": "#4169e1",
        "assassin": "#dc143c",
        "shinobi": "#9370db",
        "apprentice": "#808080"
    };
    return colors[rank] || "#808080";
}

// Get rank info for display
function getRankInfo(rank) {
    const info = {
        "grandMaster": {
            name: "GRAND MASTER",
            color: "#d4af37",
            description: "最高位 - Supreme Clan Leader",
            minSupport: 5
        },
        "masterNinja": {
            name: "MASTER NINJA",
            color: "#c0c0c0",
            description: "上忍 - Elite Master",
            minSupport: 4
        },
        "ninja": {
            name: "NINJA",
            color: "#4169e1",
            description: "中忍 - Skilled Warrior",
            minSupport: 3
        },
        "assassin": {
            name: "ASSASSIN",
            color: "#dc143c",
            description: "殺し屋 - Silent Killer",
            minSupport: 2
        },
        "shinobi": {
            name: "SHINOBI",
            color: "#9370db",
            description: "忍び - Shadow Walker",
            minSupport: 1
        },
        "apprentice": {
            name: "APPRENTICE",
            color: "#808080",
            description: "見習い - Novice",
            minSupport: 0
        }
    };
    
    return info[rank] || info["apprentice"];
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(updateSupportersList, 100);
    });
    
    // Export functions for global access
    window.addSupporter = addSupporter;
    window.getRandomSupporter = getRandomSupporter;
    window.getSupportersByRank = getSupportersByRank;
    window.getTopSupporters = getTopSupporters;
    window.getRankColor = getRankColor;
    window.getRankInfo = getRankInfo;
    window.updateSupportersList = updateSupportersList;
    window.getSupporterAppreciation = getSupporterAppreciation;
}

console.log("Enhanced supporters system loaded");