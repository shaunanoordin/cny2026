/*
Car Spawn Zone
A Spawn Zone will periodically spawn Cars.

Rules:
- A Car Spawn Zone has a direction where it sends its cars towards.
- A Spawn Zone doesn't actually trigger its own spawnPassenger() action, but
  it's instead triggered by a CNY 2026 Game Manager.
 */

import { DIRECTIONS, LAYERS, ROTATIONS, TILE_SIZE } from '@avo/constants.js'
import Entity from '@avo/entity/entity.js'
import Passenger from './passenger.js'

const NEARBY_DISTANCE = TILE_SIZE * 2

export default class CarSpawnZone extends Entity {
  constructor(app, col = 0, row = 0, direction) {
    super(app)
    this._type = 'car-spawn-zone'

    this.colour = '#e080e0'
    this.col = col
    this.row = row

    this.size = TILE_SIZE * 2
    this.solid = false
    this.movable = false

    // Dynamically determine the ID and label of this CarSpawnZone.
    this.id = 0
    app.entities.filter(entity => entity._type === this._type).forEach(entity => {
      this.id = Math.max(this.id, entity.id + 1)
    })
    this.label = 'abcdefghijklmnopqrstuvwxyz'[this.id] || '?'

    switch (direction) {
      case DIRECTIONS.NORTH: this.rotation = ROTATIONS.NORTH ; break
      case DIRECTIONS.EAST: this.rotation = ROTATIONS.EAST ; break
      case DIRECTIONS.SOUTH: this.rotation = ROTATIONS.SOUTH ; break
      case DIRECTIONS.WEST: this.rotation = ROTATIONS.WEST ; break
    }
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  // Create a Passenger at this PassengerSpawnZone.
  spawnCar () {
    const app = this._app
    app.addEntity(new Passenger(app, this.col, this.row, this.direction))
  }
}
