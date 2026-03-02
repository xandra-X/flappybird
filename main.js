const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const pauseBtn = document.getElementById("pauseBtn");
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

function resizeCanvas() {
  const maxWidth = 900;
  const maxHeight = 1600;

  const width = Math.min(window.innerWidth, maxWidth);
  const height = Math.min(window.innerHeight, maxHeight);

  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  canvas.width = width;
  canvas.height = height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let currentLevel = parseInt(localStorage.getItem("selectedLevel")) || 1;
let nightMode = false;
let waterMode = false;
let windActive = false;
let lavaActive = false;
let iceMode = false;
let stormMode = false;
let chaosMode = false;
let gameEnded = false;
let endMessage = "";

let lavaHeight = 0;
let bird;
let pipes = [];
let drones = [];
let score = 0;

let gravity;
let jumpForce = -6;

let pipeWidth = 80;
let pipeGap;
let pipeSpeed;

let minPipeDistance;
let maxPipeDistance;

let distanceCounter = 0;
let nextPipeDistance = 0;
let lastTopHeight = null;

let movingGap = false;

let gameRunning = false;
let paused = false;
let animationId;

let droneSpawnTimer = 0;
let droneSpeed = 4;
let difficultyTriggered = false;

const birdImg = new Image();

// get selected bird from storage
const selectedBird = localStorage.getItem("selectedBird") || "bird.png";

// set image source dynamically
birdImg.src = "./assets/" + selectedBird;

const pipeTopImg = new Image();
pipeTopImg.src = "./assets/pipe-top.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "./assets/pipe-bottom.png";

const flapSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
);
const scoreSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
);
const hitSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"
);
let bgMusic = null;

function stopMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function playLevelMusic(src, volume = 0.5) {
  stopMusic();
  bgMusic = new Audio(src);
  bgMusic.loop = true;
  bgMusic.volume = volume;
  bgMusic.play().catch(() => {});
}
function updateLevelSettings() {
  movingGap = false;
  nightMode = false;
  waterMode = false;
  windActive = false;
  lavaActive = false;
  iceMode = false;
  stormMode = false;
  chaosMode = false;
  lavaHeight = 0;
  minPipeDistance = 250;
  maxPipeDistance = 400;
  

  switch (currentLevel) {
    case 1:
      gravity = 0.28;
      pipeSpeed = 2.5;
      pipeGap = 210;
      nightMode = true;
      playLevelMusic("./assets/music1.mp3", 0.4);
      break;

    case 2:
      gravity = 0.15;
      pipeSpeed = 2.3;
      pipeGap = 200;
      waterMode = true;
      movingGap = true;
      playLevelMusic("./assets/music2.mp3", 0.4);
      break;

    case 3:
      gravity = 0.32;
      pipeSpeed = 3;
      pipeGap = 180;
      lavaActive = true;
      movingGap = true;
      playLevelMusic("./assets/music3.mp3", 0.4);
      break;

    case 4:
      gravity = 0.25;
      pipeSpeed = 3;
      pipeGap = 170;
      iceMode = true;
      movingGap = true;
      playLevelMusic("./assets/music4.mp3", 0.4);
      break;

    case 5:
      gravity = 0.35;
      pipeSpeed = 3.5;
      pipeGap = 160;
      stormMode = true;
      movingGap = true;
      playLevelMusic("./assets/music5.mp3", 0.4);
      break;

    case 6:
      gravity = 0.3;
      pipeSpeed = 3;
      pipeGap = 160;
      chaosMode = true;
      movingGap = true;
      playLevelMusic("./assets/music6.mp3", 0.4);
      break;
  }
  if (isMobile) {
    stormMode = false;
    chaosMode = false;
    waterMode = false;
  }
}
let lastTime = 0;

