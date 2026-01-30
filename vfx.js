// vfx.js - OPTIMIZED Visual Effects for Tenchu Shiren
// Enhanced for better performance on mobile and PC

let vfxCanvas, vfxCtx;
let particles = [];
let bloodSplatters = [];
let isVFXActive = false;
let animationFrameId = null;
let lastFrameTime = 0;
const frameRate = 60;
const frameInterval = 1000 / frameRate;

// Performance settings based on device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const particleLimit = isMobile ? 80 : 150; // Reduced on mobile
const bloodLimit = isMobile ? 3 : 8;

// Initialize VFX system
function initVFX() {
    console.log("Initializing OPTIMIZED VFX system...");
    
    // Create canvas if it doesn't exist
    if (!document.getElementById('vfx-canvas')) {
        vfxCanvas = document.createElement('canvas');
        vfxCanvas.id = 'vfx-canvas';
        vfxCanvas.style.position = 'fixed';
        vfxCanvas.style.top = '0';
        vfxCanvas.style.left = '0';
        vfxCanvas.style.width = '100%';
        vfxCanvas.style.height = '100%';
        vfxCanvas.style.pointerEvents = 'none';
        vfxCanvas.style.zIndex = '1';
        
        // Optimize for mobile
        if (isMobile) {
            vfxCanvas.style.display = 'none'; // Hide on mobile by default
        }
        
        document.body.appendChild(vfxCanvas);
    } else {
        vfxCanvas = document.getElementById('vfx-canvas');
    }
    
    vfxCtx = vfxCanvas.getContext('2d', { alpha: true });
    resizeCanvas();
    
    // Start animation loop with frame limiting
    isVFXActive = true;
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(animateVFX);
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Create minimal background particles
    createBackgroundParticles(isMobile ? 15 : 30);
    
    console.log("Optimized VFX system initialized");
    console.log(`Device: ${isMobile ? 'Mobile' : 'Desktop'}, Particle Limit: ${particleLimit}`);
}

// Resize canvas to match window (optimized)
function resizeCanvas() {
    if (!vfxCanvas) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Only resize if dimensions changed significantly
    if (Math.abs(vfxCanvas.width - width) > 50 || Math.abs(vfxCanvas.height - height) > 50) {
        vfxCanvas.width = width;
        vfxCanvas.height = height;
        console.log(`Canvas resized to ${width}x${height}`);
    }
}

// Optimized animation loop with frame limiting
function animateVFX(currentTime) {
    if (!isVFXActive || !vfxCtx) {
        cancelAnimationFrame(animationFrameId);
        return;
    }
    
    // Frame limiting for performance
    const deltaTime = currentTime - lastFrameTime;
    
    if (deltaTime > frameInterval) {
        // Clear canvas efficiently
        vfxCtx.clearRect(0, 0, vfxCanvas.width, vfxCanvas.height);
        
        // Update and draw particles
        updateParticles();
        
        // Update and draw blood splatters
        updateBloodSplatters();
        
        lastFrameTime = currentTime - (deltaTime % frameInterval);
    }
    
    animationFrameId = requestAnimationFrame(animateVFX);
}

// ==================== OPTIMIZED PARTICLE SYSTEM ====================

class Particle {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = Math.random() * 2 + 1; // Smaller on average
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.5 - 0.75;
        this.color = this.getColor();
        this.life = 1;
        this.decay = 0.01 + Math.random() * 0.01; // Faster decay
        this.angle = 0;
        this.rotation = Math.random() * 0.01 - 0.005;
        this.lastUpdate = performance.now();
    }
    
    getColor() {
        switch(this.type) {
            case 'blood':
                return `rgba(139, 0, 0, ${0.4 + Math.random() * 0.3})`;
            case 'gold':
                return `rgba(212, 175, 55, ${0.3 + Math.random() * 0.3})`;
            case 'smoke':
                return `rgba(136, 136, 136, ${0.15 + Math.random() * 0.15})`;
            default:
                return Math.random() > 0.5 
                    ? 'rgba(139, 0, 0, 0.5)' 
                    : 'rgba(212, 175, 55, 0.5)';
        }
    }
    
    update() {
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastUpdate, 32) / 16;
        
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
        this.angle += this.rotation * deltaTime;
        this.life -= this.decay * deltaTime;
        this.size *= 0.995;
        
        this.lastUpdate = currentTime;
    }
    
    draw() {
        if (this.life <= 0) return false;
        
        vfxCtx.save();
        vfxCtx.globalAlpha = this.life;
        vfxCtx.fillStyle = this.color;
        vfxCtx.translate(this.x, this.y);
        vfxCtx.rotate(this.angle);
        
        // Use circles for better performance
        vfxCtx.beginPath();
        vfxCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        vfxCtx.fill();
        
        vfxCtx.restore();
        return true;
    }
}

