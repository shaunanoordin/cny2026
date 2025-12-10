import { GameAI } from '@avo/game-ai.js'
import Creature from '@avo/entity/types/creature.js'
import { LAYERS, TILE_SIZE } from '@avo/constants.js'

const FRAMES_TO_WAIT_BETWEEN_SEEKING_HERO = 6

export default class ChaserEnemy extends Creature {
  constructor (app, col = 0, row = 0) {
    super(app)
    this._type = 'chaser-enemy'

    this.colour = '#008080'
    this.size = TILE_SIZE
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2

    // Convert map tiles to a 2D array of 0s (floors) and 1s (walls)
    // e.g. [[0, 1], [0, 1]]
    this.simplifiedGameMap = app.gameMap.tiles.map(row => row.map(tile => tile.solid ? 1 : 0))

    this.seekHeroCounter = 0  // When this hits 0, it's time to find a new path to the Hero.
    this.pathToHero = []
  }

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {
    super.play()

    if (this.seekHeroCounter <= 0) {
      this.seekHero()
    } else {
      this.seekHeroCounter--
    }

    this.moveToHero()

    // TODO: if entity can see Hero directly, just make a beeline to the Hero.
  }

  /*
  Finds a path to the Hero.
   */
  seekHero () {
    const app = this._app
    const hero = app.hero

    // Wait a period of time before seeking the hero again.
    this.seekHeroCounter = FRAMES_TO_WAIT_BETWEEN_SEEKING_HERO

    // If there's no hero, wait around.
    if (!hero) {
      this.pathToHero = []
      return
    }

    // Calculate pathToHero.
    const startTile = { x: this.col, y: this.row }  // Position of this entity
    const goalTile = { x: hero.col, y: hero.row }  // Position of the Hero
    this.pathToHero = GameAI.findPath(startTile, goalTile, this.simplifiedGameMap)
  }

  /*
  Attempt to move to the Hero, following the pathToHero. 
   */
  moveToHero() {
    const pathToHero = this.pathToHero

    if (!pathToHero || pathToHero.length <= 1) return

    const tgtX = (pathToHero[1].x + 0.5) * TILE_SIZE  // Note: pathToHero[0] is usually where the entity is standing
    const tgtY = (pathToHero[1].y + 0.5) * TILE_SIZE
    const distX = tgtX - this.x
    const distY = tgtY - this.y

    if (distX !== 0 || distY !== 0) {      
      this.rotation = Math.atan2(distY, distX)
    }

    const MOVSPD = 2
    this.moveX = MOVSPD * Math.cos(this.rotation)
    this.moveY = MOVSPD * Math.sin(this.rotation)
  }

  paint (layer = 0) {
    super.paint(layer)
    const app = this._app
    const c2d = app.canvas2d
    const pathToHero = this.pathToHero
    
    if (layer === LAYERS.BOTTOM && pathToHero.length > 0) {
      app.applyCameraTransforms()

      c2d.strokeStyle = '#00808080'
      c2d.lineWidth = 4
      c2d.beginPath()
      c2d.moveTo(this.x, this.y)
      pathToHero.forEach(tile => {
        const tgtX = (tile.x + 0.5) * TILE_SIZE
        const tgtY = (tile.y + 0.5) * TILE_SIZE
        c2d.lineTo(tgtX, tgtY)
      })
      c2d.stroke()
      app.undoCameraTransforms()
    }
  }
}
