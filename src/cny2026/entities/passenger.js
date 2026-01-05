import Creature from '@avo/entity/types/creature.js'

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
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()
  }

  paint (layer = 0) {
    super.paint(layer)
    this.paintShadow(layer)
  }
}
