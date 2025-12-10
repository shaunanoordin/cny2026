import Story from '../story'
import ImageAsset from '@avo/image-asset.js'

import Hero from '@avo/entity/examples/hero.js'
import Wall from '@avo/entity/examples/wall.js'
import Ball from '@avo/entity/examples/ball.js'
import Enemy from '@avo/entity/examples/enemy.js'

import ZeldaControls from '@avo/rule/examples/zelda-controls.js'

export default class ExampleStory extends Story {
  constructor (app) {
    super(app)

    this.assets = {
      "hero-4dir": new ImageAsset('assets/avo-sprites-2022-05-samiel.png'),
    }
  }

  start () {
    super.start()
    this.generate_zelda_default()
  }

  /*
  Default top-down adventure level.
   */
  generate_zelda_default () {
    const app = this._app

    app.hero = app.addEntity(new Hero(app, 11, 1))
    app.camera.target = app.hero

    app.addRule(new ZeldaControls(app))

    app.addEntity(new Wall(app, 0, 0, 1, 23))  // West Wall
    app.addEntity(new Wall(app, 22, 0, 1, 23))  // East Wall
    app.addEntity(new Wall(app, 1, 0, 21, 1))  // North Wall
    app.addEntity(new Wall(app, 1, 22, 21, 1))  // South Wall
    app.addEntity(new Wall(app, 3, 2, 3, 1))
    app.addEntity(new Wall(app, 3, 4, 3, 1))

    app.addEntity(new Ball(app, 8, 6))

    const enemy = app.addEntity(new Enemy(app, 4, 8))
    enemy.rotation = -45 / 180 * Math.PI
  }
}
