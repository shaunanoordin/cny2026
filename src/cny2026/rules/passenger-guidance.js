/*
Passenger Guidance
This Rule adds a UI overlay that helps direct players to passengers, or the
destination of a carried passenger.
 */

import Rule from '@avo/rule'
import { TILE_SIZE, LAYERS } from '@avo/constants.js'

const GUIDANCE_RADIUS = TILE_SIZE * 4
const DESINTATION_ARROW_WIDTH_ANGLE = 0.1
const DESTINATION_ARROW_BASE_LENGTH = TILE_SIZE * 3.5

export default class PassengerGuidance extends Rule {
  constructor (app) {
    super(app)
    this._type = 'passenger-directions'
  }

  paint (layer) {
    if (layer === LAYERS.OVERLAY) {
      const app = this._app
      const hero = app.hero
      const passenger = hero?.passenger

      if (passenger) {
        const dropOffZones = app.entities.filter(entity => entity._type === 'drop-off-zone')

        const c2d = app.canvas2d
        const MID_X = app.canvasWidth / 2
        const MID_Y = app.canvasHeight / 2

        // Guidance circle
        c2d.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        c2d.lineWidth = 2
        c2d.beginPath()
        c2d.arc(MID_X, MID_Y, GUIDANCE_RADIUS, 0, 2 * Math.PI)
        c2d.stroke()
        c2d.closePath()

        // Destination arrow.
        const destination = dropOffZones.find(zone => zone.id === passenger.destination)
        if (!destination) return
        
        const distX = destination.x - hero.x
        const distY = destination.y - hero.y
        const dist = Math.sqrt(distY * distY + distX * distX)
        const angle = Math.atan2(distY, distX)
        const { cos, sin } = Math

        if (dist > GUIDANCE_RADIUS) {
          switch (passenger.destination) {
            case 0: c2d.fillStyle = 'hsla(60, 80%, 60%, 0.5)'; break;
            case 1: c2d.fillStyle = 'hsla(210, 80%, 60%, 0.5)'; break;
            case 2: c2d.fillStyle = 'hsla(120, 80%, 60%, 0.5)'; break;
            case 3: c2d.fillStyle = 'hsla(330, 80%, 60%, 0.5)'; break;
            default: c2d.fillStyle = 'hsla(0, 0%, 100%, 0.5)'
          }
          c2d.strokeStyle = 'hsla(0, 0%, 100%, 0.5)'
          c2d.lineWidth = 2

          c2d.beginPath()
          c2d.moveTo(
            MID_X + cos(angle) * GUIDANCE_RADIUS,
            MID_Y + sin(angle) * GUIDANCE_RADIUS
          )
          c2d.lineTo(
            MID_X + cos(angle + DESINTATION_ARROW_WIDTH_ANGLE) * DESTINATION_ARROW_BASE_LENGTH,
            MID_Y + sin(angle + DESINTATION_ARROW_WIDTH_ANGLE) * DESTINATION_ARROW_BASE_LENGTH
          )
          c2d.lineTo(
            MID_X + cos(angle - DESINTATION_ARROW_WIDTH_ANGLE) * DESTINATION_ARROW_BASE_LENGTH,
            MID_Y + sin(angle - DESINTATION_ARROW_WIDTH_ANGLE) * DESTINATION_ARROW_BASE_LENGTH
          )
          c2d.closePath()
          c2d.fill()
          c2d.stroke()
        }

      }
    }
  }
}