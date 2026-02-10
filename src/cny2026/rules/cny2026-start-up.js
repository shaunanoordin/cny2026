/*
CNY2026 Startup
The Startup is shown before every round of gameplay.

- Displays the starting message. (i.e. goal of the game and tutorial)
- Starts the gameplay round after seeing some user input.
  - There's a short delay before user input is recognised, to prevent the game
    accidentally starting too soon and ensuring players get to see the starting
    message.
 */

import Rule from '@avo/rule'
import { FRAMES_PER_SECOND, LAYERS, POINTER_STATES } from '@avo/constants.js'
import { GAME_STATES } from './cny2026-game-manager.js'

const START_UP_DELAY = 1 * FRAMES_PER_SECOND

export default class CNY2026StartUp extends Rule {
  constructor (app) {
    super(app)

    this.startUpTimer = 0  // Wait a while before letting players start the game.
  }

  play () {
    const app = this._app
    const gameState = app.rules.get('cny2026-game-manager')?.state

    // Only do something if the gameplay round is starting up
    if (gameState !== GAME_STATES.STARTING_UP) return

    // Actually, wait for a while before letting players start the game.
    // Otherwise, they might click too fast to see the tutorial.
    if (this.startUpTimer < START_UP_DELAY) {
      this.startUpTimer++
      return
    }

    // OK, now start the game as soon as we see any user input.
    const {
      keysPressed,
      pointerState,
    } = app.playerInput
    
    if (
      pointerState === POINTER_STATES.POINTER_DOWN
      || keysPressed['ArrowRight']
      || keysPressed['ArrowDown']
      || keysPressed['ArrowLeft']
      || keysPressed['ArrowUp']
    ) {
      this.start()
    }
  }

  paint (layer = 0) {
    const app = this._app
    const gameState = app.rules.get('cny2026-game-manager')?.state

    if (layer === LAYERS.OVERLAY && gameState === GAME_STATES.STARTING_UP) {
      const c2d = app.canvas2d
      const startUpProgress = this.startUpTimer / START_UP_DELAY

      c2d.fillStyle = `rgb(255, 255, 255, ${startUpProgress * 0.6 + 0.2})`
      c2d.beginPath()
      c2d.rect(0, 0, app.canvasWidth, app.canvasHeight)
      c2d.fill()
    }
  }

  // Start the game round!
  start () {
    const app = this._app
    app.rules.get('cny2026-game-manager')?.start()
  }
}