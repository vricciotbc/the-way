// ─── Constants ───────────────────────────────────────────────────────────────
const TILE       = 56;          // was 48 — bigger tiles, more zoomed-in feel
const VIEW_COLS  = 15;          // was 13 — wider viewport (15×56 = 840px)
const VIEW_ROWS  = 10;          // 10×56 = 560px
const MAP_COLS   = 26;          // was 22 — wider map to fill extra columns
const MAP_ROWS   = 16;

const FRAMES     = 3;
const FRAME_W    = 1428 / FRAMES;   // 476 — sprite sheet source unchanged
const FRAME_H    = 769;
const PLAYER_W   = 44;          // was 38 — scaled with tile (38 × 56/48 ≈ 44)
const PLAYER_H   = 70;          // was 60 — scaled with tile (60 × 56/48 = 70)
const ANIM_SPEED = 10;

// ─── Canvas ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = VIEW_COLS * TILE;   // 624
canvas.height = VIEW_ROWS * TILE;   // 480
ctx.imageSmoothingEnabled = false;

// ─── Tile Map ─────────────────────────────────────────────────────────────────
// 0 = stone path   1 = solid wall   2 = grass
// 3 = gate tower   4 = olive tree   5 = gate passage (shadowed arch)
// Road centred at cols 11-14.  Wide crowd section cols 9-16 (rows 9-12).
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  //  0 — top border
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  //  1 — city courtyard
  [1,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,1],  //  2
  [1,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,1],  //  3
  [3,3,3,3,3,3,3,3,3,3,3,5,5,5,5,3,3,3,3,3,3,3,3,3,3,3],  //  4 — wall + gate
  [3,3,3,3,3,3,3,3,3,3,3,5,5,5,5,3,3,3,3,3,3,3,3,3,3,3],  //  5
  [2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2],  //  6 — outside gate
  [2,2,4,2,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,4,2,2,2,2],  //  7 — olive trees
  [2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2],  //  8
  [2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2],  //  9 — crowd gathers
  [2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2],  // 10
  [2,2,4,2,2,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,4,2,2,2,2],  // 11 — more trees
  [2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2],  // 12 — player starts
  [2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2],  // 13
  [2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2],  // 14
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // 15 — bottom border
];

const SOLID = new Set([1, 3, 4]);

// ─── Tile Rendering Definitions ───────────────────────────────────────────────
const TILE_DEF = {
  0: { base: '#c2944a', accent: '#b08040' },   // stone path
  1: { base: '#7a6a52', accent: '#6a5a44' },   // solid wall
  2: { base: '#6a9944', accent: '#5d8c3a' },   // grass
  3: { base: '#9a8a6a', accent: '#7a6a50' },   // gate tower limestone
  4: { base: '#6a9944', accent: '#5d8c3a' },   // tree (grass base)
  5: { base: '#7a5e30', accent: '#6a4e28' },   // gate passage (shadowed)
};

// ─── NPCs ─────────────────────────────────────────────────────────────────────
const NPCS = [
  {
    id: 'disciple',
    tileX: 8, tileY: 7,
    type: 'disciple',
    // Finishing this conversation activates the palm branch challenge
    onDialogueEnd: () => activateChallenge('gather_palm'),
    dialogue: [
      { speaker: 'Disciple',
        text: 'Friend — take these palm branches. We must honor him as he enters. Go, line the road ahead.' },
      { speaker: 'Disciple',
        text: 'He comes riding on a young colt. Just as Zechariah wrote — your king comes gentle, riding on a donkey.' },
      { speaker: 'Disciple',
        text: 'A palm branch was dropped near the southern path. Lay it on the road for his coming.' },
    ]
  },
  {
    id: 'pharisee',
    tileX: 17, tileY: 6,
    type: 'pharisee',
    // Talking to the Pharisee activates the "spread your cloak" challenge
    // (only if gather_palm is already done — checked inside activateChallenge)
    onDialogueEnd: () => activateChallenge('spread_cloak'),
    dialogue: [
      { speaker: 'Pharisee',
        text: 'Do you see what these people are doing? This is dangerous. Rome watches everything that happens in this city.' },
      { speaker: 'Pharisee',
        text: 'Teacher — rebuke your disciples! If this crowd grows any larger, the whole city will suffer for it.' },
    ]
  },
  {
    id: 'crowd1',
    tileX: 7, tileY: 9,
    type: 'crowd',
    onDialogueEnd: null,
    dialogue: [
      { speaker: 'Crowd Member',
        text: 'Have you heard? They say he raised a man from the dead at Bethany — four days in the tomb.' },
      { speaker: 'Crowd Member',
        text: 'I have waited my whole life for a day like this. I do not fully understand it. But I had to be here.' },
    ]
  },
  {
    id: 'crowd2',
    tileX: 18, tileY: 10,
    type: 'crowd_f',
    onDialogueEnd: null,
    dialogue: [
      { speaker: 'Crowd Member',
        text: 'Hosanna! Blessed is he who comes in the name of the Lord! Blessed is the king of Israel!' },
      { speaker: 'Crowd Member',
        text: 'My children have been singing since dawn. Even they sense something is different about today.' },
    ]
  },
];

