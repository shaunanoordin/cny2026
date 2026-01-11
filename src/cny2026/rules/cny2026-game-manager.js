/*
CNY2026 Game Manager
Keeps tracks of victory and scoring.

Rules:
- Create Passengers: every 5 seconds, the Game Manager checks if there are
  enough Passengers in the game.
  - "Enough" is determined by targetNumberOfPassengers
  - If there aren't enough Passengers, the game manager will select a random
    SpawnZone, which doesn't have any nearby Passengers, and attempt to create
    a new Passenger there.
- Scoring: when a Passenger is successfully dropped off at their Destination
  DropOffZone, the score is incremented. This is triggered by the DropOffZone.
- Timed Game: when the game timer runs out, the game is over.
 */

const DEFAULT_TARGET_NUMBER_OF_PASSENGERS = 3
const TIME_TO_SPAWN = 5 * 60

import Rule from '@avo/rule'

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

  // Checks if there are enough Passengers in the game. If not, create one.
  populatePassengers () {
    console.log('+++ populatePassengers')
    const app = this._app
    const passengers = app.entities.filter(entity => entity._type === 'passenger')

    if (passengers.length < DEFAULT_TARGET_NUMBER_OF_PASSENGERS) {

      // Find a spawn zone that isn't currently occupied by an existing Passenger
      const spawnZones = app.entities.filter(entity => entity._type === 'spawn-zone')
      const spawnZonesWithNoNearbyPassengers = spawnZones.filter(spawnZone =>
        true || spawnZone.getNearbyPassengers().length === 0
      )

      if (spawnZonesWithNoNearbyPassengers.length > 0) {
        const randomIndex = Math.floor(Math.random() * spawnZonesWithNoNearbyPassengers.length)
        spawnZonesWithNoNearbyPassengers[randomIndex].spawnPassenger()
      }
    }
  }

  endGame () {}
}