// ==================== OPTIMIZED BLOOD SPLATTER ====================

class BloodSplatter {
    constructor(x, y, intensity = 1) {
        this.x = x;
        this.y = y;
        this.intensity = Math.min(intensity, 1);
        this.life = 1;
        this.decay = 0.004;
        this.radius = 25 * this.intensity;
        this.created = performance.now();
        
        // Simplified droplets for performance
        this.droplets = this.createDroplets();
    }
    
    createDroplets() {
        const count = isMobile ? 5 : 10;
        const droplets = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius;
            
            droplets.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                size: 1 + Math.random() * 3 * this.intensity,
                life: 0.8 + Math.random() * 0.2
            });
        }
        
        return droplets;
    }
    
    update() {
        this.life -= this.decay;
        
        // Update droplets
        for (let droplet of this.droplets) {
            droplet.y += 0.4; // Simple gravity
            droplet.life -= 0.003;
        }
        
        return this.life > 0;
    }
    
    draw() {
        if (this.life <= 0) return false;
        
        vfxCtx.save();
        vfxCtx.globalAlpha = this.life * 0.5;
        
        // Draw main splatter
        vfxCtx.fillStyle = 'rgba(139, 0, 0, 0.25)';
        vfxCtx.beginPath();
        vfxCtx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        vfxCtx.fill();
        
        // Draw droplets
        for (let droplet of this.droplets) {
            if (droplet.life > 0) {
                vfxCtx.globalAlpha = droplet.life * this.life * 0.3;
                vfxCtx.fillStyle = 'rgba(139, 0, 0, 0.5)';
                vfxCtx.beginPath();
                vfxCtx.arc(droplet.x, droplet.y, droplet.size, 0, Math.PI * 2);
                vfxCtx.fill();
            }
        }
        
        vfxCtx.restore();
        return true;
    }
}

// ==================== OPTIMIZED PARTICLE MANAGEMENT ====================

function createBackgroundParticles(count) {
    const targetCount = Math.min(count, particleLimit / 2);
    
    for (let i = 0; i < targetCount; i++) {
        particles.push(new Particle(
            Math.random() * vfxCanvas.width,
            Math.random() * vfxCanvas.height,
            Math.random() > 0.8 ? 'blood' : (Math.random() > 0.6 ? 'gold' : 'smoke')
        ));
    }
}