// ─── Items ────────────────────────────────────────────────────────────────────
const ITEMS = [
  { id: 'palm', tileX: 6, tileY: 11, name: 'Palm Branch', symbol: '🌿', collected: false }
];

const inventory = [];

// ─── Challenge System ─────────────────────────────────────────────────────────
// state: 'locked' | 'active' | 'done'
// completedBy:
//   { type:'item',    id }          → collecting an item
//   { type:'tile',    x, y }        → stepping on a specific tile
//   { type:'npc',     id }          → finishing dialogue with an NPC
const CHALLENGES = [
  {
    id:          'meet_disciple',
    label:       'Speak with the Disciple',
    state:       'active',          // active from the very start
    completedBy: { type: 'npc', id: 'disciple' },
  },
  {
    id:          'gather_palm',
    label:       'Gather the palm branch',
    state:       'locked',
    completedBy: { type: 'item', id: 'palm' },
  },
  {
    id:          'spread_cloak',
    label:       'Spread your cloak on the road',
    state:       'locked',
    completedBy: { type: 'tile', x: 12, y: 8 },  // just inside the gate
  },
  {
    id:          'witness_entry',
    label:       'Wait for Jesus at the gate',
    state:       'locked',
    completedBy: { type: 'tile', x: 12, y: 5 },  // inside gate passage
  },
];

function getChallenge(id) {
  return CHALLENGES.find(c => c.id === id);
}

// Activate a challenge (won't re-activate if already active/done,
// and won't activate if its prerequisite isn't done yet)
function activateChallenge(id) {
  const ch = getChallenge(id);
  if (!ch || ch.state !== 'locked') return;

  // Prerequisite map — a challenge only unlocks after the previous one is done
  const prereqs = {
    gather_palm:   'meet_disciple',
    spread_cloak:  'gather_palm',
    witness_entry: 'spread_cloak',
  };
  const pre = prereqs[id];
  if (pre && getChallenge(pre)?.state !== 'done') return;

  ch.state = 'active';
  showNotify('📜  New objective: ' + ch.label, 220);
}

function completeChallenge(id) {
  const ch = getChallenge(id);
  if (!ch || ch.state !== 'active') return;
  ch.state = 'done';
  showNotify('✦  Completed: ' + ch.label, 180);

  // Chain: completing one challenge may unlock the next
  const chains = {
    meet_disciple: 'gather_palm',
    // gather_palm → spread_cloak is chained via Pharisee dialogue
    spread_cloak:  'witness_entry',
  };
  const next = chains[id];
  if (next) activateChallenge(next);
}
const dialogue = {
  active:    false,
  lines:     [],
  lineIndex: 0,
  get current() { return this.lines[this.lineIndex] || null; },
};

// ─── Notification ─────────────────────────────────────────────────────────────
const notify = { text: '', timer: 0 };

function showNotify(text, duration) {
  notify.text  = text;
  notify.timer = duration || 160;
}

// ─── Player ───────────────────────────────────────────────────────────────────
const player = {
  tileX: 12, tileY: 12,
  dir: 'front', frame: 1,
  animTimer: 0, isMoving: false,
};

// ─── Camera ───────────────────────────────────────────────────────────────────
const cam = { x: 0, y: 0 };

function updateCamera() {
  const tx  = player.tileX * TILE + TILE / 2 - canvas.width  / 2;
  const ty  = player.tileY * TILE + TILE / 2 - canvas.height / 2;
  const mxX = MAP_COLS * TILE - canvas.width;
  const mxY = MAP_ROWS * TILE - canvas.height;
  cam.x = Math.max(0, Math.min(tx, mxX));
  cam.y = Math.max(0, Math.min(ty, mxY));
}

// ─── Asset Paths ─────────────────────────────────────────────────────────────
// Player sprites and pharisee are embedded in sprites.js (works via double-click).
// Tile images load from assets/tiles/ — they fall back to procedural drawing
// if not present, so the game always works. GitHub Pages serves them fine.
const ASSET = {
  tiles: {
    cobblestone: 'assets/tiles/cobblestone.png',   // tile type 0
    grass:       'assets/tiles/grass.png',          // tile type 2
    wall:        'assets/tiles/wall.png',           // tile type 3
    wallBorder:  'assets/tiles/wall-border.png',    // tile type 1
    gateShadow:  'assets/tiles/gate-shadow.png',    // tile type 5
    courtyard:   'assets/tiles/courtyard.png',      // courtyard floor
    oliveTree:   'assets/tiles/olive-tree.png',     // tile type 4
  }
};

// ─── Sprites ──────────────────────────────────────────────────────────────────
const sprites    = { front: null, back: null, right: null };
const npcSprites = { pharisee: null };
const tileImgs   = {};   // populated from assets/tiles/ — null = procedural fallback

let loadedCount = 0;
const PLAYER_SPRITE_COUNT = 3;

function loadSprite(dir, src) {
  const img = new Image();
  img.onload  = () => { sprites[dir] = img; if (++loadedCount === PLAYER_SPRITE_COUNT) startGame(); };
  img.onerror = () => { console.warn('Player sprite failed:', dir); if (++loadedCount === PLAYER_SPRITE_COUNT) startGame(); };
  img.src = src;
}

