import Entity from '../entity.js'

export default class Creature extends Entity {
  constructor (app) {
    super(app)
    this._type = 'creature'
  }
}