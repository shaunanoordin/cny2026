/*
CNY2026 Startup
The Startup is shown before every round of gameplay.

- Displays the starting message (i.e. goal of the game).
 */

import Rule from '@avo/rule'
import { FRAMES_PER_SECOND, LAYERS, TILE_SIZE } from '@avo/constants.js'

import PlayerControls from './player-controls.js'
import CNY2026GameManager from './cny2026-game-manager.js'
import SoundManager from './sound-manager.js'
import PlayerBounds from './player-bounds.js'

export default class CNY2026Startup extends Rule {
  constructor (app) {
    super(app)
  }

  paint (layer = 0) {
    if (layer === LAYERS.OVERLAY) {
      // TODO
    }
  }

  // Start the game round!
  start () {
    const app = this._app
    app.rules.get('cny2026-game-manager')?.start()
  }
}