function loadNPCSprite(key, src) {
  const img = new Image();
  img.onload  = () => { npcSprites[key] = img; };
  img.onerror = () => { /* falls back to procedural NPC drawing */ };
  img.src = src;
}

function loadTileImg(key, path) {
  const img = new Image();
  img.onload  = () => { tileImgs[key] = img; };
  img.onerror = () => { /* tile not ready — procedural fallback active */ };
  img.src = path;
}

// Player sprites: from sprites.js (embedded base64 — works offline)
loadSprite('front', SPRITE_FRONT);
loadSprite('back',  SPRITE_BACK);
loadSprite('right', SPRITE_RIGHT);

// Pharisee: from sprites.js (embedded base64)
loadNPCSprite('pharisee', SPRITE_PHARISEE);

// Tile images: from assets/tiles/ — replace placeholders with Gemini PNGs
// Works on GitHub Pages; falls back to procedural drawing locally
Object.entries(ASSET.tiles).forEach(([key, path]) => loadTileImg(key, path));

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};

document.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if ((e.key === 'e' || e.key === 'E') && !keys._eLocked) {
    keys._eLocked = true;
    handleInteract();
  }
  keys[e.key] = true;
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
  if (e.key === 'e' || e.key === 'E') keys._eLocked = false;
});

function handleInteract() {
  if (dialogue.active) {
    dialogue.lineIndex++;
    if (dialogue.lineIndex >= dialogue.lines.length) {
      dialogue.active = false;
      // Fire the NPC's end-of-dialogue hook
      if (dialogue.sourceNPC) {
        // Complete any challenge that's waiting on talking to this NPC
        const npcChallenge = CHALLENGES.find(
          c => c.state === 'active' && c.completedBy.type === 'npc' && c.completedBy.id === dialogue.sourceNPC.id
        );
        if (npcChallenge) completeChallenge(npcChallenge.id);
        // Then fire the NPC's own trigger (which may activate the next challenge)
        if (dialogue.sourceNPC.onDialogueEnd) dialogue.sourceNPC.onDialogueEnd();
        dialogue.sourceNPC = null;
      }
    }
    return;
  }
  const npc = getNearbyNPC();
  if (npc) {
    dialogue.active    = true;
    dialogue.lines     = npc.dialogue;
    dialogue.lineIndex = 0;
    dialogue.sourceNPC = npc;   // remember who we're talking to
  }
}

// ─── Collision ────────────────────────────────────────────────────────────────
function isSolid(x, y) {
  if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return true;
  if (SOLID.has(MAP[y][x])) return true;
  for (const npc of NPCS) {
    if (npc.tileX === x && npc.tileY === y) return true;
  }
  return false;
}

function getNearbyNPC() {
  const adj = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
  for (const npc of NPCS) {
    for (const d of adj) {
      if (player.tileX + d.dx === npc.tileX && player.tileY + d.dy === npc.tileY) return npc;
    }
  }
  return null;
}

// ─── Movement ─────────────────────────────────────────────────────────────────
let moveDelay = 0;

function handleInput() {
  if (dialogue.active) { player.isMoving = false; return; }

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
  if (!isSolid(nx, ny)) {
    player.tileX = nx;
    player.tileY = ny;
    player.isMoving = true;
    checkItemCollection();
    checkTileChallenges();
  }

  moveDelay = (moveDelay < 0) ? 14 : 8;
}

function checkItemCollection() {
  for (const item of ITEMS) {
    if (!item.collected && item.tileX === player.tileX && item.tileY === player.tileY) {
      item.collected = true;
      inventory.push(item);
      showNotify('You picked up ' + item.symbol + ' ' + item.name + '!');
      // Complete any active challenge waiting on this item
      const ch = CHALLENGES.find(c => c.state === 'active' && c.completedBy.type === 'item' && c.completedBy.id === item.id);
      if (ch) completeChallenge(ch.id);
    }
  }
}

function checkTileChallenges() {
  for (const ch of CHALLENGES) {
    if (ch.state === 'active' && ch.completedBy.type === 'tile') {
      if (ch.completedBy.x === player.tileX && ch.completedBy.y === player.tileY) {
        completeChallenge(ch.id);
      }
    }
  }
}

// ─── Draw: Tiles ──────────────────────────────────────────────────────────────
// Each tile type checks for a loaded image first.
// If the PNG isn't in assets/tiles/ yet, it falls back to procedural drawing.
// This means you can drop Gemini tiles in one at a time — the game always works.

const TILE_IMG_KEY = {
  0: 'cobblestone',
  1: 'wallBorder',
  2: 'grass',
  3: 'wall',
  4: 'oliveTree',
  5: 'gateShadow',
};

function drawTileImage(imgKey, sx, sy) {
  const img = tileImgs[imgKey];
  if (!img) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, TILE, TILE);
  ctx.restore();
  return true;
}

