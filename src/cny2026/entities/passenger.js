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

import { LAYERS, TILE_SIZE } from '@avo/constants.js'
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
    const app = this._app
    const c2d = app.canvas2d

    // Debug
    if (!this.pickedUp && layer === LAYERS.MIDDLE) {
      app.applyCameraTransforms()

      c2d.fillStyle = this.colour
      c2d.strokeStyle = '#404040'
      c2d.lineWidth = 2
      c2d.beginPath()
      c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
      c2d.fill()
      this.solid && c2d.stroke()

      const passenger = this.passenger
      if (passenger) {
        c2d.fillStyle = passenger.colour
        c2d.lineWidth = 1
        c2d.beginPath()
        c2d.arc(this.x, this.y - 1, passenger.size / 2.5, 0, 2 * Math.PI)
        c2d.fill()
        this.solid && c2d.stroke()
      }

      app.undoCameraTransforms()
    }
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
