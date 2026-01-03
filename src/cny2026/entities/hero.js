import Creature from '@avo/entity/types/creature.js'
import { POINTER_STATES, FRAME_DURATION, LAYERS, DIRECTIONS } from '@avo/constants.js'
import { transformSpriteSheet } from '@avo/misc.js'

const INVULNERABILITY_WINDOW = 3000
const MOVE_ACTION_CYCLE_DURATION = 500
const MAX_CHARGING_POWER = 1000

export default class Hero extends Creature {
  constructor (app, col = 0, row = 0) {
    super(app)
    this._type = 'hero'

    this.colour = '#000'
    this.col = col
    this.row = row

    this.intent = undefined
    this.action = undefined

    this.spriteSheet = transformSpriteSheet(
      app.assets['hero'].img,
      transformPixelsFromRedToBlue  // Example
    )
    this.spriteSizeX = 24
    this.spriteSizeY = 24
    this.spriteScale = 2
    this.spriteOffsetX = -12
    this.spriteOffsetY = -18
    this.spriteFlipEastToWest = true

    this.health = 3
    this.invulnerability = 0  // Invulnerability time
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()

    this.processIntent()
    this.processAction()
    this.doMaxSpeedLimit()

    // Count down invulnerability time
    if (this.invulnerability > 0) {
      this.invulnerability = Math.max(this.invulnerability - FRAME_DURATION, 0)
    }
  }

  paint (layer = 0) {
    const app = this._app
    const c2d = app.canvas2d
    if (!this.spriteSheet) return

    if (this.invulnerability > 0) {  // If invulnerable, flash!
      const flash = Math.floor(this.invulnerability / 300) % 2
      if (flash === 1) return
    }

    this.colour = (app.playerInput.pointerState === POINTER_STATES.POINTER_DOWN)
      ? '#ff3333'
      : '#c0a0a0'
    // super.paint(layer)
    this.paintShadow(layer)

    // Draw the VFX
    if (layer === LAYERS.MIDDLE && this.action?.name === 'charging') {
      app.applyCameraTransforms()

      const minRadius = this.size * 0.5
      const maxRadius = this.size * 1
      const range = maxRadius - minRadius
      const ratio = (this.action?.counter || 0) / MAX_CHARGING_POWER
      const radius = minRadius + range * ratio / 2

      c2d.strokeStyle = '#ff3'
      c2d.lineWidth = (radius - minRadius) * 2
      c2d.beginPath()
      c2d.arc(this.x, this.y, radius, 0, 2 * Math.PI)
      c2d.stroke()

      c2d.strokeStyle = '#f33'
      c2d.lineWidth = 2
      c2d.beginPath()
      c2d.arc(this.x, this.y, maxRadius, 0, 2 * Math.PI)
      c2d.stroke()

      app.undoCameraTransforms()
    }

    // Draw the sprite
    if (layer === LAYERS.MIDDLE) {
      this.paintSprite()
    }
  }

  /*
  Section: Game Logic
  ----------------------------------------------------------------------------
   */

  applyEffect (effect, source) {
    super.applyEffect(effect, source)
    if (!effect) return

    if (effect.name === 'damage') {
      if (this.invulnerability === 0) {
        this.health = Math.max(this.health - 1, 0)
        this.invulnerability = INVULNERABILITY_WINDOW
      }
    }
  }

  /*
  Section: Intent and Actions
  ----------------------------------------------------------------------------
   */

  /*
  Translate intent into action.
   */
  processIntent () {
    // Failsafe
    if (!this.action) this.goIdle()

    const action = this.action
    const intent = this.intent

    if (!intent) {  // Go idle
      if (action?.name === 'move') this.goIdle()
    } else {  // Perform a new action
      // Note: every 'move' action is considered a new action

      // "Skill" Action:
      // If the Entity intends to execute its "skill", it can only do so after
      // it's completed (or in the middle of) "charging up".
      if (intent?.name === 'skill') {
        if (action?.name === 'charging') {
          this.action = {
            ...intent,
            name: intent.name,
            counter: 0,
            state: undefined, 
            power: action.counter,
          }
        }
        return
      }

      // All other Actions:
      // If the Entity intends to execute a new action, it can only do so if the
      // current action can be cancelled. (i.e. it's either "idle" or "moving".)
      if (action?.name === 'idle' || action?.name === 'move')  {
        this.action = {
          ...intent,
          name: intent.name,
          counter: (action.name === intent.name) ? action.counter : 0,  // If the current action and new intent have the same name, it's just a continuation of the idle or move action, but with other new values (e.g. new directions)
        }
        return
      }
    }
  }

