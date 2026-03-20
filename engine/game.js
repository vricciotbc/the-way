// =============================================
//  engine/game.js
//  Canvas setup, input handling, main game loop
//
//  This file is the entry point that ties
//  everything together. It runs last.
//
//  Load order (see index.html):
//    data/tiles.js → data/maps.js →
//    engine/map.js → engine/player.js →
//    engine/game.js  ← you are here
// =============================================


// ── 1. CONSTANTS ─────────────────────────────────────────────────
// TILE_SIZE is the one constant shared by every engine file
const TILE_SIZE = 32;


// ── 2. CANVAS ────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Crisp pixel rendering — important for pixel art
ctx.imageSmoothingEnabled = false;


// ── 3. INPUT ──────────────────────────────────────────────────────
// A simple dictionary of which keys are currently held down.
// player.js reads from this every frame.
const keys = {};

document.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();   // prevent page scrolling
  }
  keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  Player.isMoving = false;   // allow the next step once the key is released
});


// ── 4. GAME LOOP ──────────────────────────────────────────────────
function gameLoop() {
  // 1. Update logic
  Player.update(keys);

  // 2. Render
  MapSystem.draw(ctx);    // draw tiles first (background)
  Player.draw(ctx);       // draw player on top

  // 3. Schedule next frame (~60fps)
  requestAnimationFrame(gameLoop);
}


// ── 5. START ──────────────────────────────────────────────────────
// Load the first map — this sets the canvas size and player spawn
MapSystem.load('outsideGates', canvas);

// Place the player at the map's start position
Player.col = MapSystem.current.start.col;
Player.row = MapSystem.current.start.row;

// Load the player sprite sheet
// Path is relative to index.html
Player.loadSprite('assets/sprites/player.png');

// Go!
gameLoop();
