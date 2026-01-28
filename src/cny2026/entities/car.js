/*
Car
A Car is an NPC and obstacle (an enemy, you might say) that goes zoom zoom
across the city.

Rules:
- A Car attempts to go from one side of the city to another. It should at one
  end of a spawn at of a North-South street or an East-West street, and proceed
  to travel to the other side.
- A Car is assigned one the cardinal directions.
- A Car continuously accelerates in that direction until it reaches top speed.
- If a Car exceeds the bounds of the map IN THE DIRECTION IT'S TRAVELLING then
  it has reached its destination and disappears.
- If a Car exists for too long on the map it harmlessly explodes. This is to
  prevent too many cars getting accidentally caught on houses and etc.
 */

import {
  DIRECTIONS,
  FRAMES_PER_SECOND,
  ROTATIONS,
  TILE_SIZE,
} from '@avo/constants.js'
import Creature from '@avo/entity/types/creature.js'

const MAX_LIFE_TIMER = 10 * FRAMES_PER_SECOND
const EXPLOSION_DURATION = 2 * FRAMES_PER_SECOND
const STATES = {
  ACTIVE: 0,
  EXPLODING: 1,
}

export default class Car extends Creature {
  constructor (app, col = 0, row = 0, direction) {
    super(app)
    this._type = 'car'
 
    this.colour = '#a040a0'
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

    // Physics: make the car go zoom zoom.
    this.size = TILE_SIZE * 1.5
    this.mass = 20
    this._moveAcceleration = 0.6
    this._pushDeceleration = 0.2
    this._pushMaxSpeed = 16
    
    switch (direction) {
      case DIRECTIONS.NORTH: this.rotation = ROTATIONS.NORTH ; break
      case DIRECTIONS.EAST: this.rotation = ROTATIONS.EAST ; break
      case DIRECTIONS.SOUTH: this.rotation = ROTATIONS.SOUTH ; break
      case DIRECTIONS.WEST: this.rotation = ROTATIONS.WEST ; break
    }

    this.state = STATES.ACTIVE
    this.lifeTimer = 0
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()

    if (this.state === STATES.ACTIVE) {
      this.pushX += this.moveAcceleration * Math.cos(this.rotation)
      this.pushY += this.moveAcceleration * Math.sin(this.rotation)

      if (this.lifeTimer >= MAX_LIFE_TIMER) {
        this.state = STATES.EXPLODING
        this.solid = false
        this.lifeTimer = 0
      }
      this.lifeTimer++

    } else if (this.state === STATES.EXPLODING) {
      
      if (this.lifeTimer >= EXPLOSION_DURATION) {
        this._expired = true
      }
      this.lifeTimer++
    }
  }

  paint (layer = 0) {
    super.paint(layer)
  }
}
