import {
  TILE_SIZE, ROTATIONS, DIRECTIONS, SHAPES, LAYERS,
} from '@avo/constants.js'

// Default physics config
// Adjust to whatever "feels" right.
const MOVE_MAX_SPEED = 4
const PUSH_MAX_SPEED = 32
const MOVE_ACCELERATION = 0.4
const MOVE_DECELERATION = 0.4
const PUSH_DECELERATION = 0.4
const GRAVITY = -0.4

// Default visuals config
const PAINT_HITBOX_MASS_TO_LINEWIDTH_FACTOR = 0.2

export default class Entity {
  constructor (app) {
    this._app = app
    this._type = 'entity'
    this.name = ''  // Optional identifier.

    // General entity attributes
    this.colour = '#c0c0c0'
    this.flying = false  // If flying, z position isn't affected by gravity.

    // Expired entities are removed at the end of the cycle.
    this._expired = false

    // Positional data
    this.x = 0
    this.y = 0
    this.z = 0  // Pseudo position on z-axis. Doesn't affect collision. If 0, entity's "feet" are touching the ground.
    this.size = TILE_SIZE
    this._rotation = ROTATIONS.SOUTH  // Rotation in radians.
    this.shape = SHAPES.CIRCLE
    this.shapePolygonPath = null  // Only applicable if shape === SHAPES.POLYGON.

    // Physics (movement): self locomotion and external (pushed) movement
    this.moveX = 0
    this.moveY = 0
    this.pushX = 0
    this.pushY = 0

    // Additional physics
    this.solid = true  // If solid, then can interact with other solid physics entities.
    this.movable = true  // If movable, then can be moved by external forces, e.g. by being pushed by another solid entity.
    this.mass = 10  // Only matters if solid && movable.
    
    // Additional "dynamic" physics
    // Uses getters & setters to adjust values, e.g. in response to actions.
    this._moveAcceleration = MOVE_ACCELERATION
    this._moveDeceleration = MOVE_DECELERATION
    this._moveMaxSpeed = MOVE_MAX_SPEED
    this._pushDeceleration = PUSH_DECELERATION
    this._pushMaxSpeed = PUSH_MAX_SPEED

    // Animation
    this.spriteSheet = undefined  // HTML Image object (e.g. app.assets['hero'].img) containing all sprites used by this Entity.
    this.spriteSizeX = 16  // Size of each sprite on the sprite sheet.
    this.spriteSizeY = 16
    this.spriteScale = 2  // Scale of the sprite when paint()ed.
    this.spriteOffsetX = -8  // Offset of sprite relative to this Entity's {x,y}, when painted on canvas.
    this.spriteOffsetY = -8  // This is usually -0.5 * spriteSizeXorY to make sure the sprite is centred on Entity.
                             // Note: an Entity's {x,y} origin is usually its centre, whereas a HTML Image's {x,y} origin is its top-left corner.

    // Advanced Animation
    this.spriteFlipEastToWest = false  // For 4-directional sprite sheets, we can automatically flip East-facing sprites into West-facing sprites during paintSprite().
    this.spriteZAddsToOffsetY = true  // If entity has a positive z-position, add that value to offsetY.
  }

  deconstructor () {}

  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */

  /*
  Run a single frame of game logic for the entity.
  By default, this just handles physics (positioning and movement). Child
  entities should generally call super.play() to ensure proper physics & etc.
   */
  play () {
    // Update position
    this.x += (this.moveX + this.pushX)
    this.y += (this.moveY + this.pushY)

    // Upkeep: deceleration
    this.doMoveDeceleration()
    this.doPushDeceleration()

    // Upkeep: limit speed
    this.doMaxSpeedLimit()

    // Upkeep: gravity
    if (this.z > 0) {
      this.z = Math.max(0, this.z + GRAVITY)
    }
  }