function drawTile(c, r, sx, sy) {
  const type   = MAP[r][c];
  const imgKey = TILE_IMG_KEY[type];
  const def    = TILE_DEF[type] ?? TILE_DEF[2];

  // Always paint base color first (prevents gaps during load)
  ctx.fillStyle = def.base;
  ctx.fillRect(sx, sy, TILE, TILE);

  // Try image tile — if loaded, draw it and we're done
  if (imgKey && drawTileImage(imgKey, sx, sy)) return;

  // ── Procedural fallback ───────────────────────────────────────────────────
  switch (type) {

    case 0: // Stone path — cobblestone cross-hatch
      ctx.strokeStyle = def.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + TILE/2, sy);    ctx.lineTo(sx + TILE/2, sy + TILE);
      ctx.moveTo(sx, sy + TILE/2);    ctx.lineTo(sx + TILE, sy + TILE/2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.strokeRect(sx, sy, TILE, TILE);
      break;

    case 1: // Solid wall — inner bevel
      ctx.fillStyle = def.accent;
      ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(sx, sy, TILE, 3);
      ctx.fillRect(sx, sy, 3, TILE);
      break;

    case 2: // Grass — subtle blade strokes
      ctx.fillStyle = def.accent;
      ctx.fillRect(sx + 6,  sy + 10, 2, 8);
      ctx.fillRect(sx + 14, sy + 20, 2, 6);
      ctx.fillRect(sx + 28, sy + 8,  2, 10);
      ctx.fillRect(sx + 38, sy + 24, 2, 7);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, TILE, TILE);
      break;

    case 3: { // Gate tower — limestone masonry
      ctx.fillStyle = def.accent;
      ctx.fillRect(sx, sy + 16, TILE, 2);
      ctx.fillRect(sx, sy + 32, TILE, 2);
      if (r % 2 === 0) {
        ctx.fillRect(sx + 16, sy,      2, 16);
        ctx.fillRect(sx + 32, sy + 16, 2, 16);
        ctx.fillRect(sx + 16, sy + 32, 2, 16);
      } else {
        ctx.fillRect(sx + 8,  sy,      2, 16);
        ctx.fillRect(sx + 32, sy,      2, 16);
        ctx.fillRect(sx + 20, sy + 16, 2, 16);
        ctx.fillRect(sx + 8,  sy + 32, 2, 16);
        ctx.fillRect(sx + 40, sy + 32, 2, 16);
      }
      ctx.fillStyle = 'rgba(255,240,200,0.11)';
      ctx.fillRect(sx, sy, TILE, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(sx + TILE - 3, sy, 3, TILE);
      ctx.fillRect(sx, sy + TILE - 3, TILE, 3);
      break;
    }

    case 4: { // Olive tree — layered foliage over grass base
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(sx + 20, sy + 28, 8, 20);
      ctx.fillStyle = '#5a3e1a';
      ctx.fillRect(sx + 22, sy + 28, 3, 20);
      ctx.fillStyle = '#3a6e2f';
      ctx.fillRect(sx + 8,  sy + 18, 32, 18);
      ctx.fillStyle = '#4a8a3a';
      ctx.fillRect(sx + 12, sy + 10, 24, 14);
      ctx.fillStyle = '#5a9a46';
      ctx.fillRect(sx + 16, sy + 4,  16, 10);
      ctx.fillStyle = '#70b060';
      ctx.fillRect(sx + 20, sy + 6,  6, 4);
      ctx.fillRect(sx + 14, sy + 14, 4, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(sx + 8,  sy + 18, 6, 18);
      ctx.fillRect(sx + 34, sy + 18, 6, 18);
      ctx.fillStyle = '#2a5a20';
      ctx.fillRect(sx + 16, sy + 20, 3, 3);
      ctx.fillRect(sx + 28, sy + 24, 3, 3);
      ctx.fillRect(sx + 22, sy + 16, 3, 3);
      break;
    }

    case 5: { // Gate passage — shadowed cobblestone
      ctx.fillStyle = def.accent;
      ctx.fillRect(sx,        sy,        TILE/2, TILE/2);
      ctx.fillRect(sx+TILE/2, sy+TILE/2, TILE/2, TILE/2);
      ctx.strokeStyle = '#5a3e1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + TILE/2, sy);    ctx.lineTo(sx + TILE/2, sy + TILE);
      ctx.moveTo(sx, sy + TILE/2);    ctx.lineTo(sx + TILE, sy + TILE/2);
      ctx.stroke();
      ctx.fillStyle = r === 4 ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.24)';
      ctx.fillRect(sx, sy, TILE, TILE);
      break;
    }
  }
}

// ─── Draw: Map ────────────────────────────────────────────────────────────────
function drawMap() {
  const sc = Math.floor(cam.x / TILE);
  const sr = Math.floor(cam.y / TILE);
  const ec = Math.min(MAP_COLS - 1, sc + VIEW_COLS + 1);
  const er = Math.min(MAP_ROWS - 1, sr + VIEW_ROWS + 1);
  for (let r = sr; r <= er; r++) {
    for (let c = sc; c <= ec; c++) {
      drawTile(c, r, c * TILE - cam.x, r * TILE - cam.y);
    }
  }
}

