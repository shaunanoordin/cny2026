import Tile from '@avo/tile'
import { LAYERS } from '@avo/constants.js'

export default class StreetTile extends Tile {
  constructor (app, col = 0, row = 0) {
    super(app, col, row)
    this._type = 'floor-tile'

    this.colour = '#f0f0f0'
    this.solid = false

    this.spriteSheet = app.assets['map'].img
    this.floorSpriteCol = 5
    this.floorSpriteRow = 6
  }

  paint (layer = 0) {
    if (layer === LAYERS.BOTTOM) {
      this.paintSprite({
        spriteCol: this.floorSpriteCol,
        spriteRow: this.floorSpriteRow,
      })
    }
  }
}
