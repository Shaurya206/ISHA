/**
 * Cosmic Particle Heart Animation
 * Uses HTML5 Canvas and vanilla JavaScript.
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uiText = document.querySelector('.instruction');

// Handle high-DPI displays
let width, height;
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARTICLE_COUNT = prefersReducedMotion ? 60 : 150;

// Colors for the glowing effect
const COLORS = ['#ff6b81', '#ff4757', '#e84393', '#fd79a8', '#ffffff'];

// Math helper for the heart shape
function getHeartPoint(t, scale) {
    // Parametric equations for a heart
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
}

// Particle System Arrays
let particles = [];
let ripples = [];
let stars = [];

// Pointer tracking for custom cursor
let pointer = { x: width / 2, y: height / 2, active: false };

// --- Classes ---

class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5;
        this.alpha = Math.random();
        this.speed = Math.random() * 0.2 + 0.1;
    }
    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.y = height;
            this.x = Math.random() * width;
        }
    }
    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.alpha = 0.8;
    }
    update() {
        this.radius += 3;
        this.alpha -= 0.03;
    }
    draw(ctx) {
        ctx.strokeStyle = `rgba(255, 107, 129, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Particle {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        
        // Random angle for initial burst
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 8 + 2;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        
        // Assign target position forming a heart
        const t = Math.random() * Math.PI * 2;
        const scale = Math.random() * 0.5 + 4; // Heart size variation
        const targetOffset = getHeartPoint(t, scale);
        this.targetX = startX + targetOffset.x;
        this.targetY = startY + targetOffset.y;
        
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.size = Math.random() * 2 + 1;
        this.alpha = 1;
        
        // State management: 0 = burst, 1 = gather, 2 = dissolve
        this.state = 0;
        this.timer = 0;
        
        // Timings (randomized for natural feel)
        this.burstDuration = Math.random() * 20 + 20;
        this.gatherDuration = Math.random() * 60 + 100;
    }
    
    update() {
        this.timer++;
        
        if (this.state === 0) {
            // Burst phase: explode outward with friction
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.92;
            this.vy *= 0.92;
            
            if (this.timer > this.burstDuration) {
                this.state = 1; // Transition to gather
                this.timer = 0;
            }
        } else if (this.state === 1) {
            // Gather phase: ease towards the target heart shape position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            this.x += dx * 0.05;
            this.y += dy * 0.05;
            
            // Add subtle floating motion
            this.y += Math.sin(this.timer * 0.1) * 0.5;
            
            if (this.timer > this.gatherDuration) {
                this.state = 2; // Transition to dissolve
                // Assign upward drift
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = Math.random() * -2 - 1;
            }
        } else if (this.state === 2) {
            // Dissolve phase: drift and fade away
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.015;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Initialization & Loop ---

// Create initial background stars
for (let i = 0; i < 100; i++) {
    stars.push(new Star());
}

function createHeartInteraction(x, y) {
    // Hide text after first click
    if (uiText.style.opacity !== '0') {
        uiText.style.opacity = '0';
    }

    // Add ripple
    ripples.push(new Ripple(x, y));
    
    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y));
    }
    
    // Brief screen flash effect via global composite
    ctx.fillStyle = 'rgba(255, 107, 129, 0.2)';
    ctx.fillRect(0, 0, width, height);
}

function animate() {
    // Clear canvas with a trailing effect for smooth motion
    ctx.fillStyle = 'rgba(26, 11, 46, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw background stars
    stars.forEach(star => {
        star.update();
        star.draw(ctx);
    });
    
    // Draw ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw(ctx);
        if (ripples[i].alpha <= 0) {
            ripples.splice(i, 1);
        }
    }
    
    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1); // Clean up memory
        }
    }
    
    // Draw custom cursor (small trailing heart)
    if (pointer.active && !prefersReducedMotion) {
        ctx.save();
        ctx.translate(pointer.x, pointer.y);
        ctx.fillStyle = 'rgba(255, 107, 129, 0.8)';
        ctx.shadowColor = '#ff6b81';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        // Draw a tiny heart as the cursor
        for (let t = 0; t < Math.PI * 2; t += 0.1) {
            const pt = getHeartPoint(t, 0.4);
            if (t === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.fill();
        ctx.restore();
    }
    
    requestAnimationFrame(animate);
}

// --- Event Listeners ---

window.addEventListener('mousedown', (e) => {
    pointer.active = true;
    createHeartInteraction(e.clientX, e.clientY);
});

window.addEventListener('touchstart', (e) => {
    pointer.active = false; // Disable custom cursor on touch
    for (let i = 0; i < e.touches.length; i++) {
        createHeartInteraction(e.touches[i].clientX, e.touches[i].clientY);
    }
}, { passive: false });

window.addEventListener('mousemove', (e) => {
    pointer.active = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
});

// Start animation loop
animate();
