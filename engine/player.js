// =============================================
//  engine/player.js
//  Player state, movement, sprite animation
//
//  Depends on: engine/map.js (MapSystem)
//  Exposes:    Player  (used by game.js)
// =============================================


// ── Sprite sheet constants ───────────────────────────────────────
//
//  The player sprite sheet (assets/sprites/player.png) is laid out as:
//
//      Col 0 (Idle)  Col 1 (Walk 1)  Col 2 (Walk 2)
//  Row 0  Down idle   Down walk 1     Down walk 2
//  Row 1  Left idle   Left walk 1     Left walk 2
//  Row 2  Right idle  Right walk 1    Right walk 2
//  Row 3  Up idle     Up walk 1       Up walk 2
//
const SPRITE_COLS = 3;    // frames per row
const SPRITE_ROWS = 4;    // directions

// Which sheet row corresponds to each direction
const DIR_ROW = {
  down:  0,
  left:  1,
  right: 2,
  up:    3,
};

// How many game-loop frames to show each animation frame
// Lower = faster walk cycle  (8 ≈ a brisk walk at 60fps)
const ANIM_SPEED = 8;


// ── Player object ────────────────────────────────────────────────
const Player = {

  // Position (tile coordinates — converted to pixels only when drawing)
  col: 0,
  row: 0,

  // Which way the player is facing
  direction: 'down',

  // Animation state
  animFrame:   0,   // which sprite column (0 = idle, 1–2 = walk frames)
  animTimer:   0,   // counts up to ANIM_SPEED, then advances animFrame
  isWalking:  false,

  // Prevents the player from sliding across tiles while a key is held.
  // Movement only happens on the frame a key is first pressed.
  isMoving: false,

  // The loaded Image object for the sprite sheet
  sprite: null,
  spriteReady: false,

  // ── Load the sprite sheet ──────────────────────────────────────
  loadSprite(path) {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteReady = true;

      // Calculate individual frame dimensions from the actual image size
      this.frameW = Math.floor(this.sprite.width  / SPRITE_COLS);
      this.frameH = Math.floor(this.sprite.height / SPRITE_ROWS);

      console.log(`Player sprite loaded. Frame size: ${this.frameW}×${this.frameH}px`);
    };
    this.sprite.onerror = () => {
      console.warn(`Player sprite not found at "${path}". Using placeholder.`);
    };
    this.sprite.src = path;
  },

  // ── Handle input and move ──────────────────────────────────────
  update(keys) {
    // Don't process a new move until the previous key is released
    if (this.isMoving) {
      this.isWalking = false;
      return;
    }

    let newCol = this.col;
    let newRow = this.row;
    let moving = false;

    if (keys['ArrowUp']    || keys['w'] || keys['W']) { newRow -= 1; this.direction = 'up';    moving = true; }
    if (keys['ArrowDown']  || keys['s'] || keys['S']) { newRow += 1; this.direction = 'down';  moving = true; }
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) { newCol -= 1; this.direction = 'left';  moving = true; }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { newCol += 1; this.direction = 'right'; moving = true; }

    if (moving && MapSystem.isTileWalkable(newCol, newRow)) {
      this.col = newCol;
      this.row = newRow;
      this.isMoving = true;
      this.isWalking = true;
    } else {
      this.isWalking = false;
    }

    // Advance the walk animation when moving
    if (this.isWalking) {
      this.animTimer++;
      if (this.animTimer >= ANIM_SPEED) {
        this.animTimer = 0;
        // Cycle through walk frames 1 → 2 → 1 → 2 ...
        this.animFrame = this.animFrame === 1 ? 2 : 1;
      }
    } else {
      // Return to idle frame when still
      this.animFrame = 0;
      this.animTimer = 0;
    }
  },

  // ── Draw the player ───────────────────────────────────────────
  draw(ctx) {
    // Pixel position of the top-left of this tile
    const px = this.col * TILE_SIZE;
    const py = this.row * TILE_SIZE;

    if (this.spriteReady) {
      this.drawSprite(ctx, px, py);
    } else {
      this.drawPlaceholder(ctx, px, py);
    }
  },

  // ── Sprite rendering ──────────────────────────────────────────
  drawSprite(ctx, px, py) {
    const srcCol = this.animFrame;
    const srcRow = DIR_ROW[this.direction];

    // Source rectangle — the specific frame on the sheet
    const srcX = srcCol * this.frameW;
    const srcY = srcRow * this.frameH;

    // Destination — draw the character slightly taller than one tile
    // so it has more visual presence. Centre it on the tile horizontally.
    const drawW = TILE_SIZE;
    const drawH = TILE_SIZE * 1.5;                 // 48px tall
    const drawX = px;
    const drawY = py - (drawH - TILE_SIZE);        // anchor feet to tile bottom

    ctx.drawImage(
      this.sprite,
      srcX, srcY, this.frameW, this.frameH,        // source (sheet)
      drawX, drawY, drawW, drawH                   // destination (canvas)
    );
  },

  // ── Placeholder (shown if sprite hasn't loaded yet) ──────────
  drawPlaceholder(ctx, px, py) {
    ctx.fillStyle = '#f0e080';
    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(px + 12, py + 12, 8, 8);
  },

};
