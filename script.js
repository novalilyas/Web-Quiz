const quizData = [
  {
    question: "Apa kepanjangan dari HTML?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyperlinks Text Language",
      "Home Tool Markup Language"
    ],
    answer: 0
  },
  {
    question: "Properti CSS untuk mengubah warna teks adalah?",
    options: ["font-color", "text-color", "color", "foreground"],
    answer: 2
  },
  {
    question: "Manakah yang bukan Framework JavaScript?",
    options: ["React", "Vue", "Laravel", "Angular"],
    answer: 2
  },
  {
    question: "Simbol untuk ID selector di CSS?",
    options: [".", "#", "@", "*"],
    answer: 1
  },
  {
    question: "Tipe data untuk True/False disebut?",
    options: ["String", "Integer", "Boolean", "Float"],
    answer: 2
  },
  {
    question: "Cara membuat variabel di JS modern?",
    options: ["var", "dim", "let & const", "int"],
    answer: 2
  },
  {
    question: "Apa output dari '5' + 3 di JavaScript?",
    options: ["8", "53", "Error", "NaN"],
    answer: 1
  },
  {
    question: "HTML5 diperkenalkan pada tahun?",
    options: ["2005", "2010", "2014", "2000"],
    answer: 2
  },
  {
    question: "Tag untuk membuat baris baru?",
    options: ["<br>", "<lb>", "<break>", "<newline>"],
    answer: 0
  },
  {
    question: "Properti Flexbox untuk meratakan vertikal?",
    options: ["justify-content", "align-items", "flex-direction", "grid-gap"],
    answer: 1
  }
];

let state = {
  user: null,
  score: 0,
  wrong: 0,
  currentQ: 0,
  timer: null,
  timeLeft: 30,
  totalTime: 0,
  startTime: 0,
  soundEnabled: true
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!state.soundEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1200,
        audioCtx.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.3
      );
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.3
      );
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === "click") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.1
      );
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.frequency.value = freq;
          g.gain.value = 0.2;
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          o.start();
          o.stop(audioCtx.currentTime + 0.4);
        }, i * 150);
      });
    }
  } catch (e) {
    console.error("Audio Error:", e);
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  document.querySelector(".sound-toggle").textContent = state.soundEnabled
    ? "🔊"
    : "🔇";
}

/* =========================================
   3. CORE FUNCTIONS (Login, Dashboard)
   ========================================= */
function init() {
  initParticles();
  // Cek apakah user sudah login sebelumnya
  const savedUser = localStorage.getItem("quizUser");
  if (savedUser) {
    state.user = JSON.parse(savedUser);
    showPage("dashboardPage");
    updateDashboard();
  } else {
    showPage("loginPage");
  }
}

function showPage(pageId) {
  // 1. Sembunyikan semua halaman
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none"; // Reset display
  });

  // 2. Ambil halaman target
  const target = document.getElementById(pageId);

  // 3. Tentukan display berdasarkan halaman
  // Jika Dashboard -> Pakai block (biar bisa scroll ke bawah)
  // Jika Login/Quiz/Result -> Pakai flex (biar konten di tengah layar)
  if (pageId === "dashboardPage") {
    target.style.display = "block";
  } else {
    target.style.display = "flex";
  }

  // 4. Animasi Fade-in
  setTimeout(() => {
    target.classList.add("active");
  }, 10);
}

function login() {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return alert("Masukkan username dulu!");
  playSound("click");

  // Default User Baru
  state.user = { name, matches: 0, totalScore: 0, bestScore: 0 };

  // Cek History: Jika nama ini pernah main, ambil datanya
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  const existing = history.find((h) => h.name === name);
  if (existing) {
    state.user = existing;
  }

  // Simpan User Aktif ke Storage
  localStorage.setItem("quizUser", JSON.stringify(state.user));

  showPage("dashboardPage");
  updateDashboard();
}

function logout() {
  playSound("click");
  localStorage.removeItem("quizUser");
  state.user = null;
  showPage("loginPage");
  document.getElementById("usernameInput").value = "";
}

