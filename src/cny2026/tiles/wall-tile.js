import Tile from '@avo/tile'
import { LAYERS } from '@avo/constants.js'

export default class WallTile extends Tile {
  constructor (app, col = 0, row = 0) {
    super(app, col, row)
    this._type = 'wall-tile'

    this.colour = '#808080'
    this.solid = true

    this.spriteSheet = app.assets['map'].img
    this.ceilingSpriteCol = 0
    this.ceilingSpriteRow = 0
    this.wallSpriteCol = 0
    this.wallSpriteRow = 4
  }

  paint (layer = 0) {
    if (layer === LAYERS.BOTTOM) {
      this.paintSprite({
        spriteRow: this.wallSpriteRow,
        spriteCol: this.wallSpriteCol,
      })
    } else if (layer === LAYERS.TOP) {
      this.paintSprite({
        spriteRow: this.ceilingSpriteRow,
        spriteCol: this.ceilingSpriteCol,
        spriteOffsetY: -24
      })
    }
  }
}
