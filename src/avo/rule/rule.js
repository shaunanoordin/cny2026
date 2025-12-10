export default class Rule {
  constructor (app) {
    this._app = app
    this._type = 'rule'
    this.name = ''  // Optional identifier

    // Expired rules are removed at the end of the cycle.
    this._expired = false
  }

  deconstructor () {}

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  play () {}

  paint (layer = 0) {}
}
