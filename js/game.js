class RacingGame {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.player = document.querySelector('.player');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.speedFill = document.querySelector('.speed-fill');
        this.startBtn = document.getElementById('startBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        this.upBtn = document.getElementById('upBtn');
        this.downBtn = document.getElementById('downBtn');
        
        this.score = 0;
        this.speed = 1;
        this.maxSpeed = 24;
        this.gameLoop = null;
        this.obstacles = [];
        this.projectiles = []; // Added for firing red projectiles
        this.obstaclesDodged = 0;
        this.isGameRunning = false;
        this.keys = {};
        this.isBoosting = false; // Tracks shift/boost state
        
        this.init();
    }
    
    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.leftBtn.addEventListener('click', () => this.moveLeft());
        this.rightBtn.addEventListener('click', () => this.moveRight());
        this.upBtn.addEventListener('click', () => this.moveUp());
        this.downBtn.addEventListener('click', () => this.moveDown());
        
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;
            this.keys[e.key] = true;
            
            // Activate boost on Shift key
            if (e.key === 'Shift') {
                this.isBoosting = true;
            }
            
            // Fire red projectile on Spacebar
            if (e.key === ' ' || e.key === 'Spacebar') {
                this.fireProjectile();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (e.key === 'Shift') {
                this.isBoosting = false;
            }
        });
    }
    
    handleInput() {
        const boostMultiplier = this.isBoosting ? 2.0 : 1.0;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.moveLeft(boostMultiplier);
        if (this.keys['ArrowRight'] || this.keys['d']) this.moveRight(boostMultiplier);
        if (this.keys['ArrowUp'] || this.keys['w']) this.moveUp(boostMultiplier);
        if (this.keys['ArrowDown'] || this.keys['s']) this.moveDown(boostMultiplier);
    }
    
    moveLeft(multiplier = 1.0) {
        const currentLeft = parseInt(window.getComputedStyle(this.player).left);
        const moveAmount = 10 * (this.speed / 3) * multiplier;
        if (currentLeft > 0) {
            this.player.style.left = (currentLeft - moveAmount) + 'px';
        }
    }
    
    moveRight(multiplier = 1.0) {
        const currentLeft = parseInt(window.getComputedStyle(this.player).left);
        const gameAreaWidth = this.gameArea.offsetWidth;
        const playerWidth = this.player.offsetWidth;
        const moveAmount = 10 * (this.speed / 3) * multiplier;
        
        if (currentLeft < gameAreaWidth - playerWidth) {
            this.player.style.left = (currentLeft + moveAmount) + 'px';
        }
    }
    
    moveUp(multiplier = 1.0) {
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom);
        const moveAmount = 10 * (this.speed / 3) * multiplier;
        const gameAreaHeight = this.gameArea.offsetHeight;
        const playerHeight = this.player.offsetHeight;
        
        if (currentBottom < gameAreaHeight - playerHeight) {
            this.player.style.bottom = (currentBottom + moveAmount) + 'px';
        }
    }
    
    moveDown(multiplier = 1.0) {
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom);
        const moveAmount = 10 * (this.speed / 3) * multiplier;
        
        if (currentBottom > 20) {
            this.player.style.bottom = (currentBottom - moveAmount) + 'px';
        }
    }

    fireProjectile() {
        const projectile = document.createElement('div');
        projectile.classList.add('projectile');
        // Style the firing projectile red as requested
        projectile.style.position = 'absolute';
        projectile.style.width = '6px';
        projectile.style.height = '14px';
        projectile.style.backgroundColor = 'red';
        projectile.style.borderRadius = '3px';
        projectile.style.boxShadow = '0 0 8px red';
        
        const playerLeft = parseInt(window.getComputedStyle(this.player).left);
        const playerBottom = parseInt(window.getComputedStyle(this.player).bottom);
        
        projectile.style.left = (playerLeft + (this.player.offsetWidth / 2) - 3) + 'px';
        projectile.style.bottom = (playerBottom + this.player.offsetHeight) + 'px';
        
        this.gameArea.appendChild(projectile);
        this.projectiles.push(projectile);
    }
    
    startGame() {
        if (this.isGameRunning) return;
        const gameOverMessage = document.querySelector('.game-over-message');
        gameOverMessage.style.display = 'none';
        this.isGameRunning = true;
        this.score = 0;
        this.speed = 1;
        this.scoreElement.textContent = this.score;
        this.updateSpeedIndicator();
        
        // Clean up previous elements
        this.obstacles.forEach(obs => obs.remove());
        this.projectiles.forEach(proj => proj.remove());
        this.obstacles = [];
        this.projectiles = [];
        this.obstaclesDodged = 0;
        this.startBtn.textContent = 'Restart Game';
        
        // Reset player position to bottom
        this.player.style.bottom = '20px';
        this.player.style.top = 'auto';
        this.player.style.left = '50%';
        this.player.style.transform = 'translateX(-50%)';
        
        this.gameLoop = setInterval(() => {
            this.update();
        }, 20);
    }
    
    update() {
        this.handleInput();
        this.moveObstacles();
        this.moveProjectiles();
        this.createObstacle();
        this.checkCollision();
    }
    
    createObstacle() {
        if (Math.random() < 0.02 * (this.speed / 3)) {
            const obstacle = document.createElement('div');
            obstacle.classList.add('obstacle');
            obstacle.style.left = Math.random() * (this.gameArea.offsetWidth - 40) + 'px';
            obstacle.style.top = '-40px';
            if (Math.random() < 0.5) {
                obstacle.style.background = 'red';
                obstacle.classList.add('red-obstacle');
            }
            this.gameArea.appendChild(obstacle);
            this.obstacles.push(obstacle);
        }
    }
    
    moveObstacles() {
        this.obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(window.getComputedStyle(obstacle).top);
            const moveAmount = this.speed * (this.isBoosting ? 2.5 : 2);
            obstacle.style.top = (currentTop + moveAmount) + 'px';
            
            if (currentTop > this.gameArea.offsetHeight) {
                if (obstacle.classList.contains('red-obstacle')) {
                    this.score++;
                    this.scoreElement.textContent = this.score;
                    if (this.speed < this.maxSpeed) {
                        this.speed++;
                        this.updateSpeedIndicator();
                    }
                }
                obstacle.remove();
                this.obstacles.splice(index, 1);
            }
        });
    }

    moveProjectiles() {
        this.projectiles.forEach((projectile, pIndex) => {
            const currentBottom = parseInt(window.getComputedStyle(projectile).bottom);
            projectile.style.bottom = (currentBottom + 16) + 'px';

            // Check collision with obstacles
            const projRect = projectile.getBoundingClientRect();
            this.obstacles.forEach((obstacle, oIndex) => {
                const obsRect = obstacle.getBoundingClientRect();
                if (this.isColliding(projRect, obsRect)) {
                    // Destroy both projectile and obstacle
                    projectile.remove();
                    this.projectiles.splice(pIndex, 1);
                    obstacle.remove();
                    this.obstacles.splice(oIndex, 1);
                    this.score += 2; // Bonus score for shooting objects
                    this.scoreElement.textContent = this.score;
                }
            });

            // Remove if out of bounds
            if (currentBottom > this.gameArea.offsetHeight) {
                projectile.remove();
                this.projectiles.splice(pIndex, 1);
            }
        });
    }
    
    checkCollision() {
        const playerRect = this.player.getBoundingClientRect();
        this.obstacles.forEach((obstacle) => {
            const obstacleRect = obstacle.getBoundingClientRect();
            if (this.isColliding(playerRect, obstacleRect)) {
                this.gameOver();
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    updateSpeedIndicator() {
        this.speedElement.textContent = this.speed;
        const speedPercentage = (this.speed / this.maxSpeed) * 100;
        this.speedFill.style.width = `${speedPercentage}%`;
    }
    
    gameOver() {
        this.isGameRunning = false;
        clearInterval(this.gameLoop);
        this.startBtn.textContent = 'Start Game';
        
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.projectiles.forEach(proj => proj.proj.remove());
        this.obstacles = [];
        this.projectiles = [];
        this.speed = 1;
        this.isBoosting = false;
        this.updateSpeedIndicator();
        
        const gameOverMessage = document.querySelector('.game-over-message');
        const finalScore = gameOverMessage.querySelector('.final-score');
        finalScore.textContent = this.score;
        gameOverMessage.style.display = 'block';

        const lastScoreValue = document.querySelector('.last-score .score-value');
        lastScoreValue.textContent = this.score;
    }
}

window.addEventListener('load', () => {
    new RacingGame();
});
