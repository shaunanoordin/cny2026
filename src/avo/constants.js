/*
Section: General
--------------------------------------------------------------------------------
 */

/*
As a sprite-based game engine, we think of in-game space in terms of "tiles" (or
"map tiles"). Each map tile is 32x32 pixels, and standard in-game objects should
more or less fit exactly one map tile.  
 */
export const TILE_SIZE = 32

/*
We use a constant frame rate to make calculations in our game logic much easier.
e.g. we can say that we expect an object with "movement speed" of "2" to travel
120 pixels in 1 second. (2 pixels per frame * 60 frames per second)
 */
export const FRAMES_PER_SECOND = 60
export const FRAME_DURATION = 1000 / FRAMES_PER_SECOND

/*
Section: In-Game Objects
--------------------------------------------------------------------------------
 */

/*
Each Entity has a physical shape.
 */
export const SHAPES = {
  NONE: 'none',
  CIRCLE: 'circle',
  SQUARE: 'square',
  POLYGON: 'polygon',
}

/*
Each Entity has a directional orientation, which can be interpreted as either
"rotation" (if we want to know the precise angle for physics calculations) or
"direction" (if we want to match it with up/down/left/right-facing sprites).
 */
export const ROTATIONS = {
  EAST: 0,
  SOUTHEAST: Math.PI * 0.25,
  SOUTH: Math.PI * 0.5,
  SOUTHWEST: Math.PI * 0.75,
  WEST: Math.PI,
  NORTHWEST: Math.PI * -0.75,
  NORTH: Math.PI * -0.5,
  NORTHEAST: Math.PI * -0.25,
}

export const DIRECTIONS = {
  EAST: 0,
  SOUTH: 1,
  WEST: 2,
  NORTH: 3,
}

/*
Map Tiles care about its cardinal neighbours. More specifically, they care about
the combination of the presence of neighbours. For example, if a "brick wall"
tile has another brick wall to the north and another to the south, we can
express this with the value 5 (= 1 + 4 = NORTH + SOUTH). 
 */
export const TILE_ADJACENCIES = {
  NORTH: 1,
  EAST: 2,
  SOUTH: 4,
  WEST: 8,
}


/*
Section: User Input
--------------------------------------------------------------------------------
 */

/*
Pointer (mouse or touch) input.
 */
export const POINTER_STATES = {
  IDLE: 'idle',  // Player isn't doing anything
  POINTER_DOWN: 'pointer down',  // Player is actively interacting with the canvas.
}

// Distance from its starting position that the pointer has to move, before a
// 'move' command is issued.
export const POINTER_DEADZONE_RADIUS = 16

// If the pointer is down and then released after a short time, it's a tap
// action. Otherwise, it's a hold action.
export const POINTER_TAP_DURATION = 300

/*
Section: Painting
--------------------------------------------------------------------------------
 */

/*
The paint() step (of the core engine, each Entity, and each Rule) can paint
information in different visual layers.
 */
export const LAYERS = {
  BOTTOM: 1,
  MIDDLE: 2,  // Main object layer.
  TOP: 3,
  OVERLAY: 4,
}
export const MIN_LAYER = 1
export const MAX_LAYER = 4
