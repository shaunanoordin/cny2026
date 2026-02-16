/*
CNY2026 Game Manager
Manages a single round of gameplay. Keeps track of time, scoring, and the
finish ("victory"/"game over") conditions. Spawns Passengers and Cars to keep
things interesting.

Rules:
- Timed Score Game: this game is about accumulating as high a score as possible
  in a limited time. 
  - The game timer (in the Active state) only starts after the player has
    delivered at least one Passenger.
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

import { saveHighScore } from '../misc/highScore.js'
import howManyCarsToSpawn from '../misc/howManyCarsToSpawn.js'

const SHUFFLE = 10
const DEFAULT_TARGET_NUMBER_OF_PASSENGERS = 3
const TIME_TO_SPAWN = 1 * 60
const ACTIVE_GAME_TIME = 1.5 * 60 * FRAMES_PER_SECOND
const FINISHED_SCREEN_ANIMATION_TIME = 0.5 * FRAMES_PER_SECOND
const FINISHED_SCREEN_TIME = 10 * FRAMES_PER_SECOND
const SCORE_PER_PICKUP = 100
const MAX_DURATION_OF_ESCALATION_MUSIC = 50 * FRAMES_PER_SECOND
const SCORE_THRESHOLD_FOR_ESCALATION_MUSIC = 300

export const GAME_STATES = {
  STARTING_UP: 'init',  // Show startup screen. 
  ACTIVE: 'active',  // Gameplay!
  FINISHED: 'finished',  // Show finished screen
}

export default class CNY2026GameManager extends Rule {
  constructor (app) {
    super(app)
    this._type = 'cny2026-game-manager'

    this.targetNumberOfPassengers = DEFAULT_TARGET_NUMBER_OF_PASSENGERS
    this.gameTimer = 0
    this.spawnTimer = 0

    this.state = GAME_STATES.STARTING_UP
    
    this.score = 0
  }

  deconstructor () {}

  play () {
    if (this.state === GAME_STATES.ACTIVE) {
      // In the active game state, we keep track of two timers:
      // - the game timer limits how long a round of gameplay lasts
      // - the spawn timer causes new passengers and new enemies to spawn at a
      //   regular rate.

      // Don't start the game timer until the player has delivered at least one passenger.
      if (this.score > 0) { this.gameTimer++ }
      this.spawnTimer++

      // Spawn Passengers and Cars every second.
      if (this.spawnTimer >= TIME_TO_SPAWN) {
        this.populatePassengers()
        this.populateCars()
        this.spawnTimer = 0
      }

      // Is it time to escalate the music?
      if (
        this.gameTimer === (ACTIVE_GAME_TIME - MAX_DURATION_OF_ESCALATION_MUSIC)
        && this.score >= SCORE_THRESHOLD_FOR_ESCALATION_MUSIC
      ) {
        this._app.rules.get('sound-manager').playEscalationMusic()
      }

      // Is the game round over?
      if (this.gameTimer >= ACTIVE_GAME_TIME) {
        this.gameTimer = 0
        this.state = GAME_STATES.FINISHED
        saveHighScore(this.score)
        this._app.rules.get('sound-manager').playFinishingMusic()
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
          this._app.rules.get('sound-manager').fadeOutMusic()
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
    const MID_X = this._app.canvasWidth / 2
    const MID_Y = this._app.canvasHeight / 2
    const LEFT = X_OFFSET
    const RIGHT = this._app.canvasWidth - X_OFFSET
    const TOP = -Y_OFFSET
    const BOTTOM = this._app.canvasHeight + Y_OFFSET
    const CLOCK_RADIUS = 24
    c2d.font = '2em Source Code Pro, monospace'
    c2d.textBaseline = 'middle'
    c2d.lineWidth = 8

    // The game timer (in Active mode) doesn't start until the player has
    // delivered at least one passenger.
    if (this.score > 0) {

      // Paint clock
      const gameTimeLeft = this.gameTimer / ACTIVE_GAME_TIME
      c2d.fillStyle = 'hsl(30, 80%, 60%)'
      c2d.strokeStyle = '#fff'
      c2d.lineWidth = 2
      c2d.beginPath()
      c2d.lineTo(MID_X, TOP - CLOCK_RADIUS)
      c2d.moveTo(MID_X, TOP)
      c2d.arc(MID_X, TOP, CLOCK_RADIUS, -0.5 * Math.PI + gameTimeLeft * 2 * Math.PI, -0.5 * Math.PI)
      c2d.lineTo(MID_X, TOP)
      c2d.fill()
      c2d.stroke()

      // Paint timer
      const currentTime = ACTIVE_GAME_TIME - this.gameTimer
      const timeInMilliseconds = Math.floor((currentTime % FRAMES_PER_SECOND) / FRAMES_PER_SECOND * 1000 )
      const textInMilliseconds = timeInMilliseconds.toString().padStart(3, '0').slice(0, 2)
      const timeInSeconds = Math.floor(currentTime / FRAMES_PER_SECOND)
      const textInSeconds = timeInSeconds.toString().padStart(3, ' ')
      const timeText = `time⯈ ${textInSeconds}.${textInMilliseconds}`
      c2d.textAlign = 'left'
      c2d.strokeStyle = '#fff'
      c2d.strokeText(timeText, MID_X + CLOCK_RADIUS * 1.5, TOP)
      c2d.fillStyle = 'hsl(30, 80%, 60%)'
      c2d.fillText(timeText, MID_X + CLOCK_RADIUS * 1.5, TOP)
    }

    // Paint score
    const score = this.score
    const textScore = `${score} ⯇score`
    c2d.textAlign = 'right'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(textScore, MID_X - CLOCK_RADIUS * 1.5, TOP)
    c2d.fillStyle = '#c04040'
    c2d.fillText(textScore, MID_X - CLOCK_RADIUS * 1.5, TOP)
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
    const TARGET_RADIUS = Math.min(this._app.canvasWidth, this._app.canvasHeight) / 2
    c2d.lineWidth = 8

    // Paint background
    const backgroundRadius = progress * TARGET_RADIUS
    c2d.fillStyle = 'rgba(255, 255, 255, 0.8)'
    c2d.beginPath()
    c2d.arc(MID_X, MID_Y, backgroundRadius, 0, 2 * Math.PI)
    c2d.fill()

    // Paint text 1: "Game Over"
    text = 'Shift complete!'
    c2d.font = `${(progress * 3 + 1).toFixed(2)}em Source Code Pro, monospace`
    c2d.textAlign = 'center'
    c2d.textBaseline = 'bottom'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, MID_X, MID_Y - Y_OFFSET)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, MID_X, MID_Y - Y_OFFSET)

    // Paint text 2: score
    text = `Your score: ${this.score}`
    c2d.font = `${(progress * 2 + 0.5).toFixed(2)}em Source Code Pro, monospace`
    c2d.textAlign = 'center'
    c2d.textBaseline = 'top'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, MID_X, MID_Y + Y_OFFSET)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, MID_X, MID_Y + Y_OFFSET)
  }

  // Start the game round!
  start () {
    if (this.state === GAME_STATES.STARTING_UP) {
      this.state = GAME_STATES.ACTIVE
    }
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
 
    const carsToSpawn = howManyCarsToSpawn(this.score)
    for (let i = 0 ; i < carsToSpawn && i < spawnZones.length ; i++) {
      spawnZones[i].spawnCar()
    }
  }

  increaseScore () {
    if (this.state === GAME_STATES.ACTIVE) {
      this.score += SCORE_PER_PICKUP
    }

    const soundManager = this._app.rules.get('sound-manager')

    // Start the Gong Xi Music once player has delivered one passenger.
    // This is also when the game timer starts.
    if (this.score === 100) {
      soundManager.playStartingMusic()
    }
  }
}
