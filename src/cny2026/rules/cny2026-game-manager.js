/*
CNY2026 Game Manager
Keeps tracks of victory and scoring.

Rules:
- Create Passengers: every 5 seconds, the Game Manager checks if there are
  enough Passengers in the game.
  - "Enough" is determined by targetNumberOfPassengers
  - If there aren't enough Passengers, the game manager will select a random
    PassengerSpawnZone, which doesn't have any nearby Passengers, and attempt to create
    a new Passenger there.
- Scoring: when a Passenger is successfully dropped off at their Destination
  DropOffZone, the score is incremented. This is triggered by the DropOffZone.
- Timed Game: when the game timer runs out, the game is over.
 */

const DEFAULT_TARGET_NUMBER_OF_PASSENGERS = 3
const TIME_TO_SPAWN = 1 * 60

import Rule from '@avo/rule'
import { FRAMES_PER_SECOND, LAYERS, TILE_SIZE } from '@avo/constants.js'

export default class CNY2026GameManager extends Rule {
  constructor (app) {
    super(app)
    this._type = 'cny2026-game-manager'

    this.targetNumberOfPassengers = DEFAULT_TARGET_NUMBER_OF_PASSENGERS
    this.gameTimer = 0
    this.spawnTimer = 0
  }

  deconstructor () {}

  play () {
    this.gameTimer++
    this.spawnTimer++

    if (this.spawnTimer >= TIME_TO_SPAWN) {
      this.populatePassengers()
      this.spawnTimer = 0
    }
  }

  paint (layer = 0) {
      if (layer === LAYERS.OVERLAY) {
        this.paintUIData()
      }
    }
    
    /*
    Draw UI data, such as Hero health.
     */
    paintUIData () {
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
      const currentTime = this.gameTimer
      const timeInMilliseconds = Math.floor((currentTime % FRAMES_PER_SECOND) / FRAMES_PER_SECOND * 1000 )
      const textInMilliseconds = timeInMilliseconds.toString().padStart(3, '0').slice(0, 2)
      const timeInSeconds = Math.floor(currentTime / FRAMES_PER_SECOND)
      const timeText = timeInSeconds + '.' + textInMilliseconds
      c2d.textAlign = 'right'
      c2d.strokeStyle = '#fff'
      c2d.strokeText(timeText, RIGHT, TOP)
      c2d.fillStyle = '#c04040'
      c2d.fillText(timeText, RIGHT, TOP)
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

  endGame () {}
}
