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
import { FRAMES_PER_SECOND, LAYERS, POINTER_STATES, TILE_SIZE } from '@avo/constants.js'
import { GAME_STATES } from './cny2026-game-manager.js'

const START_UP_DELAY = 1 * FRAMES_PER_SECOND
const SHORT_ANIMATION_DURATION = 1 * FRAMES_PER_SECOND
const LONG_ANIMATION_DURATION = 3 * FRAMES_PER_SECOND

export default class CNY2026StartUp extends Rule {
  constructor (app) {
    super(app)

    this.startUpTimer = 0  // Wait a while before letting players start the game.
    this.shortAnimationTimer = 0
    this.longAnimationTimer = 0
  }

  play () {
    const app = this._app
    const gameState = app.rules.get('cny2026-game-manager')?.state

    // Only do something if the gameplay round is starting up
    if (gameState !== GAME_STATES.STARTING_UP) return

    // Tick the animation counters
    this.shortAnimationTimer = (this.shortAnimationTimer + 1) % SHORT_ANIMATION_DURATION
    this.longAnimationTimer = (this.longAnimationTimer + 1) % LONG_ANIMATION_DURATION

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

      // Paint background
      c2d.fillStyle = `rgb(255, 255, 255, ${startUpProgress * 0.6 + 0.2})`
      c2d.beginPath()
      c2d.rect(0, 0, app.canvasWidth, app.canvasHeight)
      c2d.fill()

      // Paint goals
      this.paintGoals()
      this.paintAnimatedExample()

      // Paint "Let's go!" prompt and instructions
      // Do this only when input is ready to start the game. No point telling
      // people to Let's Go! when we can't, uh, go.
      if (startUpProgress >= 1) {
        this.paintLetsGoPrompt()
        this.paintInstructions()
      }
    }
  }

  paintGoals () {
    const app = this._app
    const c2d = app.canvas2d

    const text = 'Deliver passengers to their destinations!'
    const MID_X = app.canvasWidth / 2
    const MID_Y = app.canvasHeight / 2
    
    c2d.font = 'bold 2em Source Code Pro'
    c2d.textAlign = 'center'
    c2d.textBaseline = 'middle'
    c2d.lineWidth = 8
    c2d.strokeStyle = '#ffffff'
    c2d.fillStyle = '#c04040'
    c2d.strokeText(text, MID_X, MID_Y - TILE_SIZE * 7)
    c2d.fillText(text, MID_X, MID_Y - TILE_SIZE * 7)
  }

  paintLetsGoPrompt () {
    const app = this._app
    const c2d = app.canvas2d

    const text = 'Let\'s go!'
    const MID_X = app.canvasWidth / 2
    const MID_Y = app.canvasHeight / 2

    c2d.font = 'bold 2em Source Code Pro'
    c2d.textAlign = 'center'
    c2d.textBaseline = 'middle'
    c2d.lineWidth = 8
    c2d.strokeStyle = '#ffffff'
    c2d.fillStyle = '#c04040'
    c2d.strokeText(text, MID_X, MID_Y + TILE_SIZE * 2)
    c2d.fillText(text, MID_X, MID_Y + TILE_SIZE * 2)
  }

  paintAnimatedExample () {
    const app = this._app
    const c2d = app.canvas2d

    const progress = this.longAnimationTimer / LONG_ANIMATION_DURATION
    const MID_X = app.canvasWidth / 2
    const MID_Y = app.canvasHeight / 2
    const Y = MID_Y - TILE_SIZE * 3
    const HORSE_MIN_X = MID_X - TILE_SIZE * 12
    const HORSE_MAX_X = MID_X + TILE_SIZE * 12
    const PASSENGER_START_X = MID_X - TILE_SIZE * 4
    const PASSENGER_END_X = MID_X + TILE_SIZE * 4

    // Drop Off Zone!
    this.paintSprite({
      spriteSheet: app.assets['zones'].img,
      spriteCol: 1,
      spriteRow: 1,
      spriteScale: 3,
      x: PASSENGER_END_X,
      y: Y,
    })

    // Horse!
    const horseX = (HORSE_MAX_X - HORSE_MIN_X) * progress + HORSE_MIN_X
    this.paintSprite({
      spriteSheet: app.assets['horse'].img,
      spriteCol: 1,
      spriteRow: 1,
      spriteScale: 4,
      x: horseX,
      y: Y,
    })

    // Passenger!
    // Must be painted after the horse
    const passengerX = Math.min(Math.max(PASSENGER_START_X, horseX), PASSENGER_END_X)
    const passengerPickedUp = horseX >= PASSENGER_START_X
    const passengerDroppedOff = horseX >= PASSENGER_END_X
    this.paintSprite({
      spriteSheet: app.assets['passengers'].img,
      spriteCol: 0,
      spriteRow: (passengerDroppedOff) ? 2 : (passengerPickedUp) ? 1 : 0,
      spriteScale: 3,
      spriteSizeX: 24,
      spriteSizeY: 24,
      spriteOffsetX: -12,
      spriteOffsetY: (passengerPickedUp && !passengerDroppedOff) ? -24 : -16,
      x: passengerX,
      y: Y,
    })

  }


  paintInstructions () {
    const app = this._app

    const MID_X = app.canvasWidth / 2
    const MID_Y = app.canvasHeight / 2
    const progress = this.shortAnimationTimer / SHORT_ANIMATION_DURATION

    // Paint keyboard controls
    this.paintSprite({
      spriteSheet: app.assets['misc'].img,
      spriteCol: (progress < 0.5) ? 0 : 1,
      spriteRow: 0,
      spriteScale: 4,
      x: MID_X - TILE_SIZE * 8,
      y: MID_Y + TILE_SIZE * 2,
    })

    // Paint touch controls
    this.paintSprite({
      spriteSheet: app.assets['misc'].img,
      spriteCol: (progress < 0.5) ? 2 : 3,
      spriteRow: 0,
      spriteScale: 4,
      x: MID_X + TILE_SIZE * 8,
      y: MID_Y + TILE_SIZE * 2,
    })

  }

  paintSprite (args = {
    spriteSheet: undefined,
    x: undefined,
    y: undefined,

    // Source values
    spriteCol: undefined,  // Column and row of source sprite on the sprite sheet. 
    spriteRow: undefined,
    spriteSizeX: undefined,  // Size of source sprite on sprite sheet.
    spriteSizeY: undefined,

    // Painting target values
    spriteOffsetX: undefined,  // Offset of sprite relative to this Entity's {x,y}, when painted on canvas.
    spriteOffsetY: undefined,  // This is usually -0.5 * spriteSizeXorY to make sure the sprite is centred on Entity.
    spriteScale: undefined,  // Scale of the sprite when paint()ed.
  }) {
    const app = this._app
    const c2d = app.canvas2d
    if (!args.spriteSheet) return

    // Calculate all the variables
    const sizeX = args?.spriteSizeX ?? TILE_SIZE
    const sizeY = args?.spriteSizeY ?? TILE_SIZE
    const srcX = (args?.spriteCol ?? 0) * sizeX
    const srcY = (args?.spriteRow ?? 0) * sizeY
    const scaleX = args?.spriteScale ?? 1
    const scaleY = args?.spriteScale ?? 1

    c2d.save()

    c2d.translate(args.x, args.y)  // 1. This moves the 'drawing origin' to match the position of (the centre of) the Entity.
    c2d.scale(scaleX, scaleY)  // 2. This ensures the sprite scales with the 'drawing origin' as the anchor point.
    
    // 4. tgtX and tgtY specify where to draw the sprite, relative to the 'drawing origin'.
    let tgtX = args?.spriteOffsetX ?? -sizeX / 2
    let tgtY = args?.spriteOffsetY ?? -sizeY / 2

    c2d.drawImage(args.spriteSheet,
      srcX, srcY, sizeX, sizeY,
      tgtX, tgtY, sizeX, sizeY
    )

    c2d.restore()
  }

  // Start the game round!
  start () {
    const app = this._app
    app.rules.get('cny2026-game-manager')?.start()
  }
}