function updateParticles() {
    let i = particles.length;
    
    while (i--) {
        particles[i].update();
        
        if (!particles[i].draw() || particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Add new background particles occasionally (less frequent)
    if (particles.length < particleLimit / 3 && Math.random() < 0.03) {
        particles.push(new Particle(
            Math.random() * vfxCanvas.width,
            vfxCanvas.height + 10,
            Math.random() > 0.7 ? 'blood' : 'smoke'
        ));
    }
}

function updateBloodSplatters() {
    let i = bloodSplatters.length;
    
    while (i--) {
        if (!bloodSplatters[i].update() || !bloodSplatters[i].draw()) {
            bloodSplatters.splice(i, 1);
        }
    }
}

// ==================== OPTIMIZED EFFECTS ====================

function createParticleBurst(x, y, count = 15, type = 'normal') {
    if (!isVFXActive) return;
    
    const actualCount = Math.min(count, particleLimit - particles.length);
    
    for (let i = 0; i < actualCount; i++) {
        particles.push(new Particle(x, y, type));
    }
}

function createBloodSplatter(x, y, intensity = 1) {
    if (!isVFXActive || bloodSplatters.length >= bloodLimit) return;
    
    bloodSplatters.push(new BloodSplatter(x, y, intensity));
    
    // Add minimal particles
    createParticleBurst(x, y, 5, 'blood');
}

function createSlashEffect(x1, y1, x2, y2, color = '#ff0000') {
    if (!isVFXActive) return;
    
    const slash = {
        x1, y1, x2, y2,
        color: color,
        life: 1,
        decay: 0.07, // Faster decay
        width: 2 // Thinner
    };
    
    function animateSlash() {
        if (slash.life <= 0 || !vfxCtx) return;
        
        vfxCtx.save();
        vfxCtx.globalAlpha = slash.life * 0.4;
        vfxCtx.strokeStyle = slash.color;
        vfxCtx.lineWidth = slash.width;
        vfxCtx.lineCap = 'round';
        
        vfxCtx.beginPath();
        vfxCtx.moveTo(slash.x1, slash.y1);
        vfxCtx.lineTo(slash.x2, slash.y2);
        vfxCtx.stroke();
        
        vfxCtx.restore();
        
        slash.life -= slash.decay;
        
        if (slash.life > 0) {
            requestAnimationFrame(animateSlash);
        }
    }
    
    animateSlash();
    
    // Minimal particles
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = slash.x1 + (slash.x2 - slash.x1) * t;
        const y = slash.y1 + (slash.y2 - slash.y1) * t;
        createParticleBurst(x, y, 1, 'blood');
    }
}

// ==================== OPTIMIZED SCREEN TRANSITIONS ====================

function createScreenTransition(type) {
    if (!isVFXActive) return;
    
    switch(type) {
        case 'bloodWave':
            createBloodWave();
            break;
        case 'smokeScreen':
            createSmokeScreen();
            break;
        case 'goldFlash':
            createGoldFlash();
            break;
    }
}

function createBloodWave() {
    const wave = {
        y: -40,
        height: 60,
        speed: 12,
        life: 1
    };
    
    function animateWave() {
        if (wave.y > vfxCanvas.height + wave.height || !vfxCtx) return;
        
        vfxCtx.save();
        vfxCtx.globalAlpha = 0.15;
        
        // Simple rectangle
        vfxCtx.fillStyle = '#8b0000';
        vfxCtx.fillRect(0, wave.y, vfxCanvas.width, wave.height);
        
        vfxCtx.restore();
        
        wave.y += wave.speed;
        requestAnimationFrame(animateWave);
    }
    
    animateWave();
}

function createSmokeScreen() {
    for (let i = 0; i < (isMobile ? 20 : 40); i++) {
        particles.push(new Particle(
            Math.random() * vfxCanvas.width,
            vfxCanvas.height + 10,
            'smoke'
        ));
    }
}

function createGoldFlash() {
    let life = 1;
    const decay = 0.1;
    
    function animateFlash() {
        if (life <= 0 || !vfxCtx) return;
        
        vfxCtx.save();
        vfxCtx.globalAlpha = life * 0.15;
        vfxCtx.fillStyle = '#d4af37';
        vfxCtx.fillRect(0, 0, vfxCanvas.width, vfxCanvas.height);
        vfxCtx.restore();
        
        life -= decay;
        
        if (life > 0) {
            requestAnimationFrame(animateFlash);
        }
    }
    
    animateFlash();
    createParticleBurst(vfxCanvas.width/2, vfxCanvas.height/2, 20, 'gold');
}

// ==================== OPTIMIZED FLOATING KANJI (DESKTOP ONLY) ====================

function createFloatingKanji() {
    if (isMobile) return; // Disable on mobile for performance
    
    const kanji = ['忍', '殺', '影', '刀', '血'];
    const kanjiElement = document.createElement('div');
    kanjiElement.className = 'floating-kanji';
    kanjiElement.textContent = kanji[Math.floor(Math.random() * kanji.length)];
    
    // Simple styling
    kanjiElement.style.cssText = `
        position: fixed;
        color: rgba(139, 0, 0, 0.15);
        font-size: ${25 + Math.random() * 30}px;
        font-family: 'Noto Sans JP', sans-serif;
        pointer-events: none;
        z-index: 0;
        animation: floatKanji ${8 + Math.random() * 8}s linear forwards;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
    `;
    
    document.body.appendChild(kanjiElement);
    
    // Remove after animation
    setTimeout(() => {
        if (kanjiElement.parentNode) {
            kanjiElement.parentNode.removeChild(kanjiElement);
        }
    }, 12000);
}

function createKanjiStorm(count = 4) {
    if (isMobile) return; // Disable on mobile
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => createFloatingKanji(), i * 400);
    }
}

// ==================== OPTIMIZED GAME VFX ====================

