// ─── Constants ───────────────────────────────────────────────────────────────
const TILE      = 32;
const COLS      = 22;
const ROWS      = 16;

const SHEET_W   = 1428;
const SHEET_H   = 784;
const FRAMES    = 3;
const FRAME_W   = SHEET_W / FRAMES;
const FRAME_H   = SHEET_H;

const PLAYER_W  = 28;
const PLAYER_H  = 46;
const ANIM_SPEED = 10;

// ─── Canvas ──────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;
ctx.imageSmoothingEnabled = false;

// ─── Tile map ─────────────────────────────────────────────────────────────────
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,2,2,2,1],
  [1,2,2,0,1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2,2,1],
  [1,2,2,0,1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2,2,1],
  [1,2,2,0,1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2,2,1],
  [1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,1],
  [1,2,2,2,2,2,2,0,2,2,2,2,2,2,2,0,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,0,2,2,2,2,2,2,2,0,2,2,2,2,2,1],
  [1,2,2,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,2,2,2,1],
  [1,2,2,0,1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2,2,1],
  [1,2,2,0,1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2,2,1],
  [1,2,2,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const TILE_COLORS = { 0: '#c8a052', 1: '#9e8b6e', 2: '#7a9e5c' };

// ─── Player ───────────────────────────────────────────────────────────────────
const player = { tileX: 11, tileY: 8, dir: 'front', frame: 1, animTimer: 0, isMoving: false };

// ─── Sprite loading (PNGs have transparent backgrounds — no JS chroma-key) ───
const sprites = { front: null, back: null, right: null };
let loadedCount = 0;

function loadSprite(dir, filename) {
  const img = new Image();
  img.onload  = () => { sprites[dir] = img; if (++loadedCount === 3) startGame(); };
  img.onerror = () => { console.error('Could not load:', filename); if (++loadedCount === 3) startGame(); };
  img.src = filename;
}

loadSprite('front', 'player_front.png');
loadSprite('back',  'player_back.png');
loadSprite('right', 'player_right.png');

// ─── Input ───────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ─── Movement ─────────────────────────────────────────────────────────────────
let moveDelay = 0;

function handleInput() {
  const up = keys['ArrowUp'], dn = keys['ArrowDown'];
  const lt = keys['ArrowLeft'], rt = keys['ArrowRight'];
  if (!up && !dn && !lt && !rt) { moveDelay = 0; player.isMoving = false; return; }
  if (--moveDelay > 0) { player.isMoving = false; return; }

  let dx = 0, dy = 0;
  if      (up) { dy = -1; player.dir = 'back'; }
  else if (dn) { dy =  1; player.dir = 'front'; }
  else if (lt) { dx = -1; player.dir = 'left'; }
  else if (rt) { dx =  1; player.dir = 'right'; }

  const nx = player.tileX + dx, ny = player.tileY + dy;
  if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && MAP[ny][nx] !== 1) {
    player.tileX = nx; player.tileY = ny; player.isMoving = true;
  }
  moveDelay = (moveDelay < 0) ? 14 : 8;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = TILE_COLORS[MAP[r][c]] ?? '#888';
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
}

function drawPlayer() {
  const sheetKey = player.dir === 'left' ? 'right' : player.dir;
  const img = sprites[sheetKey];
  const px = player.tileX * TILE + (TILE - PLAYER_W) / 2;
  const py = player.tileY * TILE + TILE - PLAYER_H;
  const sx = player.frame * FRAME_W;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (!img) {
    ctx.fillStyle = '#c8a052';
    ctx.fillRect(px, py, PLAYER_W, PLAYER_H);
  } else if (player.dir === 'left') {
    ctx.translate(px + PLAYER_W / 2, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, -PLAYER_W / 2, 0, PLAYER_W, PLAYER_H);
  } else {
    ctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, px, py, PLAYER_W, PLAYER_H);
  }

  ctx.restore();
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function tick() {
  handleInput();
  if (player.isMoving) {
    if (++player.animTimer >= ANIM_SPEED) { player.frame = (player.frame + 1) % FRAMES; player.animTimer = 0; }
  } else {
    player.frame = 1; player.animTimer = 0;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawPlayer();
  requestAnimationFrame(tick);
}

function startGame() {
  console.log('Sprites ready — starting game. Loaded sheets:', Object.entries(sprites).map(([k,v]) => k + ':' + (v ? 'OK' : 'MISSING')).join(', '));
  requestAnimationFrame(tick);
}
