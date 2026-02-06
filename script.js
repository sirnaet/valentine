const API_BASE =
  window.NOTES_API_BASE ??
  (window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "");
const ALLOWED_CATEGORIES = new Set(["romantic", "cute", "funny", "deep", "self"]);
let notes = [];

const msgEl = document.getElementById("msg");
const nextBtn = document.getElementById("nextBtn");
const copyBtn = document.getElementById("copyBtn");
const dlBtn = document.getElementById("dlBtn");
const chips = [...document.querySelectorAll(".chip")];
const addNoteForm = document.getElementById("addNoteForm");
const noteInput = document.getElementById("noteInput");
const catInput = document.getElementById("catInput");

const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
const vol = document.getElementById("vol");

let currentCat = "all";
let lastMsg = "";

function normalizeCategory(cat){
  return ALLOWED_CATEGORIES.has(cat) ? cat : "romantic";
}

function apiUrl(path){
  return `${API_BASE}${path}`;
}

async function loadNotes(){
  try {
    const res = await fetch(apiUrl("/api/notes"));
    if (!res.ok) throw new Error("Failed to fetch notes");
    const payload = await res.json();
    notes = Array.isArray(payload)
      ? payload
          .map((n) => ({
            message: String(n.message ?? "").trim(),
            category: normalizeCategory(n.category),
          }))
          .filter((n) => n.message.length > 0)
      : [];
  } catch (err) {
    console.error(err);
    notes = [];
    msgEl.textContent = "Could not load notes from API.";
  }
}

function poolFor(cat){
  if (!notes.length) return [];
  if (cat === "all") return notes.map((n) => n.message);
  return notes.filter((n) => n.category === cat).map((n) => n.message);
}

function pickMessage(){
  const pool = poolFor(currentCat);
  if (!pool.length) {
    msgEl.textContent = "No notes found for this category.";
    return;
  }

  let msg = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    while (msg === lastMsg) msg = pool[Math.floor(Math.random() * pool.length)];
  }
  lastMsg = msg;
  msgEl.textContent = msg;
}

function setActiveChip(cat){
  currentCat = cat;
  chips.forEach(c => c.classList.toggle("active", c.dataset.cat === cat));
  pickMessage();
}

async function addNote(message, category){
  const res = await fetch(apiUrl("/api/notes"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, category }),
  });

  if (!res.ok) {
    throw new Error("Failed to create note");
  }

  const created = await res.json();
  const note = {
    message: String(created.message ?? message).trim(),
    category: normalizeCategory(created.category ?? category),
  };
  notes.unshift(note);
  return note;
}

/* ---------- Music (local file) ---------- */
function loadMusicPrefs(){
  if (!bgMusic || !musicBtn || !vol) return;
  const savedVol = localStorage.getItem("love_vol");
  if (savedVol !== null) vol.value = savedVol;
  bgMusic.volume = parseFloat(vol.value);

  // Don’t autoplay. Just set button label to Play.
  musicBtn.textContent = "Play 🎶";
}

async function toggleMusic(){
  if (!bgMusic || !musicBtn) return;
  if (!bgMusic.paused) {
    bgMusic.pause();
    musicBtn.textContent = "Play 🎶";
    return;
  }
  try {
    await bgMusic.play();
    musicBtn.textContent = "Pause 🔊";
  } catch {
    alert("If audio is blocked, tap the page once and try again.");
    musicBtn.textContent = "Play 🎶";
  }
}

if (vol && bgMusic) {
  vol.addEventListener("input", () => {
    bgMusic.volume = parseFloat(vol.value);
    localStorage.setItem("love_vol", vol.value);
  });
}

if (musicBtn) musicBtn.addEventListener("click", toggleMusic);