function createGameVFX(event, data = {}) {
    // Enable canvas if it was hidden (for mobile)
    if (isMobile && vfxCanvas && vfxCanvas.style.display === 'none') {
        vfxCanvas.style.display = 'block';
        
        // Auto-hide after effects complete
        setTimeout(() => {
            if (vfxCanvas) {
                vfxCanvas.style.display = 'none';
            }
        }, 3000);
    }
    
    switch(event) {
        case 'correct':
            createSlashEffect(
                vfxCanvas.width * 0.2, vfxCanvas.height * 0.2,
                vfxCanvas.width * 0.8, vfxCanvas.height * 0.8,
                '#00aa00'
            );
            createParticleBurst(vfxCanvas.width/2, vfxCanvas.height/2, 10, 'gold');
            break;
            
        case 'incorrect':
            createSlashEffect(
                vfxCanvas.width * 0.8, vfxCanvas.height * 0.2,
                vfxCanvas.width * 0.2, vfxCanvas.height * 0.8,
                '#aa0000'
            );
            createBloodSplatter(vfxCanvas.width/2, vfxCanvas.height/2, 0.2);
            break;
            
        case 'screenChange':
            createScreenTransition('bloodWave');
            break;
            
        case 'menuOpen':
            if (!isMobile) createKanjiStorm(2);
            createGoldFlash();
            break;
            
        case 'gameStart':
            createScreenTransition('smokeScreen');
            if (!isMobile) setTimeout(() => createKanjiStorm(1), 200);
            break;
            
        case 'victory':
            for (let i = 0; i < 2; i++) {
                setTimeout(() => {
                    createSlashEffect(
                        Math.random() * vfxCanvas.width * 0.8,
                        Math.random() * vfxCanvas.height * 0.8,
                        Math.random() * vfxCanvas.width * 0.8,
                        Math.random() * vfxCanvas.height * 0.8,
                        '#d4af37'
                    );
                }, i * 400);
            }
            createParticleBurst(vfxCanvas.width/2, vfxCanvas.height/2, 30, 'gold');
            break;
            
        case 'defeat':
            createBloodSplatter(vfxCanvas.width/2, vfxCanvas.height/2, 0.4);
            for (let i = 0; i < 1; i++) {
                setTimeout(() => {
                    createBloodSplatter(
                        Math.random() * vfxCanvas.width,
                        Math.random() * vfxCanvas.height,
                        0.15
                    );
                }, i * 500);
            }
            break;
            
        case 'appreciation':
            createGoldFlash();
            if (!isMobile) createKanjiStorm(3);
            createParticleBurst(vfxCanvas.width/2, vfxCanvas.height/2, 20, 'gold');
            break;
            
        default:
            // Minimal effect for unknown events
            createParticleBurst(vfxCanvas.width/2, vfxCanvas.height/2, 8, 'normal');
    }
}

// ==================== CLEANUP AND MEMORY MANAGEMENT ====================

function cleanupVFX() {
    isVFXActive = false;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    particles = [];
    bloodSplatters = [];
    
    // Clear canvas
    if (vfxCtx) {
        vfxCtx.clearRect(0, 0, vfxCanvas.width, vfxCanvas.height);
    }
    
    console.log("VFX system cleaned up");
}

// ==================== PERFORMANCE MONITORING ====================

function getVFXPerformance() {
    return {
        active: isVFXActive,
        particles: particles.length,
        bloodSplatters: bloodSplatters.length,
        isMobile: isMobile,
        limits: {
            particles: particleLimit,
            blood: bloodLimit
        }
    };
}

// ==================== EXPORT FUNCTIONS ====================

window.initVFX = initVFX;
window.createGameVFX = createGameVFX;
window.createBloodSplatter = createBloodSplatter;
window.createSlashEffect = createSlashEffect;
window.createParticleBurst = createParticleBurst;
window.createKanjiStorm = createKanjiStorm;
window.cleanupVFX = cleanupVFX;
window.getVFXPerformance = getVFXPerformance;

// Add CSS for floating kanji if not present
if (!document.querySelector('#kanji-animation')) {
    const style = document.createElement('style');
    style.id = 'kanji-animation';
    style.textContent = `
        @keyframes floatKanji {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.15;
            }
            90% {
                opacity: 0.15;
            }
            100% {
                transform: translateY(-100px) rotate(180deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log("Optimized VFX system loaded");