function gameLoop(time = 0) {
  if (!gameRunning || paused) return;

  const targetFrameTime = isMobile ? 28 : 16;

  if (time - lastTime > targetFrameTime) {
    update();
    draw();
    lastTime = time;
  }

  animationId = requestAnimationFrame(gameLoop);
}
function startGame() {
  updateLevelSettings();

  bird = {
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    radius: 35,
    velocity: 0,
    rotation: 0,
  };

  pipes = [];
  drones = [];
  score = 0;

  distanceCounter = 0;
  nextPipeDistance = getRandomDistance();
  lastTopHeight = null;

  paused = false;
  gameRunning = true;

  pauseBtn.style.display = "block";

  gameLoop();
}

startGame();

function flap() {
  if (!gameRunning) return;

  if (iceMode) {
    setTimeout(() => {
      bird.velocity = jumpForce;
    }, 120);
  } else {
    bird.velocity = jumpForce;
  }

  flapSound.currentTime = 0;
  flapSound.play();
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") flap();
  if (e.code === "KeyP") togglePause();
});

canvas.addEventListener("click", () => {
  if (gameEnded) {
    window.location.href = "menu.html";
  } else {
    flap();
  }
});
canvas.addEventListener("touchstart", flap);

pauseBtn.addEventListener("click", togglePause);

function togglePause() {
  if (!gameRunning) return;

  paused = !paused;

  if (paused) {
    cancelAnimationFrame(animationId);
    pauseBtn.textContent = "▶";
  } else {
    pauseBtn.textContent = "⏸";
    gameLoop();
  }
}

function update() {
  bird.velocity += gravity;
  bird.y += bird.velocity;
  bird.rotation += (bird.velocity * 3 - bird.rotation) * 0.2;

  if (score > 0 && score % 10 === 0 && !difficultyTriggered) {
    pipeSpeed += 0.05;
    gravity += 0.002;

    if (pipeGap > 160) {
      pipeGap -= 5;
    }

    difficultyTriggered = true;
  }

  if (score % 10 !== 0) {
    difficultyTriggered = false;
  }
  if (windActive) {
    bird.x += Math.sin(Date.now() / 200) * 0.5;
  }
  if (chaosMode && Math.random() < 0.02) {
    gravity = 0.2 + Math.random() * 0.3;
    pipeSpeed = 2 + Math.random() * 3;
  }
  

  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    endGame();
  }
  if (lavaActive) {
    lavaHeight += 0.1;

    const maxLava = canvas.height * 0.25;

    if (lavaHeight > maxLava) {
      lavaHeight = maxLava;
    }

    if (bird.y + bird.radius > canvas.height - lavaHeight) {
      endGame();
    }
  }

  pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed;

    if (movingGap) {
      pipe.top += pipe.gapSpeed * pipe.direction;
      pipe.bottom += pipe.gapSpeed * pipe.direction;

      if (pipe.top < 80 || pipe.bottom > canvas.height - 80) {
        pipe.direction *= -1;
      }
    }

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      score++;
      scoreSound.currentTime = 0;
      scoreSound.play();
      checkWinCondition();
    }

    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + pipeWidth &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom)
    ) {
      endGame();
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > 0);

  distanceCounter += pipeSpeed;
  if (distanceCounter >= nextPipeDistance) {
    spawnPipe();
    distanceCounter = 0;
    nextPipeDistance = getRandomDistance();
  }
}

function spawnPipe() {
  const minHeight = 120;
  const maxHeight = canvas.height - pipeGap - 120;

  let topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
  lastTopHeight = topHeight;

  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false,
    gapSpeed: movingGap ? Math.random() * (0.5 + currentLevel * 0.1) : 0,
    direction: 1,
  });
}

function getRandomDistance() {
  return Math.random() * (maxPipeDistance - minPipeDistance) + minPipeDistance;
}

// function drawStyledPipe(x, y, width, height, isTop) {
//   ctx.save();

//   const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
//   gradient.addColorStop(0, "#b6ff6b");
//   gradient.addColorStop(0.2, "#9be44d");
//   gradient.addColorStop(0.5, "#7ed957");
//   gradient.addColorStop(0.8, "#4caf50");
//   gradient.addColorStop(1, "#3c8e3c");

