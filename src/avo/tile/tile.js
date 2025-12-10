import { TILE_SIZE, SHAPES, LAYERS, TILE_ADJACENCIES } from '@avo/constants.js'

export default class Tile {
  constructor (app, col = 0, row = 0) {
    this._app = app
    this._type = 'tile'

    this.colour = '#f0f0f0'
    this.solid = false
    this.movable = false
    this.mass = 100

    this.x = 0  // This will be set by col
    this.y = 0  // This will be set by row
    this.col = col
    this.row = row
    this.size = TILE_SIZE
    this.shape = SHAPES.SQUARE

    // Animation
    this.spriteSheet = undefined  // // Image object (e.g. app.assets['map'].img)
    this.spriteSizeX = 16  // Size of each sprite on the sprite sheet
    this.spriteSizeY = 16
    this.spriteScale = 2  // Scale of the sprite when paint()ed
    this.spriteOffsetX = -8  // Offset of the sprite when paint()ed
    this.spriteOffsetY = -8
  }

  play () {
    console.error('Tile.play() should never be called.')
  }

  paint (layer) {
    const c2d = this._app.canvas2d
    this._app.applyCameraTransforms()

    if (layer === LAYERS.BOTTOM) {
      c2d.fillStyle = this.colour
      c2d.strokeStyle = '#ffffff'
      c2d.lineWidth = 1
      c2d.beginPath()
      c2d.rect(Math.floor(this.x - this.size / 2), Math.floor(this.y - this.size / 2), this.size, this.size)
      c2d.fill()
      c2d.stroke()
    }

    this._app.undoCameraTransforms()
  }

  /*
  Paint the tiles's sprite, at the tile's position.
  Note: only specify values for args if you want to override the automatic
  calculations.
   */
  paintSprite (args = {
    spriteCol: undefined,
    spriteRow: undefined,
    spriteOffsetX: undefined,
    spriteOffsetY: undefined,
    spriteScale: undefined,
  }) {
    const app = this._app
    const c2d = app.canvas2d
    if (!this.spriteSheet) return

    app.applyCameraTransforms()

    const srcX = (args?.spriteCol ?? this.getSpriteCol()) * this.spriteSizeX
    const srcY = (args?.spriteRow ?? this.getSpriteRow()) * this.spriteSizeY
    const sizeX = this.spriteSizeX
    const sizeY = this.spriteSizeY
    const scale = args?.spriteScale ?? this.spriteScale

    c2d.translate(this.x, this.y)
    c2d.scale(scale, scale)

    const tgtX = args?.spriteOffsetX ?? this.spriteOffsetX
    const tgtY = args?.spriteOffsetY ?? this.spriteOffsetY

    c2d.drawImage(this.spriteSheet,
      srcX, srcY, sizeX, sizeY,
      tgtX, tgtY, sizeX, sizeY
    )

    app.undoCameraTransforms()
  }

  /*
  Section: Event Handling
  ----------------------------------------------------------------------------
   */

  onCollision (target, collisionCorrection) {}

  /*
  Section: Animation
  ----------------------------------------------------------------------------
   */
  
  getSpriteCol () { return 0 }
  getSpriteRow () { return 0 }

  /*
  Section: Map Logic
  ----------------------------------------------------------------------------
   */
  
  /*
  Checks if this tile has similar neighbour tiles. Returns an integer from 0 to
  15, that indicates on which directions (NESW) that there's a similar tile.
  (e.g. a return value of 3 indicates there's a tile similar to this tile on the
  NORTH, and another one on the EAST. the See TILE_ADJACENCIES for details.)
  This function is usually used to see if a map tile should be "contiguous" with
  its neighbours.
   */
  checkSimilarAdjacencies () {
    let adjacencies = 0

    if (this.getAdjacentTile(TILE_ADJACENCIES.NORTH)?._type === this._type) adjacencies += TILE_ADJACENCIES.NORTH
    if (this.getAdjacentTile(TILE_ADJACENCIES.EAST)?._type === this._type) adjacencies += TILE_ADJACENCIES.EAST
    if (this.getAdjacentTile(TILE_ADJACENCIES.SOUTH)?._type === this._type) adjacencies += TILE_ADJACENCIES.SOUTH
    if (this.getAdjacentTile(TILE_ADJACENCIES.WEST)?._type === this._type) adjacencies += TILE_ADJACENCIES.WEST

    return adjacencies
  }

  getAdjacentTile (adjacencyDirection) {
    if (!adjacencyDirection) return null
    let colOffset = 0, rowOffset = 0

    switch (adjacencyDirection) {
      case TILE_ADJACENCIES.NORTH: rowOffset-- ; break
      case TILE_ADJACENCIES.EAST: colOffset++ ; break
      case TILE_ADJACENCIES.SOUTH: rowOffset++ ; break
      case TILE_ADJACENCIES.WEST: colOffset-- ; break
    }
    if (rowOffset === 0 && colOffset === 0) return null

    return this._app.gameMap.tiles?.[this.row + rowOffset]?.[this.col + colOffset]
  }

  /*
  Section: Getters and Setters
  ----------------------------------------------------------------------------
   */

  get left () { return this.x - this.size / 2 }
  get right () { return this.x + this.size / 2 }
  get top () { return this.y - this.size / 2 }
  get bottom () { return this.y + this.size / 2 }

  set left (val) { this.x = val + this.size / 2 }
  set right (val) { this.x = val - this.size / 2 }
  set top (val) { this.y = val + this.size / 2 }
  set bottom (val) { this.y = val - this.size / 2 }

  get col () { return Math.floor(this.x / TILE_SIZE) }
  get row () { return Math.floor(this.y / TILE_SIZE) }

  set col (val) { this.x = val * TILE_SIZE + TILE_SIZE / 2 }
  set row (val) { this.y = val * TILE_SIZE + TILE_SIZE / 2 }

  get vertices () {
    return [
      { x: this.left, y: this.top },
      { x: this.right, y: this.top },
      { x: this.right, y: this.bottom },
      { x: this.left, y: this.bottom }
    ]
  }

  set vertices (val) { console.error('ERROR: Tile.vertices is read only') }

  get segments () {
    const vertices = this.vertices
    if (vertices.length < 2) return []
    return vertices.map((vertex1, i) => {
      const vertex2 = vertices[(i + 1) % vertices.length]
      return {
        start: {
          x: vertex1.x,
          y: vertex1.y,
        },
        end: {
          x: vertex2.x,
          y: vertex2.y,
        },
      }
    })
  }

  set segments (val) { console.error('ERROR: Tile.segments is read only') }
}
