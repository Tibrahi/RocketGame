// --- Three.js Background & Visual System ---
let scene, camera, renderer, starMesh;

function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Starfield particle system
    const starCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for(let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 400;
        positions[i+1] = (Math.random() - 0.5) * 400;
        positions[i+2] = (Math.random() - 0.5) * 400 - 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x818cf8,
        size: 1.2,
        transparent: true,
        opacity: 0.8
    });

    starMesh = new THREE.Points(geometry, material);
    scene.add(starMesh);
    camera.position.z = 50;

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThreeJS(speedMultiplier) {
    if (starMesh) {
        const positions = starMesh.geometry.attributes.position.array;
        for(let i = 2; i < positions.length; i += 3) {
            positions[i] += 0.5 * speedMultiplier;
            if (positions[i] > 50) {
                positions[i] = -350;
            }
        }
        starMesh.geometry.attributes.position.needsUpdate = true;
        starMesh.rotation.z += 0.0005 * speedMultiplier;
    }
    renderer.render(scene, camera);
}

// --- Game Engine Class ---
class AeroStrikeGame {
    constructor() {
        this.playerData = { callsign: 'Maverick', rank: 'Squadron Leader' };
        this.score = 0;
        this.highScore = localStorage.getItem('aerostrike_highscore') || 0;
        this.lastScore = localStorage.getItem('aerostrike_lastscore') || 0;
        this.speed = 1;         // User managed speed between 1 and 24
        this.maxSpeed = 24;
        this.isGameRunning = false;
        this.isBoosting = false;
        this.keys = {};
        this.obstacles = [];
        this.projectiles = [];
        this.gameStartTime = 0;
        this.timerInterval = null;

        // DOM Elements
        this.dom = {
            modal: document.getElementById('player-modal'),
            form: document.getElementById('player-form'),
            callsignInput: document.getElementById('player-callsign'),
            rankSelect: document.getElementById('player-rank'),
            wrapper: document.getElementById('game-wrapper'),
            displayCallsign: document.getElementById('display-callsign'),
            score: document.getElementById('score'),
            timer: document.getElementById('timer'),
            shieldStatus: document.getElementById('shield-status'),
            speedVal: document.getElementById('speed-val'),
            speedFill: document.getElementById('speed-fill'),
            boostStatus: document.getElementById('boost-status'),
            lastScore: document.getElementById('last-score'),
            highScore: document.getElementById('high-score'),
            gameArea: document.getElementById('game-area'),
            player: document.getElementById('player'),
            afterburner: document.getElementById('afterburner'),
            startOverlay: document.getElementById('start-overlay'),
            startBtn: document.getElementById('start-btn'),
            gameOverScreen: document.getElementById('game-over-screen'),
            finalScore: document.getElementById('final-score'),
            retryBtn: document.getElementById('retry-btn'),
            leftBtn: document.getElementById('left-btn'),
            rightBtn: document.getElementById('right-btn'),
            upBtn: document.getElementById('up-btn'),
            downBtn: document.getElementById('down-btn'),
            fireBtn: document.getElementById('fire-btn'),
            boostBtn: document.getElementById('boost-btn')
        };

        this.initUI();
    }