//   ctx.fillStyle = gradient;
//   ctx.fillRect(x, y, width, height);

//   ctx.fillStyle = "#2b2b2b";
//   ctx.fillRect(x, y, 6, height);
//   ctx.fillRect(x + width - 6, y, 6, height);

//   ctx.fillStyle = "rgba(255,255,255,0.25)";
//   ctx.fillRect(x + 18, y, 10, height);

//   ctx.fillStyle = "rgba(0,0,0,0.15)";
//   ctx.fillRect(x + width - 20, y, 8, height);

//   const capHeight = 30;

//   ctx.fillStyle = "#4caf50";

//   if (isTop) {
//     ctx.fillRect(x - 10, y + height - capHeight, width + 20, capHeight);
//   } else {
//     ctx.fillRect(x - 10, y, width + 20, capHeight);
//   }

//   ctx.strokeStyle = "#2b2b2b";
//   ctx.lineWidth = 6;

//   if (isTop) {
//     ctx.strokeRect(x - 10, y + height - capHeight, width + 20, capHeight);
//   } else {
//     ctx.strokeRect(x - 10, y, width + 20, capHeight);
//   }

//   ctx.restore();
// }

function drawStyledPipe(x, y, width, height, isTop) {
  ctx.fillStyle = isMobile ? "#4caf50" : "#4caf50";
  ctx.fillRect(x, y, width, height);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  if (nightMode) {
    ctx.fillStyle = "#0d1b2a";
  } else if (waterMode) {
    ctx.fillStyle = "#1e90ff";
  } else if (lavaActive) {
    ctx.fillStyle = "#2c1b0f";
  } else if (iceMode) {
    ctx.fillStyle = "#cceeff";
  } else if (stormMode) {
    ctx.fillStyle = "#2f3640";
  } else {
    ctx.fillStyle = "#70c5ce";
  }

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (lavaActive) {
    ctx.fillStyle = "red";
    ctx.fillRect(0, canvas.height - lavaHeight, canvas.width, lavaHeight);
  }
  if (stormMode && Math.random() < 0.01) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  pipes.forEach((pipe) => {
    drawStyledPipe(pipe.x, 0, pipeWidth, pipe.top, true);

    drawStyledPipe(
      pipe.x,
      pipe.bottom,
      pipeWidth,
      canvas.height - pipe.bottom,
      false
    );
  });

  if (waterMode) {
    for (let i = 0; i < (isMobile ? 2 : 5); i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 4 + 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }
  }

  if (gameEnded) {
    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "white";
    ctx.font = "bold 50px Arial";
    ctx.fillText(endMessage, canvas.width / 2, canvas.height / 2);

    ctx.font = "25px Arial";
    ctx.fillText(
      "Click to return to menu",
      canvas.width / 2,
      canvas.height / 2 + 60
    );

    ctx.restore();
  }

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate((bird.rotation * Math.PI) / 180);
  ctx.drawImage(
    birdImg,
    -bird.radius,
    -bird.radius,
    bird.radius * 2,
    bird.radius * 2
  );
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText(score, canvas.width / 2 - 10, 70);

  ctx.font = "20px Arial";
  ctx.fillText("Level: " + currentLevel, 20, 40);
}

function checkWinCondition() {
  if (score >= 15) {
    winLevel();
  }
}

function winLevel() {
  gameRunning = false;
  gameEnded = true;
  endMessage = "🎉 YOU WIN! Congratulations!";
  stopMusic();

  let unlockedLevel = parseInt(localStorage.getItem("unlockedLevel")) || 1;

  if (currentLevel === unlockedLevel && unlockedLevel < 6) {
    unlockedLevel++;
    localStorage.setItem("unlockedLevel", unlockedLevel);
  }
}
function endGame() {
  gameRunning = false;
  gameEnded = true;
  endMessage = "💀 GAME OVER";
  stopMusic();

  hitSound.currentTime = 0;
  hitSound.play();
}