  /*
  Perform the action.
   */
  processAction () {
    if (!this.action) return

    const action = this.action

    if (action.name === 'idle') {

      // Do nothing

    } else if (action.name === 'move') {
      const directionX = action.directionX || 0
      const directionY = action.directionY || 0
      if (!directionX && !directionY) return

      const moveAcceleration = this.moveAcceleration || 0
      const actionRotation = Math.atan2(directionY, directionX)

      this.moveX += moveAcceleration * Math.cos(actionRotation)
      this.moveY += moveAcceleration * Math.sin(actionRotation)
      this.rotation = actionRotation

      action.counter = (action.counter + FRAME_DURATION) % MOVE_ACTION_CYCLE_DURATION
    
    } else if (action.name === 'charging') {

      action.counter = Math.min((action.counter + FRAME_DURATION), MAX_CHARGING_POWER)

    } else if (action.name === 'skill') {

      const WINDUP_DURATION = FRAME_DURATION * 5
      const EXECUTION_DURATION = FRAME_DURATION * 2
      const WINDDOWN_DURATION = FRAME_DURATION * 10

      if (!action.state) {  // Trigger only once, at the start of the action

        // Figure out the initial direction of the dash
        const directionX = action.directionX  || 0
        const directionY = action.directionY  || 0
        this.rotation = (directionX === 0 && directionY === 0)
          ? this.rotation
          : Math.atan2(directionY, directionX)
        action.rotation = this.rotation  // Records the initial direction of the dash

        action.state = 'windup'
      }

      if (action.state === 'windup') {
        action.counter += FRAME_DURATION
        if (action.counter >= WINDUP_DURATION) {
          action.state = 'execution'
          action.counter = 0
        }
      } else if (action.state === 'execution') {
        const pushPower = this.size * 0.5 * ((action.power || 0) / MAX_CHARGING_POWER)
        this.pushX += pushPower * Math.cos(action.rotation)
        this.pushY += pushPower * Math.sin(action.rotation)
        this.z += 4

        action.counter += FRAME_DURATION
        if (action.counter >= EXECUTION_DURATION) {
          action.state = 'winddown'
          action.counter = 0
        }
      } else if (action.state === 'winddown') {
        action.counter += FRAME_DURATION
        if (action.counter >= WINDDOWN_DURATION) {
          this.goIdle()
        }
      }

    } else {
      console.error(`[${this._type}] Unknown action: ${action?.name}`)
      this.goIdle()
    }
  }

  goIdle () {
    this.action = {
      name: 'idle',
      counter: 0,
    }
  }

  /*
  Section: Event Handling
  ----------------------------------------------------------------------------
   */

  /*
  Triggers when this entity hits/touches/intersects with another.
   */
  onCollision (target, collisionCorrection) {
    super.onCollision(target, collisionCorrection)
    if (!target) return
  }

  /*
  Section: Physics/Getters and Setters
  ----------------------------------------------------------------------------
   */

  get moveDeceleration () {
    if (this.action?.name === 'move') return 0
    return this._moveDeceleration
  }

  get pushDeceleration () {
    if (this.z > 0) return this._pushDeceleration / 2  // When jumping off the ground, it's harder to slow down 
    return this._pushDeceleration
  }

  /*
  Section: Animation
  ----------------------------------------------------------------------------
   */
  getSpriteCol () {
    switch (this.getSpriteDirection()) {
      case DIRECTIONS.NORTH: return 2
      case DIRECTIONS.EAST: return 1
      case DIRECTIONS.SOUTH: return 0
      case DIRECTIONS.WEST: return 1
    }
    return 0
  }

  getSpriteRow () {
    const action = this.action
    if (!action) return 0

    if (action.name === 'move') {
      const progress = action.counter / MOVE_ACTION_CYCLE_DURATION
      if (progress < 0.3) return 1
      else if (progress < 0.5) return 0
      else if (progress < 0.8) return 2
      else if (progress < 1) return 0
    } else if (action.name === 'charging') {
      return 1
    } else if (action.name === 'skill') {
      if (action.state === 'windup') return 1
      else if (action.state === 'execution') return 2
      else if (action.state === 'winddown') return 2
    }

    return 0
  }
}

function transformPixelsFromRedToBlue(_r, _g, _b, _a) {
  let r = _r, g = _g, b = _b, a = _a

  if (_r === 192 && _g === 64 && _b === 64) {
    r = 64
    g = 128
    b = 192
  } else if (_r === 80 && _g === 64 && _b === 64) {
    r = 32
    g = 32
    b = 96
  }

  return {
    r, g, b, a
  }
}