function updateDashboard() {
  // 1. WAJIB: Baca ulang data terbaru dari LocalStorage
  const savedUser = localStorage.getItem("quizUser");
  if (savedUser) {
    state.user = JSON.parse(savedUser);
  }

  if (!state.user) return;

  // 2. Update UI
  document.getElementById("userName").textContent = state.user.name;
  document.getElementById("userAvatar").textContent = state.user.name
    .charAt(0)
    .toUpperCase();

  const matches = state.user.matches || 0;
  const totalScore = state.user.totalScore || 0;
  const bestScore = state.user.bestScore || 0;
  const avg = matches > 0 ? Math.round(totalScore / matches) : 0;

  document.getElementById("totalQuizzes").textContent = matches;
  document.getElementById("avgScore").textContent = avg + "%";
  document.getElementById("bestScore").textContent = bestScore + "%";

  updateLeaderboard();
}

function updateLeaderboard() {
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  history.sort((a, b) => b.bestScore - a.bestScore);

  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";
  history.slice(0, 5).forEach((p, i) => {
    list.innerHTML += `
            <div class="rank-item">
                <div class="rank-num">#${i + 1}</div>
                <div class="rank-name">${p.name}</div>
                <div class="rank-score">${p.bestScore}%</div>
            </div>
        `;
  });
}

/* =========================================
   4. QUIZ LOGIC
   ========================================= */
function startQuiz() {
  playSound("click");
  state.currentQ = 0;
  state.score = 0;
  state.wrong = 0;
  state.totalTime = 0;

  showPage("quizPage");
  loadQuestion();
}

function loadQuestion() {
  const q = quizData[state.currentQ];
  const qEl = document.getElementById("question");

  // Animasi Masuk
  qEl.style.opacity = 0;
  qEl.style.transform = "translateY(10px)";
  setTimeout(() => {
    qEl.textContent = q.question;
    qEl.style.opacity = 1;
    qEl.style.transform = "translateY(0)";
    qEl.style.transition = "all 0.5s ease";
  }, 200);

  document.getElementById("currentQ").textContent = state.currentQ + 1;
  document.getElementById("totalQ").textContent = quizData.length;
  document.getElementById("nextBtn").style.display = "none";

  const optsDiv = document.getElementById("options");
  optsDiv.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(i, btn);
    optsDiv.appendChild(btn);
  });

  startTimer();
  updateProgressBar();
}

function startTimer() {
  state.timeLeft = 30;
  document.getElementById("timeLeft").textContent = state.timeLeft;

  // Reset Lingkaran Timer
  const circle = document.querySelector(".timer-ring-circle");
  if (circle) circle.style.strokeDashoffset = 0;
  document.querySelector(".timer-badge").classList.remove("warning");

  clearInterval(state.timer);
  state.startTime = Date.now();

  state.timer = setInterval(() => {
    state.timeLeft--;
    document.getElementById("timeLeft").textContent = state.timeLeft;

    // Update Animasi SVG
    if (circle) {
      const offset = 100 - (state.timeLeft / 30) * 100;
      circle.style.strokeDashoffset = offset;
    }

    if (state.timeLeft <= 10)
      document.querySelector(".timer-badge").classList.add("warning");

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      forceNext();
    }
  }, 1000);
}

function selectAnswer(index, btnEl) {
  if (document.querySelector(".option-btn.correct")) return;
  clearInterval(state.timer);

  const correct = quizData[state.currentQ].answer;
  const btns = document.querySelectorAll(".option-btn");

  btns.forEach((b) => b.classList.add("disabled"));

  if (index === correct) {
    btnEl.classList.add("correct");
    playSound("correct");
    state.score++;
  } else {
    btnEl.classList.add("wrong");
    btns[correct].classList.add("correct");
    playSound("wrong");
    state.wrong++;
  }

  state.totalTime += Math.floor((Date.now() - state.startTime) / 1000);
  document.getElementById("nextBtn").style.display = "block";
}

function forceNext() {
  playSound("wrong");
  const correct = quizData[state.currentQ].answer;
  const btns = document.querySelectorAll(".option-btn");
  btns.forEach((b) => b.classList.add("disabled"));
  btns[correct].classList.add("correct");
  state.wrong++;
  document.getElementById("nextBtn").style.display = "block";
}

