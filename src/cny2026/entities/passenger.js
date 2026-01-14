/*
Passenger
A Passenger is an NPC that can be picked up by the Hero, to be delivered to a
designated Drop Off Zone.

Rules:
- When the Hero doesn't already have an attached Passenger, and the Hero comes
  within a certain radius of a Passenger, that Passenger gets attached to the
  Hero.
- A Passenger has a destination Drop Off Zone.
- A Passenger that has reached their destination is marked as "successfully
  dropped off", and will disappear after a short while.
 */

import { LAYERS, TILE_SIZE } from '@avo/constants.js'
import Creature from '@avo/entity/types/creature.js'

const PICKUP_RADIUS = TILE_SIZE * 2
const PICKUP_COOLDOWN_DURATION = 60
const EXPIRY_DURATION = 60

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

    this.pickedUp = false  // Indicates if a passenger is picked up by the hero.
    this.pickUpCooldown = 0  // Once a passenger is dropped, it can't be picked up for a while.
    this.destinationReached = false  // Once the destination has been reached, 
    this.expiryCountdown = 0

    // Dynamically determine the destination DropOffZone of this passenger.
    this.destination = 0
    this.label = ''
    const dropOffZones = app.entities.filter(entity => entity._type === 'drop-off-zone')
    if (dropOffZones.length > 1) {
      const randomIndex = Math.floor(Math.random() * dropOffZones.length)
      this.destination = dropOffZones[randomIndex].id
      this.label = dropOffZones[randomIndex].label
    }
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()

    const app = this._app
    const hero = app.hero

    // If Passenger has reached their destination, they're free to disappear.
    if (this.destinationReached) {
      this.expiryCountdown--
      if (this.expiryCountdown <= 0) { this._expired = true }
      return
    }

    // Pick up this Passenger if Hero is nearby and available.
    if (this.pickUpCooldown > 0) {
      this.pickUpCooldown--
    } else if (hero && !hero.passenger && !this.pickedUp) {
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
    if (
      (!this.pickedUp && layer === LAYERS.MIDDLE)
      || (this.pickedUp && layer === LAYERS.TOP)
    ) {
      app.applyCameraTransforms()

      // Paint shape
      c2d.fillStyle = this.colour
      c2d.strokeStyle = '#404040'
      c2d.lineWidth = 2
      c2d.beginPath()
      c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
      c2d.fill()
      this.solid && c2d.stroke()

      // Paint label
      c2d.font = `24px monospace`
      c2d.fillStyle = '#ffffff'
      c2d.textBaseline = 'middle'
      c2d.textAlign = 'center'
      c2d.fillText(this.label, this.x, this.y)

      app.undoCameraTransforms()
    }
  }

  onPickUp () {
    if (this.destinationReached) return
    this.solid = false
    this.pickedUp = true
    this.size = TILE_SIZE - 4

    this._app.rules.get('sound-manager').playPickUp()
  }

  onDropOff () {
    if (this.destinationReached) return
    // this.solid = false  // Keep Passenger un-solid to prevent additional collisions.
    this.pickedUp = false
    this.size = TILE_SIZE
    this.pickUpCooldown = PICKUP_COOLDOWN_DURATION

    this._app.rules.get('sound-manager').playDropOff()
  }

  onDestinationReached () {
    if (this.destinationReached) return
    this.solid = false
    this.destinationReached = true
    this.expiryCountdown = EXPIRY_DURATION

    this._app.rules.get('sound-manager').playDestinationReached()
  }
}