// ─── Draw: Gate Arch Overlay ──────────────────────────────────────────────────
// Drawn after tiles, before entities — a decorative stone arch over the gate opening.
function drawGateArch() {
  const x = 11 * TILE - cam.x;   // left edge of gate opening (cols 11-14)
  const y = 4  * TILE - cam.y;   // top of wall row 4
  const w = 4  * TILE;           // 192px wide (4 tiles)
  const h = 2  * TILE;           // 96px tall (2 tile rows)

  if (x > canvas.width || x + w < 0 || y > canvas.height || y + h < 0) return;

  // ── Arch voussoir stones (pixel-art stepped curve) ────────────────────────
  ctx.fillStyle = '#c8b890';

  // Keystone — dead center
  ctx.fillRect(x + w/2 - 9, y - 6, 18, 14);

  // Left voussoirs (stairstepped outward)
  ctx.fillRect(x + 4,  y - 4, 24, 10);
  ctx.fillRect(x + 2,  y + 6, 20,  8);
  ctx.fillRect(x,      y +14, 14,  8);

  // Right voussoirs (mirrored)
  ctx.fillRect(x + w - 28, y - 4, 24, 10);
  ctx.fillRect(x + w - 22, y + 6, 20,  8);
  ctx.fillRect(x + w - 14, y +14, 14,  8);

  // ── Pillar returns (sides of the arch opening) ────────────────────────────
  ctx.fillStyle = '#a89060';
  ctx.fillRect(x, y, 4, h);
  ctx.fillRect(x + w - 4, y, 4, h);

  // Mortar lines on pillars
  ctx.fillStyle = '#907848';
  ctx.fillRect(x, y + 24, 4, 1);
  ctx.fillRect(x, y + 48, 4, 1);
  ctx.fillRect(x, y + 72, 4, 1);
  ctx.fillRect(x + w - 4, y + 24, 4, 1);
  ctx.fillRect(x + w - 4, y + 48, 4, 1);
  ctx.fillRect(x + w - 4, y + 72, 4, 1);

  // ── Arch shadow (radiating downward from the curve) ───────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(x + 4, y, w - 8, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(x + 4, y + 10, w - 8, 12);

  // ── Top sunlit highlight ──────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,245,210,0.22)';
  ctx.fillRect(x, y - 6, w, 3);
}

