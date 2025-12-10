import Rule from '@avo/rule'
import Physics from '@avo/physics.js'
import { LAYERS, POINTER_DEADZONE_RADIUS, POINTER_STATES, TILE_SIZE } from '@avo/constants.js'

/*
Standard player controls for top-down adventure games.
 */
export default class PlayerControls extends Rule {
  constructor (app) {
    super(app)
    this._type = 'player-controls'
    this.inputTap = false
    this.chargeUpStart = false
    this.chargeUpEnd = false
    
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    app.addEventListener('keydown', this.onKeyDown)
    app.addEventListener('keyup', this.onKeyUp)

    this.onPointerTap = this.onPointerTap.bind(this)
    app.addEventListener('pointertap', this.onPointerTap)
  }

  deconstructor () {
    app.removeEventListener('keydown', this.onKeyDown)
    app.removeEventListener('keyup', this.onKeyUp)
    app.removeEventListener('pointertap', this.onPointerTap)
  }

  play () {
    const app = this._app
    const hero = app.hero
    super.play()

    if (hero) {
      const {
        keysPressed,
        pointerCurrent,
        pointerStart,
        pointerState,
      } = app.playerInput
      let intent = undefined
      let directionX = 0
      let directionY = 0

      if (pointerState === POINTER_STATES.POINTER_DOWN) {
        // Get pointer input if there's any.

        const distX = pointerCurrent.x - pointerStart.x
        const distY = pointerCurrent.y - pointerStart.y
        const pointerDistance = Math.sqrt(distX * distX + distY * distY)
        // const movementAngle = Math.atan2(distY, distX)

        if (pointerDistance > POINTER_DEADZONE_RADIUS) {
          directionX = distX / pointerDistance
          directionY = distY / pointerDistance
        }

      } else {
        // Otherwise, check for keyboard input.

        if (keysPressed['ArrowRight']) directionX++
        if (keysPressed['ArrowDown']) directionY++
        if (keysPressed['ArrowLeft']) directionX--
        if (keysPressed['ArrowUp']) directionY--
      }
      
      // Charge Up action
      if (this.chargeUpStart && !this.chargeUpEnd) {
        this.chargeUpStart = false
        intent = {
          name: 'charging',
          directionX,
          directionY,
        }
      } else if (this.chargeUpEnd) {
        this.chargeUpStart = false
        this.chargeUpEnd = false
        intent = {
          name: 'skill',
          directionX,
          directionY,
        }
      }
      
      // Move action
      if (!intent && (directionX || directionY)) {
        intent = {
          name: 'move',
          directionX,
          directionY,
        }
      }

      hero.intent = intent
    }
  }

  paint (layer = 0) {
    const hero = this._app.hero

    if (layer === LAYERS.OVERLAY) {
      this.paintUIData()
      this.paintPointerInput()

    } else if (layer === LAYERS.BOTTOM) {
      this.paintLineOfSight(hero)
    }
  }
  
