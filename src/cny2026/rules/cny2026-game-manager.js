/*
CNY2026 Game Manager
Manages a single round of gameplay. Keeps track of time, scoring, and the
finish ("victory"/"game over") conditions. Spawns Passengers and Cars to keep
things interesting.

Rules:
- Timed Score Game: this game is about accumulating as high a score as possible
  in a limited time. 
- States: the Game Manager starts the game in an 'active' state, then switches
  to a 'finished' state when time is up.
  - Active: player can move the Hero around, and passengers and cars will spawn.
  - Game Over (Finished): when time runs out, the game shows a "Finished Screen"
    with the player's score.
- Create Passengers: every 1 second, the Game Manager checks if there are
  enough Passengers in the game.
  - "Enough" is determined by targetNumberOfPassengers
  - If there aren't enough Passengers, the game manager will select a random
    PassengerSpawnZone, which doesn't have any nearby Passengers, and attempt to create
    a new Passenger there.
- Create Cars: every 1 second, the Game will spawn Cars that zoom across the
  city.
- Scoring: when a Passenger is successfully dropped off at their Destination
  DropOffZone, the score is incremented. This is triggered by the DropOffZone.
 */

import Rule from '@avo/rule'
import { GameAI } from '@avo/game-ai.js'
import { FRAMES_PER_SECOND, LAYERS, TILE_SIZE } from '@avo/constants.js'

const SHUFFLE = 10
const DEFAULT_TARGET_NUMBER_OF_PASSENGERS = 3
const TIME_TO_SPAWN = 1 * 60
const ACTIVE_GAME_TIME = 1 // 3 * 60 * FRAMES_PER_SECOND
const FINISHED_SCREEN_ANIMATION_TIME = 0.5 * FRAMES_PER_SECOND
const FINISHED_SCREEN_TIME = 10 * FRAMES_PER_SECOND
const SCORE_PER_PICKUP = 100

const GAME_STATES = {
  ACTIVE: 'active',
  FINISHED: 'finished',
}

export default class CNY2026GameManager extends Rule {
  constructor (app) {
    super(app)
    this._type = 'cny2026-game-manager'

    this.targetNumberOfPassengers = DEFAULT_TARGET_NUMBER_OF_PASSENGERS
    this.gameTimer = 0
    this.spawnTimer = 0

    this.state = GAME_STATES.ACTIVE
    
    this.score = 10000
  }

  deconstructor () {}

  play () {
    if (this.state === GAME_STATES.ACTIVE) {
      // In the active game state, we keep track of two timers:
      // - the game timer limits how long a round of gameplay lasts
      // - the spawn timer causes new passengers and new enemies to spawn at a
      //   regular rate.

      this.gameTimer++
      this.spawnTimer++

      if (this.spawnTimer >= TIME_TO_SPAWN) {
        this.populatePassengers()
        this.populateCars()
        this.spawnTimer = 0
      }

      if (this.gameTimer >= ACTIVE_GAME_TIME) {
        this.gameTimer = 0
        this.state = GAME_STATES.FINISHED
      }

    } else if (this.state === GAME_STATES.FINISHED) {
      // In the finished game state
      // - the "Finished Screen" will appear and animate for a short while.
      //   (see FINISHED_SCREEN_ANIMATE_TIME and paintFinishedScreen())
      // - the "Finished Screen" will linger for the duration of
      //   FINISHED_SCREEN_TIME. After that, the main menu will open again.
      // - we're still using the game timer to keep track of time.

      if (this.gameTimer < FINISHED_SCREEN_TIME) {
        this.gameTimer++

        if (this.gameTimer >= FINISHED_SCREEN_TIME) {
          this._app.setHomeMenu(true)
        }
      }
    }
  }

  paint (layer = 0) {
    if (layer === LAYERS.OVERLAY) {
      if (this.state === GAME_STATES.ACTIVE) {
        this.paintActiveGameUI()
      }

      if (this.state === GAME_STATES.FINISHED) {
        this.paintFinishedScreen()
      }
    }
  }
    
