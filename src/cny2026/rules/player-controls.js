/*
Player Controls
Standard player controls for top-down adventure games.

Keyboard controls:
- Up/down/left/right keys moves the Hero around the map.

Touch controls:
- Drag action moves the Hero around the map.
  - The initial touch/start of drag acts as a "base".
  - The direction of the Hero's movement is determined by the current position
    of the touch/cursor relative to the base.
 */

import Rule from '@avo/rule'
import { GAME_STATES } from './cny2026-game-manager.js'
import { LAYERS, POINTER_DEADZONE_RADIUS, POINTER_STATES, TILE_SIZE } from '@avo/constants.js'

export default class PlayerControls extends Rule {
  constructor (app) {
    super(app)
    this._type = 'player-controls'
    this.inputTap = false
    
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    app.addEventListener('keydown', this.onKeyDown)
    app.addEventListener('keyup', this.onKeyUp)

    this.onPointerTap = this.onPointerTap.bind(this)
    app.addEventListener('pointertap', this.onPointerTap)
  }

  deconstructor () {
    app.removeEventListener('keydown', this.onKeyDown)
    app.removeEventListener('keyup', this.onKeyUp)
    app.removeEventListener('pointertap', this.onPointerTap)
  }

  play () {
    const app = this._app
    const hero = app.hero
    const gameState = app.rules.get('cny2026-game-manager')?.state
    super.play()

    if (hero && gameState !== GAME_STATES.STARTING_UP) {
      const {
        keysPressed,
        pointerCurrent,
        pointerStart,
        pointerState,
      } = app.playerInput
      let intent = undefined
      let directionX = 0
      let directionY = 0

      if (pointerState === POINTER_STATES.POINTER_DOWN) {
        // Get pointer input if there's any.

        const distX = pointerCurrent.x - pointerStart.x
        const distY = pointerCurrent.y - pointerStart.y
        const pointerDistance = Math.sqrt(distX * distX + distY * distY)
        // const movementAngle = Math.atan2(distY, distX)

        if (pointerDistance > POINTER_DEADZONE_RADIUS) {
          directionX = distX / pointerDistance
          directionY = distY / pointerDistance
        }

      } else {
        // Otherwise, check for keyboard input.

        if (keysPressed['ArrowRight']) directionX++
        if (keysPressed['ArrowDown']) directionY++
        if (keysPressed['ArrowLeft']) directionX--
        if (keysPressed['ArrowUp']) directionY--
      }
      
      // Move action
      if (!intent && (directionX || directionY)) {
        intent = {
          name: 'move',
          directionX,
          directionY,
        }
      }

      hero.intent = intent
    }
  }

  paint (layer = 0) {
    if (layer === LAYERS.OVERLAY) {
      this.paintPointerInput()
    }
  }

  /*
  Draw pointer input, if any. This helps players get visual feedback on their
  touchscreens.
   */
  paintPointerInput () {
    const c2d = this._app.canvas2d
    const {
      pointerCurrent,
      pointerStart,
      pointerState,
    } = this._app.playerInput
    const START_POINT_RADIUS = TILE_SIZE * 1, CURRENT_POINT_RADIUS = TILE_SIZE * 0.5
    
    if (pointerState === POINTER_STATES.POINTER_DOWN) {
      c2d.lineWidth = Math.floor(Math.min(TILE_SIZE * 0.125, 2))
      c2d.fillStyle = '#80808080'
      c2d.strokeStyle = '#80808080'

      c2d.beginPath()
      c2d.arc(pointerStart.x, pointerStart.y, START_POINT_RADIUS, 0, 2 * Math.PI)
      c2d.stroke()

      c2d.beginPath()
      c2d.arc(pointerCurrent.x, pointerCurrent.y, CURRENT_POINT_RADIUS, 0, 2 * Math.PI)
      c2d.fill()

      c2d.beginPath()
      c2d.moveTo(pointerStart.x, pointerStart.y)
      c2d.lineTo(pointerCurrent.x, pointerCurrent.y)
      c2d.stroke()
    }
  }

  onPointerTap () {
    this.inputTap = true
  }

  onKeyDown ({ key }) {}

  onKeyUp ({ key }) {}
}
