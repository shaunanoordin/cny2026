/*
Passenger
A Passenger is an NPC that can be picked up by the Hero, to be delivered to a
designated Drop Off Zone.

Rules:
- When the Hero doesn't already have an attached Passenger, and the Hero comes
  within a certain radius of a Passenger, that Passenger gets attached to the
  Hero.
- A Passenger has a destination Drop Off Zone.
 */

import { TILE_SIZE } from '@avo/constants.js'
import Creature from '@avo/entity/types/creature.js'

const PICKUP_RADIUS = TILE_SIZE * 2

export default class Passenger extends Creature {
  constructor (app, col = 0, row = 0) {
    super(app)
    this._type = 'passenger'

    this.colour = '#c0c040'
    this.col = col
    this.row = row

    this.intent = undefined
    this.action = undefined

    this.spriteSheet = undefined
    this.spriteSizeX = 24
    this.spriteSizeY = 24
    this.spriteScale = 2
    this.spriteOffsetX = -12
    this.spriteOffsetY = -18
    this.spriteFlipEastToWest = true

    this.pickedUp = false
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()

    const app = this._app
    const hero = app.hero

    // Pick up this Passenger if Hero is nearby and available.
    if (hero && !hero.passenger && !this.pickedUp) {
      const distX = hero.x - this.x
      const distY = hero.y - this.y
      const dist = Math.sqrt(distY * distY + distX * distX)

      if (dist <= PICKUP_RADIUS) {
        hero.pickUp(this)
      }
    }
  }

  paint (layer = 0) {
    super.paint(layer)
    this.paintShadow(layer)
  }

  onPickUp (target) {
    this.solid = false
    this.pickedUp = true
  }

  onDropOff () {
    this.solid = false  // Keep Passenger un-solid to prevent additional collisions.
    this.pickedUp = false
  }
}