function nextQuestion() {
  playSound("click");
  state.currentQ++;
  if (state.currentQ < quizData.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function updateProgressBar() {
  const pct = (state.currentQ / quizData.length) * 100;
  document.getElementById("progressBar").style.width = pct + "%";
}

/* =========================================
   5. FINISH & SAVE DATA
   ========================================= */
function finishQuiz() {
  showPage("resultsPage");
  const finalPct = Math.round((state.score / quizData.length) * 100);

  // Update UI Hasil
  document.getElementById("finalScore").textContent = finalPct + "%";
  document.getElementById("correctAnswers").textContent = state.score;
  document.getElementById("wrongAnswers").textContent = state.wrong;
  document.getElementById("totalTime").textContent = state.totalTime + "s";

  // Animasi Ring
  setTimeout(() => {
    const offset = 440 - (440 * finalPct) / 100;
    const ring = document.getElementById("scoreRingFill");
    if (ring) ring.style.strokeDashoffset = offset;
  }, 500);

  // Pesan & Efek
  let msg = "Keep Practicing!";
  if (finalPct >= 80) {
    msg = "Legendary!";
    playSound("win");
    if (typeof startConfetti === "function") startConfetti();
  } else if (finalPct >= 60) {
    msg = "Great Job!";
    playSound("correct");
  }
  document.getElementById("scoreMessage").textContent = msg;

  /* --- LOGIKA PENYIMPANAN DATA (FIXED) --- */
  // 1. Ambil data user saat ini
  let currentUser = state.user;
  if (!currentUser) {
    // Fallback jika user null
    const saved = localStorage.getItem("quizUser");
    currentUser = saved
      ? JSON.parse(saved)
      : { name: "Guest", matches: 0, totalScore: 0, bestScore: 0 };
  }

  // 2. Update Angka
  currentUser.matches = (currentUser.matches || 0) + 1;
  currentUser.totalScore = (currentUser.totalScore || 0) + finalPct;
  if (finalPct > (currentUser.bestScore || 0)) {
    currentUser.bestScore = finalPct;
  }

  // 3. Simpan Balik ke State & LocalStorage (Untuk Dashboard)
  state.user = currentUser;
  localStorage.setItem("quizUser", JSON.stringify(currentUser));

  // 4. Update Database Global (Untuk Leaderboard)
  let history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  const idx = history.findIndex((h) => h.name === currentUser.name);

  if (idx >= 0) {
    history[idx] = currentUser;
  } else {
    history.push(currentUser);
  }
  localStorage.setItem("quizHistory", JSON.stringify(history));
}

/* =========================================
   6. NAVIGATION (BACK TO HOME)
   ========================================= */
window.backToDashboard = function () {
  console.log("Tombol Home ditekan...");

  // Matikan efek
  if (typeof stopConfetti === "function") stopConfetti();
  if (typeof confettiInterval !== "undefined") clearInterval(confettiInterval);
  playSound("click");

  // Paksa pindah halaman
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const dashboard = document.getElementById("dashboardPage");
  dashboard.style.display = "block";
  setTimeout(() => dashboard.classList.add("active"), 10);

  // Paksa update data
  updateDashboard();
};

/* =========================================
   7. VISUAL EFFECTS (Particles & Confetti)
   ========================================= */
function initParticles() {
  const cvs = document.getElementById("bgCanvas");
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  let width,
    height,
    particles = [];

  function resize() {
    width = cvs.width = window.innerWidth;
    height = cvs.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 2;
      this.color =
        Math.random() > 0.5
          ? "rgba(99, 102, 241, 0.3)"
          : "rgba(236, 72, 153, 0.3)";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 50; i++) particles.push(new Particle());
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

let confettiInterval;
function startConfetti() {
  const cvs = document.getElementById("confettiCanvas");
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  const pieces = [];
  const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff"];
  for (let i = 0; i < 100; i++) {
    pieces.push({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height - cvs.height,
      c: colors[Math.floor(Math.random() * colors.length)],
      s: Math.random() * 5 + 5,
      d: Math.random() * 5 + 2
    });
  }
  confettiInterval = setInterval(() => {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    pieces.forEach((p) => {
      p.y += p.d;
      if (p.y > cvs.height) p.y = -10;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    });
  }, 20);
}

function stopConfetti() {
  clearInterval(confettiInterval);
  const cvs = document.getElementById("confettiCanvas");
  if (cvs) {
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);
  }
}

// START APP
window.onload = init;
