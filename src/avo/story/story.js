export default class Story {
  constructor (app) {
    this._app = app
    this.assets = {}
  }

  /*
  Section: Main Scripts
  ----------------------------------------------------------------------------
   */

  start () {
    this.reset()
  }

  reset () {
    const app = this._app
    app.hero = undefined
    app.clearEntities()
    app.resetGameMap()
    app.clearRules()
    app.resetCamera()
    app.resetPlayerInput()
    app.setInteractionMenu(false)
  }

  reload () {
    this.start()
  }
}
