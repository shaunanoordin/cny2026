import { TILE_SIZE } from '@avo/constants.js'
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
    super.paint(layer)
    this.paintShadow(layer)
  }
}
