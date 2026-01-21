import Story from '@avo/story'
import ImageAsset from '@avo/image-asset.js'
import { ROTATIONS, TILE_ADJACENCIES } from '@avo/constants.js'

import Hero from './entities/hero.js'
import DropOffZone from './entities/drop-off-zone.js'
import SpawnZone from './entities/spawn-zone.js'

import FloorTile from './tiles/floor-tile'
import WallTile from './tiles/wall-tile.js'

import PlayerControls from './rules/player-controls.js'
import CNY2026GameManager from './rules/cny2026-game-manager.js'
import SoundManager from './rules/sound-manager.js'

import generateGameMapFromImage from './misc/generateGameMapFromImage.js'

export default class CNY2026 extends Story {
  constructor (app) {
    super(app)

    this.assets = {
      // 'hero': new ImageAsset('assets/avo-sprites-2024-08-samiel.png'),
      'map': new ImageAsset('assets/avo-sprites-2025-03-map-tiles.png'),
      'map-layout-00': new ImageAsset('assets/cny2026-map-00-debug.png'),
      'map-layout-01': new ImageAsset('assets/cny2026-map-01-city.png'),
    }
  }

  start () {
    super.start()
    // this.load_debug_scene()
    this.load_city_scene()
  }

  load_debug_scene () {
    super.reset()
    const app = this._app
    
    // Setup rules
    app.addRule(new CNY2026GameManager(app))
    app.addRule(new PlayerControls(app))
    app.addRule(new SoundManager(app))

    // Setup map
    generateGameMapFromImage(app, app.assets['map-layout-00'].img)

    app.rules.get('cny2026-game-manager').populatePassengers()
  }

  load_city_scene () {
    super.reset()
    const app = this._app
    
    // Setup rules
    app.addRule(new CNY2026GameManager(app))
    app.addRule(new PlayerControls(app))
    app.addRule(new SoundManager(app))

    // Setup map
    generateGameMapFromImage(app, app.assets['map-layout-01'].img)

    app.rules.get('cny2026-game-manager').populatePassengers()
  }
}
