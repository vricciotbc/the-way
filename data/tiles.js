// =============================================
//  data/tiles.js
//  Tile registry for "The Way"
//
//  To add a new tile type:
//    1. Pick an unused number as its ID
//    2. Add an entry here — nothing else needs to change
//
//  Each tile has:
//    color    — placeholder colour until sprites are added
//    walkable — can the player step on it?
//    label    — human-readable name for debugging
// =============================================

const TILES = {
  0: { color: '#5a8f5a', walkable: true,  label: 'grass'       },
  1: { color: '#4a3728', walkable: false, label: 'stone wall'  },
  2: { color: '#c8b87a', walkable: true,  label: 'dirt path'   },
  3: { color: '#3a6b8a', walkable: false, label: 'water'       },
  4: { color: '#8a7a60', walkable: true,  label: 'stone floor' },
};

// Safe tile lookup — returns a visible "error" tile if ID is unknown
function getTile(id) {
  return TILES[id] ?? { color: '#ff00ff', walkable: false, label: 'unknown' };
}