    initUI() {
        this.dom.lastScore.textContent = `${this.lastScore} PTS`;
        this.dom.highScore.textContent = `${this.highScore} PTS`;

        // Handle Player Profile Question Submission
        this.dom.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const callsign = this.dom.callsignInput.value.trim();
            if (callsign) {
                this.playerData.callsign = callsign;
                this.playerData.rank = this.dom.rankSelect.value;
                this.dom.displayCallsign.textContent = `${this.playerData.callsign} [${this.playerData.rank}]`;
                
                // Transition UI smoothly
                this.dom.modal.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                setTimeout(() => {
                    this.dom.modal.style.display = 'none';
                    this.dom.wrapper.classList.remove('opacity-0', 'pointer-events-none');
                }, 400);
            }
        });

        // Game Control Buttons
        this.dom.startBtn.addEventListener('click', () => this.startGame());
        this.dom.retryBtn.addEventListener('click', () => this.startGame());

        // Keyboard Listeners
        window.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;
            this.keys[e.key] = true;
            if (e.key === 'Shift') this.isBoosting = true;
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.fireProjectile();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (e.key === 'Shift') this.isBoosting = false;
        });

        // On-screen / Mobile Controls Bindings
        this.dom.leftBtn.addEventListener('mousedown', () => this.keys['ArrowLeft'] = true);
        this.dom.leftBtn.addEventListener('mouseup', () => this.keys['ArrowLeft'] = false);
        this.dom.leftBtn.addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
        this.dom.leftBtn.addEventListener('touchend', () => this.keys['ArrowLeft'] = false);

        this.dom.rightBtn.addEventListener('mousedown', () => this.keys['ArrowRight'] = true);
        this.dom.rightBtn.addEventListener('mouseup', () => this.keys['ArrowRight'] = false);
        this.dom.rightBtn.addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
        this.dom.rightBtn.addEventListener('touchend', () => this.keys['ArrowRight'] = false);

        this.dom.upBtn.addEventListener('mousedown', () => this.keys['ArrowUp'] = true);
        this.dom.upBtn.addEventListener('mouseup', () => this.keys['ArrowUp'] = false);
        this.dom.upBtn.addEventListener('touchstart', () => this.keys['ArrowUp'] = true);
        this.dom.upBtn.addEventListener('touchend', () => this.keys['ArrowUp'] = false);

        this.dom.downBtn.addEventListener('mousedown', () => this.keys['ArrowDown'] = true);
        this.dom.downBtn.addEventListener('mouseup', () => this.keys['ArrowDown'] = false);
        this.dom.downBtn.addEventListener('touchstart', () => this.keys['ArrowDown'] = true);
        this.dom.downBtn.addEventListener('touchend', () => this.keys['ArrowDown'] = false);

        this.dom.fireBtn.addEventListener('click', () => {
            if (this.isGameRunning) this.fireProjectile();
        });

        this.dom.boostBtn.addEventListener('mousedown', () => this.isBoosting = true);
        this.dom.boostBtn.addEventListener('mouseup', () => this.isBoosting = false);
        this.dom.boostBtn.addEventListener('touchstart', () => this.isBoosting = true);
        this.dom.boostBtn.addEventListener('touchend', () => this.isBoosting = false);
    }

    startGame() {
        this.dom.startOverlay.classList.add('hidden');
        this.dom.gameOverScreen.classList.add('hidden');

        // Clear old elements
        this.obstacles.forEach(o => o.element.remove());
        this.projectiles.forEach(p => p.remove());
        this.obstacles = [];
        this.projectiles = [];

        this.score = 0;
        this.speed = 1; // Start strictly at speed 1, user managed
        this.isGameRunning = true;
        this.isBoosting = false;
        this.gameStartTime = Date.now();

        this.dom.score.textContent = '0';
        this.updateSpeedUI();

        // Reset Player position
        this.playerX = this.dom.gameArea.offsetWidth / 2;
        this.playerY = 30; // bottom offset px
        this.updatePlayerPosition();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);

        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    updateTimer() {
        if (!this.isGameRunning) return;
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        this.dom.timer.textContent = `${mins}:${secs}`;
    }

    handleInput() {
        const boostFactor = this.isBoosting ? 2.2 : 1.0;
        const moveStep = 7 * boostFactor;
        const areaWidth = this.dom.gameArea.offsetWidth;

        // Horizontal movement (Left / Right)
        if ((this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) && this.playerX > 35) {
            this.playerX -= moveStep;
            this.dom.player.style.transform = `translateX(-50%) rotate(-12deg)`;
        } else if ((this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) && this.playerX < areaWidth - 35) {
            this.playerX += moveStep;
            this.dom.player.style.transform = `translateX(-50%) rotate(12deg)`;
        } else {
            this.dom.player.style.transform = `translateX(-50%) rotate(0deg)`;
        }

        // Manual Speed / Altitude control (Up / Down controls speed or rising/falling)
        if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'])) {
            if (this.speed < this.maxSpeed) {
                this.speed += 0.15; // smooth manual speed increase
                if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
                this.updateSpeedUI();
            }
        }
        if ((this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'])) {
            if (this.speed > 1) {
                this.speed -= 0.2; // manual speed decrease
                if (this.speed < 1) this.speed = 1;
                this.updateSpeedUI();
            }
        }

        // Update visual position
        this.dom.player.style.left = `${this.playerX}px`;

        // Update Boost UI indicator & afterburner visual effect
        if (this.isBoosting) {
            this.dom.boostStatus.classList.remove('hidden');
            this.dom.afterburner.style.height = '3rem';
            this.dom.afterburner.style.opacity = '1';
        } else {
            this.dom.boostStatus.classList.add('hidden');
            this.dom.afterburner.style.height = '1.5rem';
            this.dom.afterburner.style.opacity = '0.7';
        }
    }

    updatePlayerPosition() {
        this.dom.player.style.left = `${this.playerX}px`;
        this.dom.player.style.bottom = `${this.playerY}px`;
    }

    updateSpeedUI() {
        const roundedSpeed = Math.round(this.speed);
        this.dom.speedVal.textContent = roundedSpeed;
        const percentage = (this.speed / this.maxSpeed) * 100;
        this.dom.speedFill.style.width = `${percentage}%`;
    }

    fireProjectile() {
        const proj = document.createElement('div');
        proj.className = 'absolute w-1.5 h-5 bg-rose-400 rounded-full shadow-[0_0_10px_#f43f5e] z-20';
        
        const playerRect = this.dom.player.getBoundingClientRect();
        const areaRect = this.dom.gameArea.getBoundingClientRect();

        const leftPos = (playerRect.left - areaRect.left) + (playerRect.width / 2) - 3;
        const bottomPos = areaRect.height - (playerRect.top - areaRect.top);

        proj.style.left = `${leftPos}px`;
        proj.style.bottom = `${bottomPos}px`;

        this.dom.gameArea.appendChild(proj);
        this.projectiles.push(proj);
    }

    spawnObstacle() {
        if (Math.random() < 0.02 + (this.speed * 0.001)) {
            const obs = document.createElement('div');
            const isBonusDrone = Math.random() < 0.35;
            
            obs.className = `absolute w-10 h-10 rounded-xl flex items-center justify-center font-orbitron text-xs font-bold shadow-lg transition-transform duration-300 ${
                isBonusDrone ? 'bg-amber-500/80 border border-amber-300 text-amber-950 glow-effect' : 'bg-rose-600/80 border border-rose-400 text-white glow-red'
            }`;
            obs.innerHTML = isBonusDrone ? '★' : '⚠️';

            const areaWidth = this.dom.gameArea.offsetWidth;
            const randomX = Math.random() * (areaWidth - 50) + 25;

            obs.style.left = `${randomX}px`;
            obs.style.top = `-50px`;

            this.dom.gameArea.appendChild(obs);
            this.obstacles.push({
                element: obs,
                x: randomX,
                y: -50,
                isBonus: isBonusDrone,
                speedMultiplier: Math.random() * 0.5 + 1
            });
        }
    }

    loop(timestamp) {
        if (!this.isGameRunning) return;

        const deltaTime = (timestamp - this.lastFrameTime) / 16.66;
        this.lastFrameTime = timestamp;

        this.handleInput();
        this.spawnObstacle();

        const currentSpeedFactor = (this.speed * 1.8) * (this.isBoosting ? 2.2 : 1.0);

        // Update Three.js Background Starfield animation speed
        animateThreeJS(this.speed * (this.isBoosting ? 2.5 : 1.0));

        // Move and check Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const currentBottom = parseFloat(p.style.bottom) || 0;
            const newBottom = currentBottom + (16 * deltaTime);
            
            if (newBottom > this.dom.gameArea.offsetHeight) {
                p.remove();
                this.projectiles.splice(i, 1);
            } else {
                p.style.bottom = `${newBottom}px`;

                const pRect = p.getBoundingClientRect();
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    const o = this.obstacles[j];
                    const oRect = o.element.getBoundingClientRect();

                    if (this.isColliding(pRect, oRect)) {
                        p.remove();
                        this.projectiles.splice(i, 1);

                        o.element.style.transform = 'scale(1.5) rotate(45deg)';
                        o.element.style.opacity = '0';
                        setTimeout(() => o.element.remove(), 200);
                        this.obstacles.splice(j, 1);

                        this.score += o.isBonus ? 50 : 20;
                        this.dom.score.textContent = this.score;
                        break;
                    }
                }
            }
        }

        // Move and check Obstacles
        const playerRect = this.dom.player.getBoundingClientRect();
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.y += currentSpeedFactor * o.speedMultiplier * deltaTime;
            o.element.style.top = `${o.y}px`;

            if (o.y > this.dom.gameArea.offsetHeight) {
                o.element.remove();
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.dom.score.textContent = this.score;
                continue;
            }

            const oRect = o.element.getBoundingClientRect();
            if (this.isColliding(playerRect, oRect)) {
                this.triggerCrashAnimation(o.element);
                return;
            }
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    isColliding(r1, r2) {
        const margin = 8;
        return !(
            r1.right - margin < r2.left + margin ||
            r1.left + margin > r2.right - margin ||
            r1.bottom - margin < r2.top + margin ||
            r1.top + margin > r2.bottom - margin
        );
    }

    triggerCrashAnimation(obstacleElement) {
        this.isGameRunning = false;
        clearInterval(this.timerInterval);

        this.dom.player.classList.add('scale-125', 'brightness-200', 'animate-ping');
        obstacleElement.classList.add('scale-150', 'brightness-200', 'rotate-45');

        setTimeout(() => {
            this.dom.player.classList.remove('scale-125', 'brightness-200', 'animate-ping');
            this.gameOver();
        }, 500);
    }

    gameOver() {
        this.isGameRunning = false;
        this.isBoosting = false;

        this.lastScore = this.score;
        localStorage.setItem('aerostrike_lastscore', this.lastScore);
        this.dom.lastScore.textContent = `${this.lastScore} PTS`;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('aerostrike_highscore', this.highScore);
            this.dom.highScore.textContent = `${this.highScore} PTS`;
        }

        this.dom.finalScore.textContent = this.score;
        this.dom.gameOverScreen.classList.remove('hidden');
    }
}

// Initialize ThreeJS and Game Engine on window load
window.addEventListener('load', () => {
    initThreeJS();
    window.gameInstance = new AeroStrikeGame();
});