/* ---------- Downloadable image card ---------- */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex, a){
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c=>c+c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function downloadCard(){
  const text = msgEl.textContent.trim() || "Love is in the air 💌";

  // High-res for socials
  const W = 1080;
  const H = 1350; // Instagram portrait
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient (matches site vibe)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f0a1a");
  grad.addColorStop(0.55, "#2a0f24");
  grad.addColorStop(1, "#3a1018");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft glow blobs (tasteful, not loud)
  const blobs = [
    { x: W*0.18, y: H*0.20, r: 520, c: "#ff4682", a: 0.18 },
    { x: W*0.84, y: H*0.36, r: 520, c: "#965aff", a: 0.14 },
    { x: W*0.46, y: H*0.84, r: 520, c: "#ff4646", a: 0.12 },
  ];

  blobs.forEach(b => {
    const rg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    rg.addColorStop(0, hexToRgba(b.c, b.a));
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  });

  // Glass card
  const pad = 90;
  const cardW = W - pad*2;
  const cardH = 720;
  const cardX = pad;
  const cardY = 240;

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fillStyle = "rgba(0,0,0,0.40)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Pill
  ctx.save();
  const pillX = cardX + 44;
  const pillY = cardY + 44;
  const pillW = 270;
  const pillH = 56;

  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 999);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textBaseline = "middle";
  ctx.fillText("Love Notes 💌", pillX + 18, pillY + pillH/2);
  ctx.restore();

  // Main text
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 64px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textBaseline = "top";

  const textX = cardX + 52;
  const textY = cardY + 140;
  const maxW = cardW - 104;
  const lines = wrapText(ctx, text, textX, textY, maxW, 78);

  // Footer text inside card
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.font = "600 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Share the love • lovenotes", textX, cardY + cardH - 88);

  // Tiny heart
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.fillText("❤️", cardX + cardW - 90, cardY + cardH - 92);

  ctx.restore();

  // Export
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `love-note-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ---------- Subtle heart particles (not cringe) ---------- */
const heartsCanvas = document.getElementById("hearts");
const hctx = heartsCanvas.getContext("2d");

function resizeHearts(){
  heartsCanvas.width = window.innerWidth * devicePixelRatio;
  heartsCanvas.height = window.innerHeight * devicePixelRatio;
  heartsCanvas.style.width = window.innerWidth + "px";
  heartsCanvas.style.height = window.innerHeight + "px";
  hctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", resizeHearts);

function rand(min, max){ return Math.random() * (max - min) + min; }

const heartCount = () => {
  const area = window.innerWidth * window.innerHeight;
  // scale lightly with screen size
  return Math.max(14, Math.min(34, Math.floor(area / 45000)));
};

let hearts = [];

function makeHeart(){
  return {
    x: rand(0, window.innerWidth),
    y: rand(window.innerHeight + 40, window.innerHeight + 400),
    size: rand(8, 18),              // small
    speed: rand(0.12, 0.45),        // slow
    drift: rand(-0.18, 0.18),       // gentle sideways drift
    wobble: rand(0, Math.PI * 2),
    wobbleSpeed: rand(0.002, 0.01),
    alpha: rand(0.05, 0.12),        // very light
    // muted colors (avoid candy pink overload)
    tint: Math.random() < 0.65 ? "rgba(255,255,255," : "rgba(255,120,170,"
  };
}

function heartPath(ctx, x, y, s){
  ctx.beginPath();
  // classic heart curve, scaled
  const topCurveHeight = s * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - s / 2, y + (s + topCurveHeight) / 2, x, y + (s + topCurveHeight) / 1.2, x, y + s);
  ctx.bezierCurveTo(x, y + (s + topCurveHeight) / 1.2, x + s / 2, y + (s + topCurveHeight) / 2, x + s / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
}

function initHearts(){
  hearts = [];
  const n = heartCount();
  for (let i = 0; i < n; i++) hearts.push(makeHeart());
}

let lastT = performance.now();

function animateHearts(t){
  const dt = Math.min(40, t - lastT);
  lastT = t;

  hctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // ultra subtle blur effect (cheap version)
  // If you want more blur, we can do offscreen canvas, but this is enough.
  for (const h of hearts){
    h.wobble += h.wobbleSpeed * dt;
    const wob = Math.sin(h.wobble) * 0.6;

    h.y -= h.speed * dt;
    h.x += (h.drift + wob) * dt;

    if (h.y < -80) {
      // respawn at bottom
      h.y = rand(window.innerHeight + 60, window.innerHeight + 360);
      h.x = rand(0, window.innerWidth);
      h.size = rand(8, 18);
      h.speed = rand(0.12, 0.45);
      h.alpha = rand(0.05, 0.12);
      h.tint = Math.random() < 0.65 ? "rgba(255,255,255," : "rgba(255,120,170,";
    }

    // wrap x gently
    if (h.x < -60) h.x = window.innerWidth + 60;
    if (h.x > window.innerWidth + 60) h.x = -60;

    hctx.save();
    hctx.globalCompositeOperation = "lighter";
    hctx.fillStyle = `${h.tint}${h.alpha})`;
    hctx.shadowColor = "rgba(255,255,255,0.12)";
    hctx.shadowBlur = 10;

    heartPath(hctx, h.x, h.y, h.size);
    hctx.fill();
    hctx.restore();
  }

  requestAnimationFrame(animateHearts);
}

/* ---------- Wire up UI ---------- */
nextBtn.addEventListener("click", pickMessage);
if (copyBtn) copyBtn.addEventListener("click", copyMessage);
dlBtn.addEventListener("click", downloadCard);

chips.forEach(chip => chip.addEventListener("click", () => setActiveChip(chip.dataset.cat)));

if (addNoteForm) {
  addNoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = (noteInput?.value ?? "").trim();
    const category = normalizeCategory(catInput?.value);

    if (!message) return;

    try {
      await addNote(message, category);
      if (noteInput) noteInput.value = "";
      setActiveChip(category);
    } catch (err) {
      console.error(err);
      alert("Could not save note. Check Laravel API is running.");
    }
  });
}

loadMusicPrefs();

resizeHearts();
initHearts();
requestAnimationFrame(animateHearts);

// Optional: auto-rotate messages
setInterval(() => pickMessage(), 12000);

async function initNotes(){
  await loadNotes();
  pickMessage();
}

initNotes();