// ─── Draw: Ground Items ───────────────────────────────────────────────────────
function drawItems() {
  const t = Date.now();
  for (const item of ITEMS) {
    if (item.collected) continue;
    const sx = item.tileX * TILE - cam.x;
    const sy = item.tileY * TILE - cam.y;
    if (sx < -TILE || sx > canvas.width || sy < -TILE || sy > canvas.height) continue;

    // Pulsing glow
    const pulse = Math.sin(t / 480) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(100, 220, 80, ${0.12 + pulse * 0.16})`;
    ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);

    // Palm frond — pixel art (origin at sx+10, sy+6)
    const px = sx + 10, py = sy + 6;
    ctx.fillStyle = '#4a8a2a';
    // Central stem
    ctx.fillRect(px + 10, py + 12, 3, 22);
    // Left fronds (4 pairs)
    ctx.fillRect(px,     py + 6,  12, 3);
    ctx.fillRect(px + 2, py + 11, 10, 3);
    ctx.fillRect(px + 4, py + 16,  8, 3);
    ctx.fillRect(px + 6, py + 21,  5, 3);
    // Right fronds
    ctx.fillRect(px + 13, py + 6,  12, 3);
    ctx.fillRect(px + 13, py + 11, 10, 3);
    ctx.fillRect(px + 13, py + 16,  8, 3);
    ctx.fillRect(px + 13, py + 21,  5, 3);
    // Brighter frond tips
    ctx.fillStyle = '#6ab040';
    ctx.fillRect(px,      py + 6,  3, 3);
    ctx.fillRect(px + 22, py + 6,  3, 3);
    ctx.fillRect(px + 2,  py + 11, 3, 3);
    ctx.fillRect(px + 20, py + 11, 3, 3);

    // Sparkle corner dots
    ctx.fillStyle = `rgba(160,255,100,${pulse * 0.9})`;
    ctx.fillRect(sx + 6,  sy + 6,  3, 3);
    ctx.fillRect(sx + 39, sy + 18, 3, 3);
    ctx.fillRect(sx + 10, sy + 38, 3, 3);
  }
}

// ─── Draw: NPC Sprite ─────────────────────────────────────────────────────────
// Image-based NPCs (from sprites.js) use their loaded Image object.
// Procedural NPCs fall back to the pixel-art drawing code.
const NPC_IMG_KEYS = { pharisee: 'pharisee' }; // npc.type → npcSprites key

// Dimensions for image-based NPC sprites (source image is 64×78)
const NPC_IMG_W = 64, NPC_IMG_H = 78;

function drawNPCSprite(sx, sy, type) {
  // ── Image-based path ─────────────────────────────────────────────────────
  const imgKey = NPC_IMG_KEYS[type];
  if (imgKey && npcSprites[imgKey]) {
    const img = npcSprites[imgKey];
    // Scale to fit within TILE height, keep aspect ratio
    const scale  = (TILE * 1.1) / NPC_IMG_H;
    const drawW  = Math.round(NPC_IMG_W * scale);
    const drawH  = Math.round(NPC_IMG_H * scale);
    // Centre horizontally on tile, feet at tile bottom
    const drawX  = sx + Math.floor((TILE - drawW) / 2);
    const drawY  = sy + TILE - drawH;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
    return;
  }

  // ── Procedural fallback (crowd, crowd_f, disciple) ────────────────────────
  const palettes = {
    crowd: {
      skin: '#d4956a', hair: '#3a2010',
      robe: '#c4a878', shadow: '#a08858', hi: '#d8c09a',
    },
    crowd_f: {
      skin: '#c8906a', hair: '#2a1808',
      robe: '#d0c09a', shadow: '#aca07a', hi: '#ddd0b0',
    },
    disciple: {
      skin: '#c89060', hair: '#251505',
      robe: '#6888b0', shadow: '#486090', hi: '#88a8d0',
    },
  };

  const p = palettes[type] || palettes.crowd;
  const W = 22, H = 40;
  const x = sx + Math.floor((TILE - W) / 2);
  const y = sy + TILE - H;

  // ── Sandals ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#8b6030';
  ctx.fillRect(x + 2,     y + H - 5, 7, 5);
  ctx.fillRect(x + W - 9, y + H - 5, 7, 5);
  ctx.fillStyle = '#6a4820';
  ctx.fillRect(x + 4,     y + H - 3, 3, 2);
  ctx.fillRect(x + W - 7, y + H - 3, 3, 2);

  // ── Robe skirt ────────────────────────────────────────────────────────────
  ctx.fillStyle = p.shadow;
  ctx.fillRect(x, y + H - 16, W, 11);
  ctx.fillStyle = p.robe;
  ctx.fillRect(x + 1, y + H - 16, W - 2, 10);
  ctx.fillStyle = p.shadow;
  ctx.fillRect(x + 2, y + H - 20, W - 4, 2);

  // ── Robe body ─────────────────────────────────────────────────────────────
  ctx.fillStyle = p.robe;
  ctx.fillRect(x + 3, y + 12, W - 6, 16);
  ctx.fillStyle = p.hi;
  ctx.fillRect(x + 4, y + 12, 3, 14);
  ctx.fillStyle = p.shadow;
  ctx.fillRect(x + W - 7, y + 12, 3, 16);

  // ── Arms + hands ─────────────────────────────────────────────────────────
  ctx.fillStyle = p.robe;
  ctx.fillRect(x,         y + 13, 3, 11);
  ctx.fillRect(x + W - 3, y + 13, 3, 11);
  ctx.fillStyle = p.skin;
  ctx.fillRect(x,         y + 22, 3, 3);
  ctx.fillRect(x + W - 3, y + 22, 3, 3);

  // ── Neck + head ───────────────────────────────────────────────────────────
  ctx.fillStyle = p.skin;
  ctx.fillRect(x + 9, y + 10, 4, 4);
  ctx.fillRect(x + 7, y + 1,  8, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x + 7, y + 8,  8, 3);

  // ── Hair ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = p.hair;
  ctx.fillRect(x + 7, y + 1, 8, 3);
  ctx.fillRect(x + 7, y,     2, 3);
  ctx.fillRect(x + 13, y,    2, 3);

  // ── Eyes ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a0800';
  ctx.fillRect(x + 9,  y + 5, 1, 2);
  ctx.fillRect(x + 12, y + 5, 1, 2);
  ctx.fillStyle = 'rgba(255,255,240,0.6)';
  ctx.fillRect(x + 9,  y + 5, 1, 1);
  ctx.fillRect(x + 12, y + 5, 1, 1);

  // ── Type-specific ─────────────────────────────────────────────────────────
  if (type === 'crowd_f') {
    ctx.fillStyle = '#b09a78';
    ctx.fillRect(x + 5, y, 12, 5);
    ctx.fillStyle = '#a08a68';
    ctx.fillRect(x + 5, y + 5, 3, 9);
    ctx.fillRect(x + 14, y + 5, 3, 9);
  }
  if (type === 'disciple') {
    ctx.fillStyle = '#8a6030';
    ctx.fillRect(x + 3, y + 24, W - 6, 2);
  }
}

// ─── Draw: All Entities (z-sorted by tileY) ───────────────────────────────────
function drawEntities() {
  // Build entity list with unified tileY for sorting
  const entities = [
    ...NPCS.map(npc => ({ kind: 'npc', ref: npc, tileY: npc.tileY })),
    { kind: 'player', ref: player, tileY: player.tileY }
  ].sort((a, b) => a.tileY - b.tileY);

  for (const e of entities) {
    if (e.kind === 'npc') {
      const { tileX, tileY, type } = e.ref;
      const sx = tileX * TILE - cam.x;
      const sy = tileY * TILE - cam.y;
      if (sx >= -TILE && sx <= canvas.width && sy >= -TILE && sy <= canvas.height) {
        drawNPCSprite(sx, sy, type);
      }
    } else {
      drawPlayer();
    }
  }
}

// ─── Draw: Player ─────────────────────────────────────────────────────────────
function drawPlayer() {
  const sheetKey = (player.dir === 'left') ? 'right' : player.dir;
  const img = sprites[sheetKey];
  const sx  = player.tileX * TILE - cam.x + (TILE - PLAYER_W) / 2;
  const sy  = player.tileY * TILE - cam.y + TILE - PLAYER_H;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (!img) {
    ctx.fillStyle = '#c8a052';
    ctx.fillRect(sx, sy, PLAYER_W, PLAYER_H);
  } else if (player.dir === 'left') {
    ctx.translate(sx + PLAYER_W / 2, sy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, player.frame * FRAME_W, 0, FRAME_W, FRAME_H,
                  -PLAYER_W / 2, 0, PLAYER_W, PLAYER_H);
  } else {
    ctx.drawImage(img, player.frame * FRAME_W, 0, FRAME_W, FRAME_H,
                  sx, sy, PLAYER_W, PLAYER_H);
  }
  ctx.restore();
}

// ─── Draw: Interact Prompt ────────────────────────────────────────────────────
function drawInteractPrompt() {
  if (dialogue.active) return;
  const npc = getNearbyNPC();
  if (!npc) return;

  const bob = Math.sin(Date.now() / 380) * 2.5;
  const cx  = npc.tileX * TILE - cam.x + TILE / 2;
  const cy  = npc.tileY * TILE - cam.y - 8 - bob;

  ctx.font = 'bold 11px "Courier New", monospace';
  const label = '[ E ]';
  const tw = ctx.measureText(label).width;

  ctx.fillStyle = 'rgba(8,4,0,0.82)';
  ctx.fillRect(cx - tw/2 - 8, cy - 15, tw + 16, 16);

  ctx.strokeStyle = 'rgba(232,192,70,0.65)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw/2 - 8, cy - 15, tw + 16, 16);

  ctx.fillStyle = '#e8c840';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy);
  ctx.textAlign = 'left';
}

// ─── Draw: Dialogue Box ───────────────────────────────────────────────────────
function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawDialogue() {
  if (!dialogue.active || !dialogue.current) return;

  const { speaker, text } = dialogue.current;
  const bH = 118, bY = canvas.height - bH - 8;
  const bX = 8,   bW = canvas.width  - 16;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(bX + 3, bY + 3, bW, bH);

  // Background
  ctx.fillStyle = 'rgba(10,6,2,0.95)';
  ctx.fillRect(bX, bY, bW, bH);

  // Outer border (gold)
  ctx.strokeStyle = '#c89a48';
  ctx.lineWidth = 2;
  ctx.strokeRect(bX, bY, bW, bH);

  // Inner border (subtle)
  ctx.strokeStyle = 'rgba(200,154,72,0.26)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bX + 5, bY + 5, bW - 10, bH - 10);

  // Speaker name
  ctx.fillStyle = '#e8c060';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText(speaker, bX + 14, bY + 22);

  // Divider line under name
  ctx.strokeStyle = 'rgba(200,154,72,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bX + 14, bY + 27);
  ctx.lineTo(bX + bW - 14, bY + 27);
  ctx.stroke();

  // Dialogue text (word-wrapped)
  const bodyFont = '13px "Courier New", monospace';
  const lines = wrapText(text, bW - 28, bodyFont);
  ctx.font = bodyFont;
  ctx.fillStyle = '#f0e8d4';
  lines.forEach((ln, i) => ctx.fillText(ln, bX + 14, bY + 46 + i * 19));

  // Flashing "continue" hint
  if (Math.floor(Date.now() / 580) % 2 === 0) {
    ctx.fillStyle = 'rgba(200,154,70,0.72)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[ E ] Continue', bX + bW - 14, bY + bH - 10);
    ctx.textAlign = 'left';
  }
}

// ─── UI: HTML Sidebar ─────────────────────────────────────────────────────────
// All persistent UI (objectives, inventory, progress, stage info) lives in the
// HTML sidebar. Only transient overlays (dialogue, toast) stay on the canvas.

const STAGE_NAMES = [
  'Palm Sunday', 'Temple Cleansing', 'Last Supper', 'Gethsemane',
  'Good Friday', 'Easter', 'Road to Emmaus', 'Pentecost'
];
const TOTAL_STAGES = 8;
const CURRENT_STAGE_INDEX = 0; // Stage 1 = index 0

// All 8 inventory slots (null = empty/locked)
const INV_SLOTS = [
  { icon: '🌿', name: 'Palm Branch',  stageIndex: 0 },
  { icon: '🪙', name: 'Coin',         stageIndex: 1 },
  { icon: '🍞', name: 'Bread',        stageIndex: 2 },
  { icon: '🫒', name: 'Olive Branch', stageIndex: 3 },
  { icon: '🪬', name: 'Shroud',       stageIndex: 4 },
  { icon: '🪡', name: 'Linen',        stageIndex: 5 },
  { icon: '🪵', name: 'Staff',        stageIndex: 6 },
  { icon: '🔥', name: 'Flame',        stageIndex: 7 },
];

function initUI() {
  // Stage dots
  const dotsEl = document.getElementById('stage-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < TOTAL_STAGES; i++) {
    const d = document.createElement('div');
    d.className = 'sdot' + (i < CURRENT_STAGE_INDEX ? ' done' : i === CURRENT_STAGE_INDEX ? ' active' : '');
    d.title = STAGE_NAMES[i];
    dotsEl.appendChild(d);
  }

  // Inventory slots — all 8, locked until reached
  const invEl = document.getElementById('ui-inventory');
  invEl.innerHTML = '';
  INV_SLOTS.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'inv-slot locked';
    div.id = 'inv-slot-' + i;
    // Will be filled/unlocked by updateUI
    invEl.appendChild(div);
  });

  // Initial objectives render
  updateUI();
}

let _lastUIHash = '';

function updateUI() {
  // ── Progress bar ───────────────────────────────────────────────────────────
  const done    = CHALLENGES.filter(c => c.state === 'done').length;
  const total   = CHALLENGES.length;
  const pct     = total ? Math.round((done / total) * 100) : 0;
  const fillEl  = document.getElementById('ui-progress');
  if (fillEl) fillEl.style.width = pct + '%';

  // ── Objectives list ────────────────────────────────────────────────────────
  // Only re-render if something actually changed (avoid DOM thrash every tick)
  const hash = CHALLENGES.map(c => c.id + ':' + c.state).join('|');
  if (hash === _lastUIHash) return;
  _lastUIHash = hash;

  const objEl = document.getElementById('ui-objectives');
  if (objEl) {
    objEl.innerHTML = '';
    CHALLENGES.forEach(ch => {
      const li = document.createElement('li');
      li.className = 'obj-item ' + ch.state;

      const check = document.createElement('div');
      check.className = 'obj-check';
      check.textContent = ch.state === 'done' ? '✓' : '';

      const label = document.createElement('div');
      label.className = 'obj-text';
      label.textContent = ch.label;

      li.appendChild(check);
      li.appendChild(label);
      objEl.appendChild(li);
    });
  }

  // ── Inventory slots ────────────────────────────────────────────────────────
  INV_SLOTS.forEach((slot, i) => {
    const el = document.getElementById('inv-slot-' + i);
    if (!el) return;

    const collected = inventory.some(item => item.name === slot.name);
    const isCurrent = slot.stageIndex === CURRENT_STAGE_INDEX;

    if (collected) {
      // Already filled — only update if not already rendered
      if (!el.classList.contains('filled')) {
        el.className = 'inv-slot filled flash';
        el.innerHTML = `
          <span class="slot-icon">${slot.icon}</span>
          <span class="slot-name">${slot.name}</span>
          <div class="slot-tip">${slot.name}</div>
        `;
        // Remove flash class after animation
        setTimeout(() => el.classList.remove('flash'), 700);
      }
    } else if (isCurrent) {
      // Current stage: show as empty (available to collect)
      el.className = 'inv-slot empty';
      el.innerHTML = `<span class="slot-name">—</span>`;
    } else {
      // Future stage: locked
      el.className = 'inv-slot locked';
      el.innerHTML = '';
    }
  });

  // ── Key moment card ────────────────────────────────────────────────────────
  const allDone    = CHALLENGES.every(c => c.state === 'done');
  const iconEl     = document.getElementById('ui-moment-icon');
  const nameEl     = document.getElementById('ui-moment-name');
  const hintEl     = document.getElementById('ui-moment-hint');

  if (iconEl && allDone) {
    iconEl.classList.add('unlocked');
    nameEl.classList.add('unlocked');
    hintEl.classList.add('unlocked');
    hintEl.textContent = 'Witnessed ✦';
  } else if (hintEl) {
    const remaining = CHALLENGES.filter(c => c.state !== 'done').length;
    hintEl.textContent = remaining === CHALLENGES.length
      ? 'Complete all objectives'
      : remaining + ' objective' + (remaining !== 1 ? 's' : '') + ' remaining';
  }
}

// ─── Draw: Notification Toast ─────────────────────────────────────────────────
function drawNotify() {
  if (notify.timer <= 0) return;

  const alpha = Math.min(1, notify.timer / 28);
  const w = 312, h = 34;
  const x = (canvas.width  - w) / 2;
  const y = (canvas.height / 2) - 70;

  ctx.fillStyle = `rgba(6,3,0,${alpha * 0.90})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `rgba(200,160,70,${alpha})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = `rgba(240,232,208,${alpha})`;
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(notify.text, canvas.width / 2, y + 22);
  ctx.textAlign = 'left';

  notify.timer--;
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
function tick() {
  handleInput();
  updateCamera();

  // Walk animation
  if (player.isMoving) {
    if (++player.animTimer >= ANIM_SPEED) {
      player.frame    = (player.frame + 1) % FRAMES;
      player.animTimer = 0;
    }
  } else {
    player.frame    = 1;
    player.animTimer = 0;
  }

  // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawGateArch();
  drawItems();
  drawEntities();
  drawInteractPrompt();
  drawDialogue();
  drawNotify();
  updateUI();   // sync HTML sidebar

  requestAnimationFrame(tick);
}

function startGame() {
  initUI();
  updateCamera();
  requestAnimationFrame(tick);
}
