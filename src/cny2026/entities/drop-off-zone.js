/*
Drop Off Zone
A Drop Off Zone is the destination of a passenger.

Rules:
- When a Hero is carrying a matching Passenger (a matching Passenger is one
  whose destination is this Drop Off Zone), that Passenger is dropped off
  (detached from the Hero).
- When a matching, non-carried Passenger touches the Drop Off Zone, that
  Passenger is successfully added to the score.
- The first rule will trigger the second rule on the next frame. However,
  the second rule doesn't necessarily require the first rule - it's possible
  to knock a passenger to their destination.
 */

import { LAYERS, TILE_SIZE } from '@avo/constants.js'
import Entity from '@avo/entity/entity.js'

export default class DropOffZone extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    this._type = 'drop-off-zone'

    this.colour = '#e0e080'
    this.col = col
    this.row = row

    this.size = TILE_SIZE * 2
    this.solid = false

  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()
  }

  paint (layer = 0) {
    const app = this._app
    const c2d = app.canvas2d

    // Debug
    if (layer === LAYERS.BOTTOM) {
      app.applyCameraTransforms()

      c2d.fillStyle = this.colour
      c2d.beginPath()
      c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
      c2d.fill()

      app.undoCameraTransforms()
    }
  }

  onCollision (target, collisionCorrection) {
    super.onCollision(target, collisionCorrection)
    
    const hero = this._app.hero

    if (target === hero && hero?.passenger) {
      hero.dropOff()
    } else if (
      target._type === 'passenger'
      && !target.pickedUp
      // TODO: also add destination check
    ) {
      console.log('HOORAY')
      target._expired = true
    }
  }
}
