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
        this.maxSpeed = 12;
        this.gameLoop = null;
        this.obstacles = [];
        this.isGameRunning = false;
        this.keys = {};
        
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
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    handleInput() {
        if (this.keys['ArrowLeft']) this.moveLeft();
        if (this.keys['ArrowRight']) this.moveRight();
        if (this.keys['ArrowUp']) this.moveUp();
        if (this.keys['ArrowDown']) this.moveDown();
    }
    
    moveLeft() {
        const currentLeft = parseInt(window.getComputedStyle(this.player).left);
        const moveAmount = 10 * (this.speed / 3);
        if (currentLeft > 0) {
            this.player.style.left = (currentLeft - moveAmount) + 'px';
        }
    }
    
    moveRight() {
        const currentLeft = parseInt(window.getComputedStyle(this.player).left);
        const gameAreaWidth = this.gameArea.offsetWidth;
        const playerWidth = this.player.offsetWidth;
        const moveAmount = 10 * (this.speed / 3);
        
        if (currentLeft < gameAreaWidth - playerWidth) {
            this.player.style.left = (currentLeft + moveAmount) + 'px';
        }
    }
    
    moveUp() {
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom);
        const moveAmount = 10 * (this.speed / 3);
        const gameAreaHeight = this.gameArea.offsetHeight;
        const playerHeight = this.player.offsetHeight;
        
        if (currentBottom < gameAreaHeight - playerHeight) {
            this.player.style.bottom = (currentBottom + moveAmount) + 'px';
        }
    }
    
    moveDown() {
        const currentBottom = parseInt(window.getComputedStyle(this.player).bottom);
        const moveAmount = 10 * (this.speed / 3);
        
        if (currentBottom > 20) { // Keep 20px from bottom
            this.player.style.bottom = (currentBottom - moveAmount) + 'px';
        }
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
        this.obstacles = [];
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
        this.createObstacle();
        this.checkCollision();
        this.updateScore();
    }
    
    createObstacle() {
        if (Math.random() < 0.02 * (this.speed / 3)) {
            const obstacle = document.createElement('div');
            obstacle.classList.add('obstacle');
            obstacle.style.left = Math.random() * (this.gameArea.offsetWidth - 40) + 'px';
            obstacle.style.top = '-40px';
            this.gameArea.appendChild(obstacle);
            this.obstacles.push(obstacle);
        }
    }
    
    moveObstacles() {
        this.obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(window.getComputedStyle(obstacle).top);
            const moveAmount = this.speed * 2;
            obstacle.style.top = (currentTop + moveAmount) + 'px';
            
            if (currentTop > this.gameArea.offsetHeight) {
                obstacle.remove();
                this.obstacles.splice(index, 1);
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
    
    updateScore() {
        this.score++;
        this.scoreElement.textContent = this.score;
        
        if (this.score % 100 === 0 && this.speed < this.maxSpeed) {
            this.speed++;
            this.updateSpeedIndicator();
        }
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
        this.obstacles = [];
        this.speed = 1;
        this.updateSpeedIndicator();
        
        const gameOverMessage = document.querySelector('.game-over-message');
        const finalScore = gameOverMessage.querySelector('.final-score');
        finalScore.textContent = this.score;
        gameOverMessage.style.display = 'block';

        // Update last game score
        const lastScoreValue = document.querySelector('.last-score .score-value');
        lastScoreValue.textContent = this.score;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new RacingGame();
});