/*
Convert Image to Game Map
Reads an image an transforms it into a compatible game map. This is our
alternative to making a dedicated map editor.

- Input:
  - AvO app
  - image: e.g. from imageAsset.img 
- Output:
  - Returns true if successful, false on failure.
  - Modifies AvO app's map-related values.

- Each pixel in the image corresponds to a tile space in the map.
- The colour of the pixel determines the specific Tile (Floor/Wall) OR Entity at
  that tile space.
- The image's height and width determines the width and height of the map.
- The conversion/transformation from pixel to Tile/Entity is hardcoded for now.
 */

import { ROTATIONS } from '@avo/constants.js'

import prettifyMapTiles from './prettifyMapTiles.js'

import Hero from '../entities/hero.js'
import DropOffZone from '../entities/drop-off-zone.js'
import SpawnZone from '../entities/spawn-zone.js'

import FloorTile from '../tiles/floor-tile'
import WallTile from '../tiles/wall-tile.js'

export default function convertImageToGameMap (
  app,
  image,
) {
  if (!app || !image) {
    console.error('convertImageToGameMap(): missing inputs')
    return false
  }

  try {
    let gameMap = {  // Game map and environment
      tiles: [],  // 2D array of map tiles
      width: 0,
      height: 0,
    }

    // Create an OffscreenCanvas and paint the image on it.
    const width = image.width
    const height = image.height
    const offscreenCanvas = new OffscreenCanvas(width, height)
    const c2dOff = offscreenCanvas.getContext('2d')
    c2dOff.drawImage(image, 0, 0, width, height, 0, 0, width, height)

    // Extract the data from the painted image.
    const offImage = c2dOff.getImageData(0, 0, width, height)
    const offData = offImage?.data
    const dataLength = offData?.length || 0

    // Go through every pixel in the data, and run it through the transformer.
    for (let i = 0 ; i < dataLength ; i += 4) {

      // Get pixel colour.
      const r = offData[i + 0]
      const g = offData[i + 1]
      const b = offData[i + 2]
      const a = offData[i + 3]

      // Get map tile coordinates
      const index = i / 4
      const col = index % width  // Column, not colour. Uh, hope that's not too confusing.
      const row = Math.floor(index / width)
      if (!gameMap.tiles[row]) { gameMap.tiles.push([]) }

      // Translate pixel colour to map tile. 
      let tile
      if (r === 0 && g === 0 && b === 0) {
        tile = new WallTile(app, col, row)
      } else {
        tile = new FloorTile(app, col, row)
      }
      gameMap.tiles[row].push(tile)

      // Are there any Entities on this map tile?
      // Note: entities are always placed on a FloorTile.
      if (r === 255 && g === 0 && b === 0) {

        // Entity: Hero
        app.hero = app.addEntity(new Hero(app, col, row))
        app.hero.rotation = ROTATIONS.NORTH
        app.camera.target = app.hero

      } else if (r === 0 && g === 255 && b === 0) {

        // Entity: Spawn Zone
        app.addEntity(new SpawnZone(app, col, row))

      } else if (r === 0 && g === 0 && b === 255) {

        // Entity: DropOffZone
        app.addEntity(new DropOffZone(app, col, row))

      }
    }

    // Update the game map data.
    gameMap.width = width
    gameMap.height = height
    prettifyMapTiles(gameMap)
    app.gameMap = gameMap
    
  } catch (err) {
    console.error('convertImageToGameMap(): ', err)
    return false
  }

  return true
}