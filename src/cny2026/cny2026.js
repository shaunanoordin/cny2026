import Story from '@avo/story'
import ImageAsset from '@avo/image-asset.js'

import PassengerSpawnZone from './entities/passenger-spawn-zone.js'

import CNY2026GameManager from './rules/cny2026-game-manager.js'
import CNY2026StartUp from './rules/cny2026-start-up.js'
import PlayerBounds from './rules/player-bounds.js'
import PlayerControls from './rules/player-controls.js'
import SoundManager from './rules/sound-manager.js'

import { updateHighScoreHtml } from './misc/highScore.js'
import generateGameMapFromImage from './misc/generateGameMapFromImage.js'

export default class CNY2026 extends Story {
  constructor (app) {
    super(app)

    this.assets = {
      // 'hero': new ImageAsset('assets/avo-sprites-2024-08-samiel.png'),
      'horse': new ImageAsset('assets/cny2026-horse.png'),
      'passengers': new ImageAsset('assets/cny2026-passengers.png'),
      'cars': new ImageAsset('assets/cny2026-cars.png'),
      'zones': new ImageAsset('assets/cny2026-zones.png'),
      'misc': new ImageAsset('assets/cny2026-misc.png'),
      'map': new ImageAsset('assets/cny2026-map-tiles.png'),
      'map-layout-00': new ImageAsset('assets/cny2026-map-00-debug.png'),
      'map-layout-01': new ImageAsset('assets/cny2026-map-01-city.png'),
    }

    // Add event listeners
    this.startButton_onClick = this.startButton_onClick.bind(this)
    document.getElementById('cny2026-start-button').addEventListener('click', this.startButton_onClick)
    // ⚠️ NOTE: since the Story doesn't ever unload/deconstruct, there's no corresponding .removeEventListener()

    // Open home menu when the game starts
    app.setHomeMenu(true)

    // Update the high score.
    updateHighScoreHtml()
  }

  start () {
    super.start()
    // this.load_debug_scene()
    this.load_city_scene()
  }

  addStandardRules () {
    const app = this._app
    app.addRule(new CNY2026GameManager(app))
    app.addRule(new CNY2026StartUp(app))
    app.addRule(new PlayerControls(app))
    app.addRule(new PlayerBounds(app))
    app.addRule(new SoundManager(app))
  }

  load_debug_scene () {
    super.reset()
    const app = this._app
    
    // Setup rules
    this.addStandardRules()

    // Setup map
    generateGameMapFromImage(app, app.assets['map-layout-00'].img)
    app.rules.get('cny2026-game-manager').populatePassengers()
  }

  load_city_scene () {
    super.reset()
    const app = this._app
    
    // Setup rules
    this.addStandardRules()

    // Setup map
    generateGameMapFromImage(app, app.assets['map-layout-01'].img)
    app.rules.get('cny2026-game-manager').populatePassengers()

    // Setup map: add easy starting spawn. 
    const startingZoneSpawn = app.addEntity(new PassengerSpawnZone(app, app.hero.col, app.hero.row + 5))
    startingZoneSpawn.spawnPassenger()

  }

  startButton_onClick () {
    this._app.setHomeMenu(false)
    this.start()
  }
}
