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
        this.projectiles = [];
        this.isGameRunning = false;
        this.keys = {};
        this.isBoosting = false;
        
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
            
            if (e.key === 'Shift') {
                this.isBoosting = true;
            }
            
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
        const boostMultiplier = this.isBoosting ? 2.5 : 1.0;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.moveLeft(boostMultiplier);
        if (this.keys['ArrowRight'] || this.keys['d']) this.moveRight(boostMultiplier);
        if (this.keys['ArrowUp'] || this.keys['w']) this.moveUp(boostMultiplier);
        if (this.keys['ArrowDown'] || this.keys['s']) this.moveDown(boostMultiplier);
    }
    
    moveLeft(multiplier = 1.0) {
        if (!this.isGameRunning) return;
        const currentLeft = parseInt(window.getComputedStyle(this.player).left) || 0;
        const moveAmount = 12 * (this.speed / 3) * multiplier;
        if (currentLeft > 0) {
            this.player.style.left = Math.max(0, currentLeft - moveAmount) + 'px';
        }
    }
    
    moveRight(multiplier = 1.0) {
        if (!this.isGameRunning) return;
        const currentLeft = parseInt(window.getComputedStyle(this.player).left) || 0;
        const gameAreaWidth = this.gameArea.offsetWidth;
        const playerWidth = this.player.offsetWidth;
        const moveAmount = 12 * (this.speed / 3) * multiplier;
        
        if (currentLeft < gameAreaWidth - playerWidth) {
            this.player.style.left = Math.min(gameAreaWidth - playerWidth, currentLeft + moveAmount) + 'px';
        }
    }
    
    moveUp(multiplier = 1.0) {
        if (!this.isGameRunning) return;
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom) || 20;
        const moveAmount = 12 * (this.speed / 3) * multiplier;
        const gameAreaHeight = this.gameArea.offsetHeight;
        const playerHeight = this.player.offsetHeight;
        
        if (currentBottom < gameAreaHeight - playerHeight) {
            this.player.style.bottom = Math.min(gameAreaHeight - playerHeight, currentBottom + moveAmount) + 'px';
        }
    }
    
    moveDown(multiplier = 1.0) {
        if (!this.isGameRunning) return;
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom) || 20;
        const moveAmount = 12 * (this.speed / 3) * multiplier;
        
        if (currentBottom > 20) {
            this.player.style.bottom = Math.max(20, currentBottom - moveAmount) + 'px';
        }
    }

    fireProjectile() {
        const projectile = document.createElement('div');
        projectile.style.position = 'absolute';
        projectile.style.width = '6px';
        projectile.style.height = '14px';
        projectile.style.backgroundColor = '#f43f5e';
        projectile.style.borderRadius = '3px';
        projectile.style.boxShadow = '0 0 8px #f43f5e';
        projectile.style.zIndex = '5';
        
        const playerLeft = parseInt(window.getComputedStyle(this.player).left) || 0;
        const playerBottom = parseInt(window.getComputedStyle(this.player).bottom) || 20;
        
        projectile.style.left = (playerLeft + (this.player.offsetWidth / 2) - 3) + 'px';
        projectile.style.bottom = (playerBottom + this.player.offsetHeight) + 'px';
        
        this.gameArea.appendChild(projectile);
        this.projectiles.push(projectile);
    }
    
    startGame() {
        if (this.isGameRunning) return;
        const gameOverMessage = document.querySelector('.game-over-message');
        if (gameOverMessage) gameOverMessage.style.display = 'none';
        
        this.isGameRunning = true;
        this.score = 0;
        this.speed = 1;
        this.scoreElement.textContent = this.score;
        this.updateSpeedIndicator();
        
        this.obstacles.forEach(obs => obs.remove());
        this.projectiles.forEach(proj => proj.remove());
        this.obstacles = [];
        this.projectiles = [];
        this.startBtn.textContent = 'Restart Game';
        
        this.player.style.bottom = '20px';
        this.player.style.left = '50%';
        this.player.style.transform = 'translateX(-50%)';
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            this.update();
        }, 20);
    }
    
    update() {
        if (!this.isGameRunning) return;
        this.handleInput();
        this.moveObstacles();
        this.moveProjectiles();
        this.createObstacle();
        this.checkCollision();
    }
    
    createObstacle() {
        if (Math.random() < 0.025 * (this.speed / 2)) {
            const obstacle = document.createElement('div');
            obstacle.classList.add('obstacle');
            obstacle.style.position = 'absolute';
            obstacle.style.width = '36px';
            obstacle.style.height = '36px';
            obstacle.style.borderRadius = '6px';
            obstacle.style.left = Math.random() * (this.gameArea.offsetWidth - 40) + 'px';
            obstacle.style.top = '-40px';
            
            if (Math.random() < 0.5) {
                obstacle.style.background = '#f43f5e';
                obstacle.classList.add('red-obstacle');
            } else {
                obstacle.style.background = '#38bdf8';
            }
            
            this.gameArea.appendChild(obstacle);
            this.obstacles.push(obstacle);
        }
    }
    
    moveObstacles() {
        this.obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(window.getComputedStyle(obstacle).top) || 0;
            const moveMultiplier = this.isBoosting ? 2.5 : 1.5;
            const moveAmount = (this.speed * 1.5) * moveMultiplier;
            obstacle.style.top = (currentTop + moveAmount) + 'px';
            
            if (currentTop > this.gameArea.offsetHeight) {
                if (obstacle.classList.contains('red-obstacle')) {
                    this.score += 1;
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
            const currentBottom = parseInt(window.getComputedStyle(projectile).bottom) || 0;
            projectile.style.bottom = (currentBottom + 18) + 'px';

            const projRect = projectile.getBoundingClientRect();
            this.obstacles.forEach((obstacle, oIndex) => {
                const obsRect = obstacle.getBoundingClientRect();
                if (this.isColliding(projRect, obsRect)) {
                    projectile.remove();
                    this.projectiles.splice(pIndex, 1);
                    obstacle.remove();
                    this.obstacles.splice(oIndex, 1);
                    
                    this.score += 2;
                    this.scoreElement.textContent = this.score;
                    if (this.speed < this.maxSpeed) {
                        this.speed++;
                        this.updateSpeedIndicator();
                    }
                }
            });

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
        if (this.speedElement) this.speedElement.textContent = this.speed;
        if (this.speedFill) {
            const speedPercentage = (this.speed / this.maxSpeed) * 100;
            this.speedFill.style.width = `${speedPercentage}%`;
        }
    }
    
    gameOver() {
        this.isGameRunning = false;
        clearInterval(this.gameLoop);
        this.startBtn.textContent = 'Start Game';
        
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.projectiles.forEach(proj => proj.remove());
        this.obstacles = [];
        this.projectiles = [];
        this.speed = 1;
        this.isBoosting = false;
        this.updateSpeedIndicator();
        
        const gameOverMessage = document.querySelector('.game-over-message');
        if (gameOverMessage) {
            const finalScore = gameOverMessage.querySelector('.final-score');
            if (finalScore) finalScore.textContent = this.score;
            gameOverMessage.style.display = 'block';
        }

        const lastScoreValue = document.querySelector('.last-score .score-value');
        if (lastScoreValue) {
            lastScoreValue.textContent = this.score;
        }
    }
}

window.addEventListener('load', () => {
    new RacingGame();
});