  /*
  Paint (render) the entity.
  By default, this just paints the shape (hitbox). Child entities should do
  something more interesting, such as calling this.paintSprite().
   */
  paint (layer = 0) {
    const c2d = this._app.canvas2d
    this._app.applyCameraTransforms()

    if (layer === LAYERS.MIDDLE) {
      c2d.fillStyle = this.colour
      c2d.strokeStyle = '#404040'
      c2d.lineWidth = this.mass * PAINT_HITBOX_MASS_TO_LINEWIDTH_FACTOR

      // Draw shape outline
      switch (this.shape) {
        case SHAPES.CIRCLE:
          c2d.beginPath()
          c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
          c2d.fill()
          this.solid && c2d.stroke()
          break
        case SHAPES.SQUARE:
          c2d.beginPath()
          c2d.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size)
          c2d.fill()
          this.solid && c2d.stroke()
          break
        case SHAPES.POLYGON:
          c2d.beginPath()
          let coords = this.vertices
          if (coords.length >= 1) c2d.moveTo(coords[coords.length-1].x, coords[coords.length-1].y)
          for (let i = 0 ; i < coords.length ; i++) {
            c2d.lineTo(coords[i].x, coords[i].y)
          }
          c2d.closePath()
          c2d.fill()
          this.solid && c2d.stroke()
          break
      }

      // Draw anchor point, mostly for debugging
      c2d.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      c2d.beginPath()
      c2d.arc(this.x, this.y, 2, 0, 2 * Math.PI)  // Anchor point
      if (this.shape === SHAPES.CIRCLE) {  // Direction line
        c2d.moveTo(
          this.x + this.size * 0.1 * Math.cos(this.rotation),
          this.y + this.size * 0.1 * Math.sin(this.rotation)
        )
        c2d.lineTo(
          this.x + this.size * 0.5 * Math.cos(this.rotation),
          this.y + this.size * 0.5 * Math.sin(this.rotation)
        )
      }
      c2d.stroke()
    }

