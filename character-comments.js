// character-comments.js - For final results feedback only

const characterPortraits = {
    rikimaru: "assets/characters/rikimaru.png",
    ayame: "assets/characters/ayame.png",
    tatsumaru: "assets/characters/tatsumaru.png"
};

const characterNames = {
    rikimaru: "RIKIMARU",
    ayame: "AYAME",
    tatsumaru: "TATSAMARU"
};

// Character result feedback arrays - Matching Tenchu Shiren ranks
const characterResultFeedback = {
    rikimaru: {
        grandMaster: [
            "${playerName}. Perfection. You move as shadow itself.",
            "${playerName}. The Azuma way flows through you completely.",
            "${playerName}. Flawless execution. You are the night.",
            "天誅忍。 Ghost in the darkness, ${playerName}.",
            "${playerName}. Your discipline is absolute. The true way."
        ],
        masterNinja: [
            "${playerName}. Your skill honors the clan.",
            "${playerName}. Exceptional precision. Continue your path.",
            "${playerName}. You understand the shadow warrior's way.",
            "上忍。 The blade sings in your hand, ${playerName}.",
            "Your technique is worthy of the scrolls, ${playerName}."
        ],
        ninja: [
            "${playerName}. Competent. Reliable work.",
            "You understand the basics, ${playerName}. Now master them.",
            "Acceptable performance, ${playerName}. Focus on breathing.",
            "中忍。 Solid execution. Sharpen your senses.",
            "${playerName}. A capable operative. Seek greater challenges."
        ],
        assassin: [
            "${playerName}. You get the job done. Efficiency matters.",
            "Competent but unrefined, ${playerName}.",
            "${playerName}. Focus on cleaner executions.",
            "殺し屋。 You eliminate targets, but leave traces.",
            "${playerName}. Functional, not flawless."
        ],
        shinobi: [
            "${playerName}. You learn, but slowly.",
            "Capable infiltration, ${playerName}. Work on stealth.",
            "You understand concealment, ${playerName}. Master movement.",
            "忍び。 The path is long, ${playerName}.",
            "${playerName}. Basic skills present. Much to learn."
        ],
        apprentice: [
            "${playerName}. Beginner steps. The way is difficult.",
            "Too many mistakes, ${playerName}. Return to training.",
            "The shadows test you, ${playerName}. Do not lose heart.",
            "見習い。 Patience, ${playerName}. Precision comes with time.",
            "${playerName}. You must learn to be unseen."
        ],
        failed: [
            "Pathetic. You disgrace the Azuma name, ${playerName}.",
            "A failure of technique and spirit, ${playerName}.",
            "${playerName}. The shadows reject you.",
            "失敗。 You are not worthy of being called ninja.",
            "Try again, ${playerName}. Or do not."
        ]
    },
    ayame: {
        grandMaster: [
            "${playerName}! Magnificent! A true kunoichi!",
            "${playerName}! You dance with shadows! Brilliant!",
            "${playerName}! The flowers bloom where you walk!",
            "天誅忍！ Lady Ayame herself would applaud, ${playerName}!",
            "Absolutely brilliant! Your intuition is unmatched, ${playerName}!"
        ],
        masterNinja: [
            "Beautiful technique, ${playerName}! Exceptional!",
            "Your movements are like poetry, ${playerName}!",
            "Well done, ${playerName}! You honor the kunoichi way!",
            "上忍！ Precision and grace combined, ${playerName}!",
            "${playerName}! Your cleverness serves you well!"
        ],
        ninja: [
            "Good work, ${playerName}! Solid performance!",
            "You have the foundation, ${playerName}. Add the flair!",
            "A respectable effort, ${playerName}! Smile more!",
            "中忍。 You move well! Remember to breathe!",
            "Not bad, ${playerName}! Your form is improving!"
        ],
        assassin: [
            "Efficient, ${playerName}! But where's the elegance?",
            "You eliminate targets well, ${playerName}!",
            "殺し屋。 Functional, ${playerName}. Could be prettier!",
            "Good elimination, ${playerName}! Next time, with style!",
            "You get results, ${playerName}! Now get them gracefully!"
        ],
        shinobi: [
            "Oh dear, ${playerName}. Basic skills need work.",
            "You're trying, ${playerName}! That's something!",
            "忍び。 So much to learn, ${playerName}!",
            "${playerName}, your footwork needs attention.",
            "A kunoichi must be light, ${playerName}. Practice!"
        ],
        apprentice: [
            "My, my, ${playerName}. Back to basics!",
            "Beginner mistakes, ${playerName}. Everyone starts somewhere!",
            "見習い。 The first steps are the hardest, ${playerName}!",
            "${playerName}, watch your posture!",
            "So earnest, ${playerName}! That's a good start!"
        ],
        failed: [
            "This is... disappointing, ${playerName}.",
            "Even a beginner should do better, ${playerName}.",
            "I have no words, ${playerName}. Truly none.",
            "失敗。 Perhaps ninja arts are not for you, ${playerName}.",
            "${playerName}, this performance brings tears to my eyes."
        ]
    },
    tatsumaru: {
        grandMaster: [
            "Hmph. ${playerName}. True power.",
            "${playerName}. You could rule the shadows.",
            "${playerName}. Finally, someone who understands.",
            "天誅忍。 Strength absolute, ${playerName}.",
            "${playerName}. You see that might makes right."
        ],
        masterNinja: [
            "Strong. But you could be stronger, ${playerName}.",
            "${playerName}. You wield power well. Seek more.",
            "Impressive force, ${playerName}. Channel your rage.",
            "上忍。 Your will is iron. Make it steel, ${playerName}.",
            "${playerName}. You understand that mercy is weakness."
        ],
        ninja: [
            "Adequate strength, ${playerName}. Nothing more.",
            "You hold back, ${playerName}. Why?",
            "中忍。 Functional technique, ${playerName}.",
            "Potential for darkness, ${playerName}. Embrace it.",
            "You fight with honor, ${playerName}. A useless concept."
        ],
        assassin: [
            "You kill efficiently, ${playerName}. Good.",
            "殺し屋。 No wasted motion. Acceptable.",
            "${playerName}. Your work is clean. Emotionless.",
            "The weak fall before you, ${playerName}. As they should.",
            "Elimination without hesitation, ${playerName}."
        ],
        shinobi: [
            "Weak. Pathetic, ${playerName}.",
            "You lack conviction, ${playerName}.",
            "忍び。 Your strikes have no heart. No hate.",
            "Is that all your strength, ${playerName}?",
            "You fight like someone with something to lose, ${playerName}."
        ],
        apprentice: [
            "You're not a ninja. You're a noise, ${playerName}.",
            "見習い。 Even in failure, you're unimpressive.",
            "Your weakness is an insult, ${playerName}.",
            "${playerName}. You move like a wounded animal.",
            "I've seen peasants fight with more spirit, ${playerName}."
        ],
        failed: [
            "Worthless. Less than nothing, ${playerName}.",
            "You deserve whatever fate finds you, ${playerName}.",
            "Die quietly next time, ${playerName}. At least be useful.",
            "失敗。 You are proof that weakness must be purged.",
            "A stain on the very concept of combat, ${playerName}."
        ]
    }
};

function getCharacterPortrait(character) {
    return characterPortraits[character] || characterPortraits.rikimaru;
}

function getCharacterDisplayName(character) {
    return characterNames[character] || "MASTER";
}

// Function to get random result feedback
function getCharacterResultFeedback(character, rank, playerName) {
    // Convert rank to match our keys (remove spaces, capitalize properly)
    const rankKey = rank.toLowerCase()
        .split(' ')
        .map((word, index) => 
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
    
    if (!characterResultFeedback[character] || !characterResultFeedback[character][rankKey]) {
        return "The trial ends here.";
    }
    
    const feedbacks = characterResultFeedback[character][rankKey];
    const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
    
    return randomFeedback.replace("${playerName}", playerName);
}

// Helper function to get all available ranks
function getAvailableRanks() {
    return ['grandMaster', 'masterNinja', 'ninja', 'assassin', 'shinobi', 'apprentice', 'failed'];
}

// Export functions
window.getCharacterPortrait = getCharacterPortrait;
window.getCharacterDisplayName = getCharacterDisplayName;
window.getCharacterResultFeedback = getCharacterResultFeedback;
window.getAvailableRanks = getAvailableRanks;