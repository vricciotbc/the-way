// =============================================
//  engine/map.js
//  Map loading, rendering, and collision
//
//  Depends on: data/tiles.js (TILES, getTile)
//              data/maps.js  (MAPS)
//  Exposes:    MapSystem  (used by game.js and player.js)
// =============================================

const MapSystem = {

  // The currently loaded map object
  current: null,

  // ── Load a map by key ─────────────────────────────────────────
  // Looks up the map in MAPS, resizes the canvas, updates the HUD.
  // Returns the map object (or null on failure).
  load(mapKey, canvas) {
    const map = MAPS[mapKey];
    if (!map) {
      console.error(`MapSystem: map "${mapKey}" not found in MAPS.`);
      return null;
    }

    this.current = map;

    // Resize the canvas to exactly fit this map
    canvas.width  = map.cols * TILE_SIZE;
    canvas.height = map.rows * TILE_SIZE;

    // Update the HUD label
    const label = document.getElementById('map-name');
    if (label) label.textContent = map.name;

    console.log(`MapSystem: loaded "${map.name}"`);
    return map;
  },

  // ── Collision check ───────────────────────────────────────────
  // Returns true if the player is allowed to step on (col, row).
  isTileWalkable(col, row) {
    const map = this.current;
    if (!map) return false;

    // Bounds check
    if (col < 0 || col >= map.cols) return false;
    if (row < 0 || row >= map.rows) return false;

    // Walkability from the tile registry
    const tileId = map.grid[row][col];
    return getTile(tileId).walkable;
  },

  // ── Draw all tiles ────────────────────────────────────────────
  draw(ctx) {
    const map = this.current;
    if (!map) return;

    for (let row = 0; row < map.rows; row++) {
      for (let col = 0; col < map.cols; col++) {
        const tileId  = map.grid[row][col];
        const tileDef = getTile(tileId);
        const px = col * TILE_SIZE;
        const py = row * TILE_SIZE;

        // Base tile colour
        ctx.fillStyle = tileDef.color;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Water shimmer detail
        if (tileId === 3) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(px + 4,  py + 10, 10, 3);
          ctx.fillRect(px + 18, py + 18, 10, 3);
        }
      }
    }
  },

};
