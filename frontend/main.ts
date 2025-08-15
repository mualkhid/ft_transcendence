"use strict";

class PowerpuffPong {
    constructor() {
        this.gameRunning = false;
        this.gameStarted = false;

        // Player info
        this.player1Name = 'Blossom';
        this.player2Name = 'Bubbles';
        this.isLoggedIn = false;

        // Game settings (easy to tweak)
        this.PADDLE_WIDTH = 15;
        this.PADDLE_HEIGHT = 100;
        this.BALL_RADIUS = 10;
        this.POWER_UP_SIZE = 20;

        // Input
        this.keys = {};

        // Canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.initializeGame();
        this.setupEventListeners();
        this.setupLoginSystem();
    }

    initializeGame() {
        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: this.BALL_RADIUS,
            width: this.BALL_RADIUS * 2,
            height: this.BALL_RADIUS * 2,
            speedX: 5,
            speedY: 3
        };

        // Left Paddle
        this.leftPaddle = {
            x: 50,
            y: (this.canvas.height - this.PADDLE_HEIGHT) / 2,
            width: this.PADDLE_WIDTH,
            height: this.PADDLE_HEIGHT,
            speedY: 8,
            score: 0,
            color: '#FF69B4'
        };

        // Right Paddle
        this.rightPaddle = {
            x: this.canvas.width - 50 - this.PADDLE_WIDTH,
            y: (this.canvas.height - this.PADDLE_HEIGHT) / 2,
            width: this.PADDLE_WIDTH,
            height: this.PADDLE_HEIGHT,
            speedY: 8,
            score: 0,
            color: '#87CEEB'
        };

        this.powerUps = [];
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
            if (e.key === ' ' && this.gameRunning) {
                this.activatePowerUp();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    updatePaddles() {
        const { height } = this.canvas;

        // Player 1
        if (this.keys['w'] || this.keys['W']) {
            this.leftPaddle.y = Math.max(0, this.leftPaddle.y - this.leftPaddle.speedY);
        }
        if (this.keys['s'] || this.keys['S']) {
            this.leftPaddle.y = Math.min(height - this.leftPaddle.height, this.leftPaddle.y + this.leftPaddle.speedY);
        }

        // Player 2
        if (this.keys['ArrowUp']) {
            this.rightPaddle.y = Math.max(0, this.rightPaddle.y - this.rightPaddle.speedY);
        }
        if (this.keys['ArrowDown']) {
            this.rightPaddle.y = Math.min(height - this.rightPaddle.height, this.rightPaddle.y + this.rightPaddle.speedY);
        }
    }

    updateBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // Bounce top/bottom
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
            this.ball.speedY *= -1;
        }
    }

    checkCollisions() {
        // Left paddle
        if (this.ball.x - this.ball.radius <= this.leftPaddle.x + this.leftPaddle.width &&
            this.ball.y >= this.leftPaddle.y &&
            this.ball.y <= this.leftPaddle.y + this.leftPaddle.height) {
            this.ball.speedX = Math.abs(this.ball.speedX);
            this.addSpin();
        }

        // Right paddle
        if (this.ball.x + this.ball.radius >= this.rightPaddle.x &&
            this.ball.y >= this.rightPaddle.y &&
            this.ball.y <= this.rightPaddle.y + this.rightPaddle.height) {
            this.ball.speedX = -Math.abs(this.ball.speedX);
            this.addSpin();
        }
    }

    addSpin() {
        const spin = (Math.random() - 0.5) * 2;
        this.ball.speedY = Math.max(-8, Math.min(8, this.ball.speedY + spin));
    }
}
