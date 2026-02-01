/*
Player Bounds
The Hero must always remain within the bounds of the game map.
 */

import Rule from '@avo/rule'
import { TILE_SIZE } from '@avo/constants.js'

export default class PlayerBounds extends Rule {
  constructor (app) {
    super(app)
    this._type = 'player-bounds'
  }

  play () {
    const hero = this._app.hero
    const gameMap = this._app.gameMap

    if (!hero || !gameMap || !gameMap.width || !gameMap.height) return

    const MIN_X = 0
    const MIN_Y = 0
    const MAX_X = gameMap.width * TILE_SIZE - 1
    const MAX_Y = gameMap.height * TILE_SIZE - 1
    
    if (hero.x < MIN_X) {
      hero.x = MIN_X
      hero.moveX = -hero.moveX
      hero.pushX = -hero.pushX
    }

    if (hero.x > MAX_X) {
      hero.x = MAX_X
      hero.moveX = -hero.moveX
      hero.pushX = -hero.pushX
    }

    if (hero.y < MIN_Y) {
      hero.y = MIN_Y
      hero.moveY = -hero.moveY
      hero.pushY = -hero.pushY
    }

    if (hero.y > MAX_Y) {
      hero.y = MAX_Y
      hero.moveY = -hero.moveY
      hero.pushY = -hero.pushY
    }
  }
}