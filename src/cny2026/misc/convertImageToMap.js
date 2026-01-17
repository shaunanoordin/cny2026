/*
Convert Image to Game Map
Reads an image an transforms it into a compatible game map. This is our
alternative to making a dedicated map editor.

- Input:
  - AvO app
  - image: e.g. from imageAsset.img 
- Output:
  - Returns true if successful, false on failure.
  - Modifies AvO app's map-related values.

- Each pixel in the image corresponds to a tile space in the map.
- The colour of the pixel determines the specific Tile (Floor/Wall) OR Entity at
  that tile space.
- The image's height and width determines the width and height of the map.
- The conversion/transformation from pixel to Tile/Entity is hardcoded for now.
 */

export default function convertImageToGameMap (
  app,
  image,
) {
  if (!app || !image) {
    console.error('convertImageToGameMap(): missing inputs')
    return false
  }

  try {



  } catch (err) {
    console.error('convertImageToGameMap(): ', err)
    return false
  }

  return true
}