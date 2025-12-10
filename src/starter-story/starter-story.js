import Story from '@avo/story'
import ImageAsset from '@avo/image-asset.js'
import { ROTATIONS, TILE_ADJACENCIES } from '@avo/constants.js'

import Hero from './entities/hero.js'
import Wizard from './entities/wizard.js'
import ChaserEnemy from './entities/chaser-enemy.js'

import FloorTile from './tiles/floor-tile'
import WallTile from './tiles/wall-tile.js'

import PlayerControls from './rules/player-controls.js'

export default class StarterStory extends Story {
  constructor (app) {
    super(app)

    this.assets = {
      "hero": new ImageAsset('assets/avo-sprites-2024-08-samiel.png'),
      "map": new ImageAsset('assets/avo-sprites-2025-03-map-tiles.png'),
    }
  }

  start () {
    super.start()
    this.load_first_scene()
  }

  load_first_scene () {
    const app = this._app

    // Setup rules
    app.addRule(new PlayerControls(app))

    // Setup map
    app.gameMap.tiles = []
    app.gameMap.width = 25
    app.gameMap.height = 25

    const MAP_STRING = `
      #########################
      #.......................#
      #.......................#
      #.......................#
      #.......................#
      #.......................#
      #.......................#
      #.......................#
      ####.####.......####.####
      #.......#.......#.......#
      #.......#.......#..#.#..#
      #..###..#.......#.#...#.#
      #..#.#..........#.......#
      #..###..#.......#.......#
      #.......#.......#..###..#
      #.......#.......#.......#
      ####.####.......####.####
      #.......#.......#.......#
      #.......#.......#.......#
      #..###..#.......#.......#
      #..###..................#
      #..###..#.......#.......#
      #.......#.......#.......#
      #.......#.......#.......#
      #########################
    `.replace(/\s/g, '')

    // Create map based on map string
    for (let row = 0 ; row < app.gameMap.height ; row++) {
      app.gameMap.tiles.push([])
      for (let col = 0 ; col < app.gameMap.width ; col++) {
        const tileType = MAP_STRING[row * app.gameMap.width + col]
        if (tileType === '#') {
          const tile = new WallTile(app, col, row)
          app.gameMap.tiles[row].push(tile)
        } else {
          const tile = new FloorTile(app, col, row)
          app.gameMap.tiles[row].push(tile)
        }
      }
    }

    // Pretty up map tiles.
    // For each wall tile, check adjacencies, then make walls look contiguous.
    for (let row = 0 ; row < app.gameMap.height ; row++) {
      for (let col = 0 ; col < app.gameMap.width ; col++) {
        const tile = app.gameMap.tiles[row][col]
        if (tile?._type === 'wall-tile') {
          const similarAdjacencies = tile.checkSimilarAdjacencies()

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

    // Add Hero
    app.hero = app.addEntity(new Hero(app, 12, 20))
    app.hero.rotation = ROTATIONS.NORTH
    app.camera.target = app.hero

    // Add other entities
    app.addEntity(new Wizard(app, 11, 4))
    app.addEntity(new ChaserEnemy(app, 11, 6))

  }
}
