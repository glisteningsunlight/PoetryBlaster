const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('wordFileInput');
const uploadButton = document.getElementById('uploadButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const pausedScreen = document.getElementById('pausedScreen');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
    constructor() {
        this.width = 50;
        this.height = 20;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10;
    }

    draw() {
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(mouseX) {
        this.x = mouseX - this.width / 2;

        // Wall collision detection
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
}

class Word {
    constructor(text, x, y, speed) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.speed = speed;
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(this.text, this.x, this.y);
    }

    update() {
        this.y += this.speed;
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 10;
        this.speed = 5;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
    }
}

const player = new Player();
const words = [];
const projectiles = [];
let fileWords = [];
let allWords = [];
const additionalWords = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']; // Add more words as needed
let score = 100; // Start with a score of 100
let gameOver = false;
let paused = false;
let mouseX = canvas.width / 2;
let speedMultiplier = 1.0; // Speed multiplier starting at 100%

async function processPoem(poem) {
    fileWords = poem.split(/\s+/).filter(word => word.trim().length > 0);
    allWords = [...fileWords, ...additionalWords];
}

function spawnWord() {
    if (allWords.length === 0) return;
    const text = allWords[Math.floor(Math.random() * allWords.length)];
    const x = Math.random() * (canvas.width - ctx.measureText(text).width);
    const y = 0;
    const speed = (2 + Math.random()) * speedMultiplier; // Adjust speed based on multiplier
    words.push(new Word(text, x, y, speed));
}

function detectCollision(projectile, word) {
    return (
        projectile.x < word.x + ctx.measureText(word.text).width &&
        projectile.x + projectile.width > word.x &&
        projectile.y < word.y &&
        projectile.y + projectile.height > word.y - 20
    );
}

function update() {
    if (paused) {
        pausedScreen.style.display = 'block'; // Display "Paused"
        return;
    } else {
        pausedScreen.style.display = 'none';
    }

    if (gameOver) {
        gameOverScreen.style.display = 'block'; // Display "Game Over"
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(mouseX);
    player.draw();

    projectiles.forEach((projectile, pIndex) => {
        projectile.update();
        projectile.draw();

        words.forEach((word, wIndex) => {
            if (detectCollision(projectile, word)) {
                projectiles.splice(pIndex, 1);
                words.splice(wIndex, 1);
                if (fileWords.includes(word.text)) {
                    score += 10;
                } else {
                    score -= 5;
                }
            }
        });
    });

    words.forEach((word, index) => {
        word.update();
        word.draw();

        if (word.y > canvas.height) {
            words.splice(index, 1);
            score -= 5;
            if (score <= 0) {
                gameOver = true;
                words.length = 0; // Clear the words array to make them disappear
                document.getElementById('uploadButton').style.display = 'none';
                canvas.style.display = 'none';
            }
        }
    });

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Speed: ${Math.round(speedMultiplier * 100)}%`, canvas.width - 150, 20);

    requestAnimationFrame(update);
}

function handleMouseMove(e) {
    mouseX = e.clientX;
}

function handleMouseClick(e) {
    if (!paused) {
        projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y));
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const content = event.target.result;
        await processPoem(content);
        if (allWords.length > 0) {
            setInterval(spawnWord, 500); // Increased spawn rate
            update();
            canvas.style.display = 'block';
            uploadButton.style.display = 'none';
        }
    };
    reader.readAsText(file);
}

canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('click', handleMouseClick);
fileInput.addEventListener('change', handleFileUpload);
uploadButton.addEventListener('click', () => fileInput.click());

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        paused = !paused;
        if (!paused) {
            update(); // Resume game
        }
    }
});
