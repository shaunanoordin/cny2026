/*
Spawn Zone
A Spawn Zone will periodically spawn Passengers.

Rules:
- A Spawn Zone doesn't actually trigger its own spawnPassenger() action, but
  it's instead triggered by a CNY 2026 Game Manager.
 */

import { LAYERS, TILE_SIZE } from '@avo/constants.js'
import Entity from '@avo/entity/entity.js'
import Passenger from './passenger.js'

const NEARBY_DISTANCE = TILE_SIZE * 2

export default class DropOffZone extends Entity {
  constructor(app, col = 0, row = 0) {
    super(app)
    this._type = 'spawn-zone'

    this.colour = '#80e0e0'
    this.col = col
    this.row = row

    this.size = TILE_SIZE * 2
    this.solid = false
    this.movable = false

    // Dynamically determine the ID and label of this SpawnZone.
    this.id = 0
    app.entities.filter(entity => entity._type === this._type).forEach(entity => {
      this.id = Math.max(this.id, entity.id + 1)
    })
    this.label = 'abcdefghijklmnopqrstuvwxyz'[this.id] || '?'
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  paint(layer = 0) {
    const app = this._app
    const c2d = app.canvas2d

    // Debug
    if (layer === LAYERS.BOTTOM) {
      app.applyCameraTransforms()

      c2d.fillStyle = this.colour
      c2d.beginPath()
      c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
      c2d.fill()

      c2d.font = `32px monospace`
      c2d.fillStyle = '#ffffff'
      c2d.textBaseline = 'middle'
      c2d.textAlign = 'center'
      c2d.fillText(this.label, this.x, this.y)

      app.undoCameraTransforms()
    }
  }

  // Create a Passenger at this SpawnZone.
  spawnPassenger () {
    const app = this._app
    app.addEntity(new Passenger(app, this.col, this.row))
  }

  // Check if there are Passengers near this SpawnZone.
  checkForNearbyPassengers () {
    const app = this._app
    return app.entities.filter(entity => {
      if (entity._type !== 'passenger') return false
      const distX = entity.x - this.x
      const distY = entity.y - this.y
      const distSq = distX * distX + distY * distY
      return distSq <= NEARBY_DISTANCE * NEARBY_DISTANCE
    })
  }
}