  /*
  Draw UI data, such as Hero health.
   */
  paintUIData () {
    const c2d = this._app.canvas2d
    const hero = this._app.hero

    const X_OFFSET = TILE_SIZE * 1.5
    const Y_OFFSET = TILE_SIZE * -1.0
    const LEFT = X_OFFSET
    const RIGHT = this._app.canvasWidth - X_OFFSET
    const TOP = -Y_OFFSET
    const BOTTOM = this._app.canvasHeight + Y_OFFSET
    c2d.font = '2em Source Code Pro'
    c2d.textBaseline = 'bottom'
    c2d.lineWidth = 8

    const health = Math.max(hero?.health, 0) || 0
    let text = '❤️'.repeat(health)
    c2d.textAlign = 'left'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, LEFT, BOTTOM)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, LEFT, BOTTOM)

    if (hero?.action?.name === 'idle' || hero?.action?.name === 'move') {
      text = hero?.action?.name + ' (' + hero?.moveSpeed.toFixed(2) + ')'
    } else if (hero?.action?.name === 'charging') {
      text = hero?.action?.name + ' (' + hero?.action?.counter?.toFixed(0) + ')'
    } else if (hero?.action?.name === 'skill') {
      text = hero?.action?.name + ' (' + hero?.action?.power?.toFixed(0) + ')'
    } else {
      text = hero?.action?.name
    }

    c2d.textAlign = 'right'
    c2d.strokeStyle = '#fff'
    c2d.strokeText(text, RIGHT, BOTTOM)
    c2d.fillStyle = '#c04040'
    c2d.fillText(text, RIGHT, BOTTOM)
  }

  /*
  Draw pointer input, if any. This helps players get visual feedback on their
  touchscreens.
   */
  paintPointerInput () {
    const c2d = this._app.canvas2d
    const {
      pointerCurrent,
      pointerStart,
      pointerState,
    } = this._app.playerInput
    const START_POINT_RADIUS = TILE_SIZE * 1, CURRENT_POINT_RADIUS = TILE_SIZE * 0.5
    
    if (pointerState === POINTER_STATES.POINTER_DOWN) {
      c2d.lineWidth = Math.floor(Math.min(TILE_SIZE * 0.125, 2))
      c2d.fillStyle = '#80808080'
      c2d.strokeStyle = '#80808080'

      c2d.beginPath()
      c2d.arc(pointerStart.x, pointerStart.y, START_POINT_RADIUS, 0, 2 * Math.PI)
      c2d.stroke()

      c2d.beginPath()
      c2d.arc(pointerCurrent.x, pointerCurrent.y, CURRENT_POINT_RADIUS, 0, 2 * Math.PI)
      c2d.fill()

      c2d.beginPath()
      c2d.moveTo(pointerStart.x, pointerStart.y)
      c2d.lineTo(pointerCurrent.x, pointerCurrent.y)
      c2d.stroke()
    }
  }

  /*
  Draw a line of sight (cast a ray) starting from a specified Entity (usually the
  hero), in the direction they're facing.
   */
  paintLineOfSight (srcEntity, losMaxDistance = TILE_SIZE * 4) {
    if (!srcEntity) return
    const c2d = this._app.canvas2d
    const entities = this._app.entities
    const tiles = this._app.gameMap.tiles

    this._app.applyCameraTransforms()

    // Intended line of sight, i.e. a ray starting from the hero/source Entity.
    const lineOfSight = {
      start: {
        x: srcEntity.x,
        y: srcEntity.y,
      },
      end: {
        x: srcEntity.x + losMaxDistance * Math.cos(srcEntity.rotation),
        y: srcEntity.y + losMaxDistance * Math.sin(srcEntity.rotation),
      }
    }
    const lineOfSightAngle = srcEntity.rotation

    let actualLineOfSightEndPoint = undefined

    // For each other Entity, see if it intersects with the source Entity's LOS
    entities.forEach(entity => {
      if (entity === srcEntity) return

      // TODO: check for opaqueness and/or if the entity is visible.

      // We want to cehck if the line intersects with any segment of the
      // entity's polygonal shape (or polygon-approximated shape).
      const segments = entity.segments

      segments.forEach(segment => {
        // Find the intersection. We want to find the intersection point
        // closest to the source Entity (the LOS ray's starting point).
        const intersection = Physics.getLineIntersection(lineOfSight, segment)
        if (!actualLineOfSightEndPoint || (intersection && intersection.distanceFactor < actualLineOfSightEndPoint.distanceFactor)) {
          actualLineOfSightEndPoint = intersection
        }
      })
    })

    // Check if the Entity's LOS intersects with any "wall" tiles
    const losMaxDistanceInTiles = Math.ceil(losMaxDistance / TILE_SIZE)
    for (let i = 0 ; i <= losMaxDistanceInTiles ; i++) {
      // Starting from tile the Entity's standing on, draw a line following the LOS.
      // Check each tile that line intersects with.
      const x = srcEntity.x + i * Math.cos(lineOfSightAngle) * TILE_SIZE
      const y = srcEntity.y + i * Math.sin(lineOfSightAngle) * TILE_SIZE
      const col =  Math.floor(x / TILE_SIZE)
      const row =  Math.floor(y / TILE_SIZE)
      
      const tile = tiles?.[row]?.[col]
      if (!tile || !tile.solid) continue  // Skip if there's no tile, or if the tile isn't a blocking tile (i.e. not a wall) 

      // Perform the same segment check as entities
      const segments = tile.segments
      segments.forEach(segment => {
        // Find the intersection. We want to find the intersection point
        // closest to the source Entity (the LOS ray's starting point).
        const intersection = Physics.getLineIntersection(lineOfSight, segment)
        if (!actualLineOfSightEndPoint || (intersection && intersection.distanceFactor < actualLineOfSightEndPoint.distanceFactor)) {
          actualLineOfSightEndPoint = intersection
        }
      })
    }

    if (!actualLineOfSightEndPoint) {
      actualLineOfSightEndPoint = {
        x: srcEntity.x + losMaxDistance * Math.cos(srcEntity.rotation),
        y: srcEntity.y + losMaxDistance * Math.sin(srcEntity.rotation),
      }
    }

    // Expected line of sight
    c2d.beginPath()
    c2d.moveTo(lineOfSight.start.x, lineOfSight.start.y)
    c2d.lineTo(lineOfSight.end.x, lineOfSight.end.y)
    c2d.strokeStyle = '#c08080'
    c2d.lineWidth = 3
    c2d.stroke()
    c2d.setLineDash([])

    // Actual line of sight
    c2d.beginPath()
    c2d.moveTo(lineOfSight.start.x, lineOfSight.start.y)
    c2d.lineTo(actualLineOfSightEndPoint.x, actualLineOfSightEndPoint.y)
    c2d.strokeStyle = '#3399ff'
    c2d.lineWidth = 3
    c2d.stroke()

    // Expected end of line of sight
    c2d.beginPath()
    c2d.arc(lineOfSight.end.x, lineOfSight.end.y, 4, 0, 2 * Math.PI)
    c2d.fillStyle = '#c08080'
    c2d.fill()

    // Actual end of line of sight
    c2d.beginPath()
    c2d.arc(actualLineOfSightEndPoint.x, actualLineOfSightEndPoint.y, 8, 0, 2 * Math.PI)
    c2d.fillStyle = '#3399ff'
    c2d.fill()

    this._app.undoCameraTransforms()
  }

  onPointerTap () {
    this.inputTap = true
  }

  onKeyDown ({ key }) {
    const app = this._app
    if (key === 'z' || key === 'Z') {
      const keyPressed = app.playerInput.keysPressed[key]
      if (keyPressed && keyPressed.duration === 0) {
        this.chargeUpStart = key
      }
    }

    if (key === 'p' || key === 'P') {  // DEBUG
      console.log('+++ DEBUG')
      const hero = app.hero
      const tile = app.gameMap.tiles?.[hero?.row]?.[hero?.col]
      console.log('+++ tile: \n', tile?.checkSimilarAdjacencies())
    }
  }

  onKeyUp ({ key }) {
    if (key === 'z' || key === 'Z') {
      this.chargeUpEnd = key
    }
  }
}