  /*
  Draw UI for when the game is active, such as timer and score.
    */
  paintActiveGameUI () {
    const c2d = this._app.canvas2d
    
    const X_OFFSET = TILE_SIZE * 1.5
    const Y_OFFSET = TILE_SIZE * -1.0
    const LEFT = X_OFFSET
    const RIGHT = this._app.canvasWidth - X_OFFSET
    const TOP = -Y_OFFSET
    const BOTTOM = this._app.canvasHeight + Y_OFFSET
    c2d.font = '2em monospace'
    c2d.textBaseline = 'middle'
    c2d.lineWidth = 8

    // Paint timer
    const currentTime = ACTIVE_GAME_TIME - this.gameTimer
    const timeInMilliseconds = Math.floor((currentTime % FRAMES_PER_SECOND) / FRAMES_PER_SECOND * 1000 )
    const textInMilliseconds = timeInMilliseconds.toString().padStart(3, '0').slice(0, 2)
    const timeInSeconds = Math.floor(currentTime / FRAMES_PER_SECOND)
    const timeText = timeInSeconds + '.' + textInMilliseconds
    c2d.textAlign = 'right'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(timeText, RIGHT, BOTTOM)
    c2d.fillStyle = '#c04040'
    c2d.fillText(timeText, RIGHT, BOTTOM)

    // Paint score
    const score = this.score
    c2d.textAlign = 'left'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(score, LEFT, BOTTOM)
    c2d.fillStyle = '#c04040'
    c2d.fillText(score, LEFT, BOTTOM)
  }

  /*
  Draw UI for the "this game is finished" screen.
  - The Finished Screen will animate for a short while (until
    FINISHED_SCREEN_ANIMATION_TIME)
  - After that, the Finished Screen will remain static. 
   */
  paintFinishedScreen () {
    const progress = Math.max(Math.min(
      this.gameTimer / FINISHED_SCREEN_ANIMATION_TIME,
    1), 0)
    const c2d = this._app.canvas2d
    
    let text = ''
    const Y_OFFSET = TILE_SIZE * 1
    const MID_X = this._app.canvasWidth / 2
    const MID_Y = this._app.canvasHeight / 2
    c2d.lineWidth = 8

    // Paint text 1: "Game Over"
    text = 'Shift complete!'
    c2d.font = `${(progress * 3 + 1).toFixed(2)}em monospace`
    c2d.textAlign = 'center'
    c2d.textBaseline = 'bottom'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, MID_X, MID_Y - Y_OFFSET)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, MID_X, MID_Y - Y_OFFSET)

    // Paint text 2: score
    text = `Your score: ${this.score}`
    c2d.font = `${(progress * 2 + 0.5).toFixed(2)}em monospace`
    c2d.textAlign = 'center'
    c2d.textBaseline = 'top'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, MID_X, MID_Y + Y_OFFSET)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, MID_X, MID_Y + Y_OFFSET)
  }

  // Checks if there are enough Passengers in the game. If not, create one.
  populatePassengers () {
    const app = this._app
    const passengers = app.entities.filter(entity => entity._type === 'passenger')

    if (passengers.length < DEFAULT_TARGET_NUMBER_OF_PASSENGERS) {

      // Find a spawn zone that isn't currently occupied by an existing Passenger
      const spawnZones = app.entities.filter(entity => entity._type === 'passenger-spawn-zone')
      const spawnZonesWithNoNearbyPassengers = spawnZones.filter(spawnZone =>
        spawnZone.getNearbyPassengers().length === 0
      )

      if (spawnZonesWithNoNearbyPassengers.length > 0) {
        const randomIndex = Math.floor(Math.random() * spawnZonesWithNoNearbyPassengers.length)
        spawnZonesWithNoNearbyPassengers[randomIndex].spawnPassenger()
      }
    }
  }

  // Create new cars every once in a while.
  populateCars () {
    const app = this._app
    let spawnZones = app.entities.filter(entity => entity._type === 'car-spawn-zone')
    spawnZones = GameAI.shuffleArray(spawnZones, SHUFFLE)
 
    const NUMBER_OF_SPAWNS = 3
    for (let i = 0 ; i < NUMBER_OF_SPAWNS && i < spawnZones.length ; i++) {
      spawnZones[i].spawnCar()
    }
  }

  increaseScore () {
    if (this.state === GAME_STATES.ACTIVE) {
      this.score += SCORE_PER_PICKUP
    }
  }
}