    this._app.undoCameraTransforms()
  }

  /*
  Paint the entity's sprite, at the entity's position.
  Note: args are optional; ONLY specify values for args if you want to override
  the automatic calculations.
   */
  paintSprite (args = {
    // Source values
    spriteCol: undefined,  // Column and row of source sprite on the sprite sheet. 
    spriteRow: undefined,
    spriteSizeX: undefined,  // Size of source sprite on sprite sheet.
    spriteSizeY: undefined,

    // Painting target values
    spriteOffsetX: undefined,  // Offset of sprite relative to this Entity's {x,y}, when painted on canvas.
    spriteOffsetY: undefined,  // This is usually -0.5 * spriteSizeXorY to make sure the sprite is centred on Entity.
    spriteRotation: undefined,  // Rotate the sprite.
    spriteScale: undefined,  // Scale of the sprite when paint()ed.
    spriteScaleX: undefined,  // Note: if you specify spriteScaleX/spriteScaleY, then spriteScale will be ignored.
    spriteScaleY: undefined,
  }) {
    const app = this._app
    const c2d = app.canvas2d
    if (!this.spriteSheet) return

    app.applyCameraTransforms()

    // Calculate all the variables
    const sizeX = args?.spriteSizeX ?? this.spriteSizeX
    const sizeY = args?.spriteSizeY ?? this.spriteSizeY
    const srcX = (args?.spriteCol ?? this.getSpriteCol()) * sizeX
    const srcY = (args?.spriteRow ?? this.getSpriteRow()) * sizeY
    const scaleX = args?.spriteScaleX ?? args?.spriteScale ?? this.spriteScale
    const scaleY = args?.spriteScaleY ?? args?.spriteScale ?? this.spriteScale

    // TODO: flipping sprites should be determined by a more general "sprite rendering strategy"
    const flipX = (this.spriteFlipEastToWest && this.getSpriteDirection() === DIRECTIONS.WEST) ? -1 : 1

    c2d.translate(this.x, this.y)  // 1. This moves the 'drawing origin' to match the position of (the centre of) the Entity.
    c2d.scale(flipX * scaleX, scaleY)  // 2. This ensures the sprite scales with the 'drawing origin' as the anchor point.
    if (args?.spriteRotation !== undefined) {  // 3. (OPTIONAL) If we wanted to, we could rotate the sprite around the 'drawing origin'.
      c2d.rotate(args?.spriteRotation)
    }

    // 4. tgtX and tgtY specify where to draw the sprite, relative to the 'drawing origin'.
    let tgtX = args?.spriteOffsetX ?? this.spriteOffsetX  // Usually this is sizeX * -0.5, to centre-align.
    let tgtY = args?.spriteOffsetY ?? this.spriteOffsetY  // Usually this is sizeY * -0.75 to nudge a sprite upwards.

    if (this.spriteZAddsToOffsetY) tgtY -= Math.max(0, this.z)

    c2d.drawImage(this.spriteSheet,
      srcX, srcY, sizeX, sizeY,
      tgtX, tgtY, sizeX, sizeY
    )

    app.undoCameraTransforms()
  }

  /*
  Paint the entity's shadow, at the entity's position.
  Actually very similar to - if not a modified copy of - the default "paint
  hitbox" code.
   */
  paintShadow (layer = 0) {
    const c2d = this._app.canvas2d
    this._app.applyCameraTransforms()

    if (layer === LAYERS.BOTTOM) {
      c2d.fillStyle = '#20202080'

      switch (this.shape) {
        case SHAPES.CIRCLE:
          c2d.beginPath()
          c2d.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI)
          c2d.fill()
          break
        case SHAPES.SQUARE:
          c2d.beginPath()
          c2d.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size)
          c2d.fill()
          break
        case SHAPES.POLYGON:
          c2d.beginPath()
          let coords = this.vertices
          if (coords.length >= 1) c2d.moveTo(coords[coords.length-1].x, coords[coords.length-1].y)
          for (let i = 0 ; i < coords.length ; i++) {
            c2d.lineTo(coords[i].x, coords[i].y)
          }
          c2d.closePath()
          c2d.fill()
          break
      }
    }

    this._app.undoCameraTransforms()
  }

  /*
  Section: Game Logic
  ----------------------------------------------------------------------------
   */

  /*
  Applies an effect to this entity. Usually called by another antity.
  e.g. a fireball hits this character and applies an "ON FIRE" effect.
   */
  applyEffect (effect, source) {}

  /*
  Section: Event Handling
  ----------------------------------------------------------------------------
   */

  /*
  Triggers when this entity hits/touches/intersects with another.
   */
  onCollision (target, collisionCorrection) {
    this.doBounce(target, collisionCorrection)
    this.x = collisionCorrection.x
    this.y = collisionCorrection.y
  }

  /*
  Section: Physics
  ----------------------------------------------------------------------------
   */

  /*
  By default, every moving entity decelerates (because we don't exist in a
  perfect vacuum and the game doesn't take place on a slippery ice).
  Entities can intentionally override this logic,
  e.g. "if a hero is walking, ignore deceleration."
   */
  doMoveDeceleration () {
    const moveDeceleration = this.moveDeceleration || 0
    const curRotation = Math.atan2(this.moveY, this.moveX)
    const newMoveSpeed = Math.max(0, this.moveSpeed - moveDeceleration)
    this.moveX = newMoveSpeed * Math.cos(curRotation)
    this.moveY = newMoveSpeed * Math.sin(curRotation)
  }

  doPushDeceleration () {
    const pushDeceleration = this.pushDeceleration || 0
    const curRotation = Math.atan2(this.pushY, this.pushX)
    const newPushSpeed = Math.max(0, this.pushSpeed - pushDeceleration)
    this.pushX = newPushSpeed * Math.cos(curRotation)
    this.pushY = newPushSpeed * Math.sin(curRotation)
  }

  /*
  Every entity has a maximum speed limit. Intentional movement speed and
  external force movement speed are treated separately.
   */
  doMaxSpeedLimit () {
    // Limit max move speed
    if (this.moveMaxSpeed >= 0) {
      const correctedSpeed = Math.min(this.moveMaxSpeed, this.moveSpeed)
      const moveAngle = this.moveAngle
      this.moveX = correctedSpeed * Math.cos(moveAngle)
      this.moveY = correctedSpeed * Math.sin(moveAngle)
    }

    // Limit max push speed
    if (this.pushMaxSpeed >= 0) {
      const correctedSpeed = Math.min(this.pushMaxSpeed, this.pushSpeed)
      const pushAngle = this.pushAngle
      this.pushX = correctedSpeed * Math.cos(pushAngle)
      this.pushY = correctedSpeed * Math.sin(pushAngle)
    }
  }

  /*
  When a solid pushed entity hits another solid entity, momentum is transferred.
  Usually, this leads to elastic collisions, because that chaos is fun!
   */
  doBounce (target, collisionCorrection) {
    // If this object isn't a movable solid, it can't bounce.
    if (!(this.movable && this.solid)) return

    if (  // this object is bouncing off an unmovable object
      this.movable && this.solid
      && !target.movable && target.solid
    ) {
      if (
        this.shape === SHAPES.CIRCLE && target.shape === SHAPES.CIRCLE
      ) {

        // For circle + circle collisions, the collision correction already
        // tells us the bounce direction.
        const angle = Math.atan2(collisionCorrection.y - this.y, collisionCorrection.x - this.x)
        const speed = Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY)

        this.pushX = Math.cos(angle) * speed
        this.pushY = Math.sin(angle) * speed

      } else if (
        this.shape === SHAPES.CIRCLE
        && (target.shape === SHAPES.SQUARE || target.shape === SHAPES.POLYGON)
      ) {

        // For circle + polygon collisions, we need to know...
        // - the original angle this circle was moving towards (or rather, its
        //   reverse, because we want a bounce)
        // - the normal vector (of the edge) of the polygon this circle collided
        //   into (which we can get from the collision correction)
        // - the angle between them
        const reverseOriginalAngle = Math.atan2(-this.pushY, -this.pushX)
        const normalAngle = Math.atan2(collisionCorrection.y - this.y, collisionCorrection.x - this.x)
        const angleBetween = normalAngle - reverseOriginalAngle
        const angle = reverseOriginalAngle + 2 * angleBetween

        const speed = Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY)

        this.pushX = Math.cos(angle) * speed
        this.pushY = Math.sin(angle) * speed

      } else {
        // For the moment, we're not too concerned about polygons bumping into each other
      }
    } else if (  // this object is bouncing off another movable object
      target.movable && target.solid
      && collisionCorrection.pushX !== undefined
      && collisionCorrection.pushY !== undefined
    ) {
      this.pushX = collisionCorrection.pushX
      this.pushY = collisionCorrection.pushY
    }
  }

  /*
  Section: Animation
  ----------------------------------------------------------------------------
   */

  /*
  NOTE: an Entity usually has one of two styles of sprite sheets:
  1. 4-directional (Zelda-style) sprite sheets, used for characters/actors.
  2. Static sprite sheets, used for environmental objects and etc.

  For 4-directional sprite sheets, each sprite has a variation that faces a
  different cardinal direction. The sprite sheet is usually divided so that each
  row represents a state/action (e.g. idle0, move1, move2) and each column
  represents a direction (South, East, North, West - though the West column can
  be omitted if we just flip the East-facing sprite in-game).
   */

  /*
  Get the directional orientation of the sprite, for a 4-directional
  (Zelda-style) sprite sheet.
   */
  getSpriteDirection () {
    //Favour East and West when rotation is exactly SW, NW, SE or NE.
    if (this._rotation <= Math.PI * 0.25 && this._rotation >= Math.PI * -0.25) { return DIRECTIONS.EAST }
    else if (this._rotation > Math.PI * 0.25 && this._rotation < Math.PI * 0.75) { return DIRECTIONS.SOUTH }
    else if (this._rotation < Math.PI * -0.25 && this._rotation > Math.PI * -0.75) { return DIRECTIONS.NORTH }
    else { return DIRECTIONS.WEST }
  }

  /*
  Get the column/row of the current sprite on the sprite sheet.
   */
  getSpriteCol () { return 0 }
  getSpriteRow () { return 0 }

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

  get radius () { return this.size / 2 }

  set radius (val) { this.size = val * 2 }

  get col () { return Math.floor(this.x / TILE_SIZE) }
  get row () { return Math.floor(this.y / TILE_SIZE) }

  set col (val) { this.x = val * TILE_SIZE + TILE_SIZE / 2 }
  set row (val) { this.y = val * TILE_SIZE + TILE_SIZE / 2 }

  /*
  Rotation tracks the precise angle the entity is facing, in radians, clockwise
  positive. 0° (0 rad) is east/right-facing, 90° (+pi/4 rad) is
  south/down-facing.
   */
  get rotation () { return this._rotation }

  set rotation (val) {
    this._rotation = val
    while (this._rotation > Math.PI) { this._rotation -= Math.PI * 2 }
    while (this._rotation <= -Math.PI) { this._rotation += Math.PI * 2 }
  }

  /*
  Every entity has a shape that can be represented by a polygon. (Yes, even
  circles.) Each vertex is a point in the polygon where two segments/lines/edges
  intersect.
   */
  get vertices () {
    const v = []
    if (this.shape === SHAPES.SQUARE) {
      v.push({ x: this.left, y: this.top })
      v.push({ x: this.right, y: this.top })
      v.push({ x: this.right, y: this.bottom })
      v.push({ x: this.left, y: this.bottom })
    } else if (this.shape === SHAPES.CIRCLE) {  //Approximation
      CIRCLE_TO_POLYGON_APPROXIMATOR.map((approximator) => {
        v.push({ x: this.x + this.radius * approximator.cosAngle, y: this.y + this.radius * approximator.sinAngle })
      })
    } else if (this.shape === SHAPES.POLYGON) {
      if (!this.shapePolygonPath) return []
      for (let i = 0 ; i < this.shapePolygonPath.length ; i += 2) {
        v.push({ x: this.x + this.shapePolygonPath[i], y: this.y + this.shapePolygonPath[i+1] })
      }
    }
    return v
  }

  set vertices (val) { console.error('ERROR: Entity.vertices is read only') }

  /*
  Each segment is a line in the polygonal shape (or polygon-approximated shape)
  of the entity.
   */
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

  set segments (val) { console.error('ERROR: Entity.segments is read only') }

  get moveAcceleration () { return this._moveAcceleration }
  get moveDeceleration () { return this._moveDeceleration }
  get moveMaxSpeed () { return this._moveMaxSpeed }
  get pushDeceleration () { return this._pushDeceleration }
  get pushMaxSpeed () { return this._pushMaxSpeed }

  set moveAcceleration (val) { this._moveAcceleration = val }
  set moveDeceleration (val) { this._moveDeceleration = val }
  set moveMaxSpeed (val) { this._moveMaxSpeed = val }
  set pushDeceleration (val) { this._pushDeceleration = val }
  set pushMaxSpeed (val) { this._pushMaxSpeed = val }

  get moveSpeed () { return Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY) }
  get moveAngle () { return Math.atan2(this.moveY, this.moveX) }
  get pushSpeed () { return Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY) }
  get pushAngle () { return Math.atan2(this.pushY, this.pushX) }

  set moveSpeed (val) { console.error('ERROR: Entity.moveSpeed is read only') }
  set moveAngle (val) { console.error('ERROR: Entity.moveAngle is read only') }
  set pushSpeed (val) { console.error('ERROR: Entity.pushSpeed is read only') }
  set pushAngle (val) { console.error('ERROR: Entity.pushAngle is read only') }
}

const CIRCLE_TO_POLYGON_APPROXIMATOR =
  [ROTATIONS.EAST, ROTATIONS.SOUTHEAST, ROTATIONS.SOUTH, ROTATIONS.SOUTHWEST,
   ROTATIONS.WEST, ROTATIONS.NORTHWEST, ROTATIONS.NORTH, ROTATIONS.NORTHEAST]
  .map((angle) => {
    return ({ cosAngle: Math.cos(angle), sinAngle: Math.sin(angle) })
  })
