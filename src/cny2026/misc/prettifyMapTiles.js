/*
Prettify Map Tiles
Goes through every map tile in a game map, and attempts to "visually connect"
similar neighbouring tiles.

Input:
- gameMap: corresponds to the AvO app's .gameMap object.

Output:
- Returns true on success, false on failure.
- Modifies the tiles in the gameMap object.

- The prettify logic works on the idea that the map tile sprites have visual
  variants that factor in when there's a similar tile in an adjacent space.
- For example, a South-facing wall tile has 4 variants: a connecting wall tile
  to the West, a connecting wall tile to the East, a connecting wall tile on
  both East & West, and no connecting wall tiles. 
- A floor tile or ceiling tile would have 16 variants.
- ⚠️ A LOT of this depends on map tile sprites being designed and laid out
  correctly on the sprite sheet. A lot of those locations are hard-coded, too!
 */

import { TILE_ADJACENCIES } from '@avo/constants.js'

export default function prettifyMapTiles (gameMap) {
  if (!gameMap) {
    console.error('prettifyMapTiles(): missing input')
  }

  try {

    // For each wall tile, check adjacencies, then make walls look contiguous.
    for (let row = 0 ; row < gameMap.height ; row++) {
      for (let col = 0 ; col < gameMap.width ; col++) {
        const tile = gameMap.tiles[row][col]
        if (tile?._type === 'wall-tile') {
          const similarAdjacencies = tile.checkSimilarAdjacencies(gameMap)

          // On our avo-sprites-2025-03-map-tiles.png sprite sheet, the ceiling
          // tiles are laid out in a 4x4 pattern.
          tile.ceilingSpriteCol = similarAdjacencies % 4
          tile.ceilingSpriteRow = Math.floor(similarAdjacencies / 4)

          // On our avo-sprites-2025-03-map-tiles.png sprite sheet, the wall
          // tiles are laid out in a 1x4 pattern. btw, we're using bitwise
          // operators here! (&, not &&)
          tile.wallSpriteCol = 0
          if (similarAdjacencies & TILE_ADJACENCIES.EAST) tile.wallSpriteCol += 1
          if (similarAdjacencies & TILE_ADJACENCIES.WEST) tile.wallSpriteCol += 2
        }
      }
    }

    // CNY2026 hardcoded custom styles!
    for (let row = 0 ; row < gameMap.height ; row++) {
      for (let col = 0 ; col < gameMap.width ; col++) {
        const tile = gameMap.tiles[row][col]
        const tileType = tile?._type

        if (!tile) continue

        // "Passenger Spawn Zone" buildings
        if (tileType === 'wall-tile'
          && (
            (1 <= row && row <= 15)
            || (41 <= row && row <= 55 )
          )
          && (
            (1 <= col && col <= 15)
            || (41 <= col && col <= 55 )
          )
        ) {
          tile.ceilingSpriteCol += 4
          tile.wallSpriteCol += 4
          if (col === 8 || col === 48) {
            tile.wallSpriteCol -= 3
          }
        }

      }
    }

  } catch (err) {
    console.error('prettifyMapTiles(): ', err)
    return false
  }

  return true
}