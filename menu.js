const levelsContainer = document.getElementById("levelsContainer");
const backBtn = document.getElementById("backBtn");

let unlockedLevel = localStorage.getItem("unlockedLevel") || 1;
unlockedLevel = parseInt(unlockedLevel);

for (let i = 1; i <= 6; i++) {
  const btn = document.createElement("button");
  btn.textContent = "Level " + i;
  btn.classList.add("levelBtn");

  if (i > unlockedLevel) {
    btn.classList.add("locked");
    btn.disabled = true;
    btn.textContent += " 🔒";
  } else {
    btn.addEventListener("click", () => {
      localStorage.setItem("selectedLevel", i);
      window.location.href = "game.html";
    });
  }

  levelsContainer.appendChild(btn);
}

backBtn.addEventListener("click", () => {
  window.location.href = "select-bird.html";
});
