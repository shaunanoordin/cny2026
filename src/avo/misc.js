/*
Checks if a number is (close enough) to zero.
Due to the imprecise way floating number data can be stored, it's possible for
a mathematical 0 to be represented as something incredibly small like
1.4210854715202004e-14. This screws boolean checks like (num === 0)
 */
export function isZero (num) {
  return -1e-10 < num && num < 1e-10
}

/*
Finds the difference between angle B and angle A, in radians.
 */
export function angleDiff (angleA, angleB) {
  let diff = angleB - angleA
  
  // Clamp diff value to -180º <= x <= +180º
  while (diff < -Math.PI) diff += Math.PI * 2  // While diff < -180º, rotate by +360º
  while (diff > Math.PI) diff -= Math.PI * 2  // While diff > 180º, rotate by -360º
    
  return diff
}

/*
Transforms a sprite sheet (basically a HTMLImageElement), pixel by pixel.
 */
export function transformSpriteSheet (
  image,
  transform = (r, g, b, a) => ({ r, g, b, a })  // Reads a pixel, returns a transformed pixel.
) {
  if (!image || !image?.width || !image?.height) return image

  // Create an OffscreenCanvas and paint the image on it.
  const width = image.width
  const height = image.height
  const offscreenCanvas = new OffscreenCanvas(width, height)
  const c2dOff = offscreenCanvas.getContext('2d')
  c2dOff.drawImage(image, 0, 0, width, height, 0, 0, width, height)

  // Extract the data from the painted image.
  const offImage = c2dOff.getImageData(0, 0, width, height)
  const offData = offImage?.data
  const dataLength = offData?.length || 0

  // Go through every pixel in the data, and run it through the transformer.
  for (let i = 0 ; i < dataLength ; i += 4) {
    const _r = offData[i + 0]
    const _g = offData[i + 1]
    const _b = offData[i + 2]
    const _a = offData[i + 3]

    const { r, g, b, a } = transform(_r, _g, _b, _a)

    offData[i + 0] = r
    offData[i + 1] = g
    offData[i + 2] = b
    offData[i + 3] = a
  }

  // Commit the changes
  c2dOff.putImageData(offImage, 0, 0)

  // Convert transformed image into an ImageBitmap object.
  // I *think* this provides better performance than returning an offscreenCanvas, but I'm not 100% sure.
  const transformedImageBitmap = offscreenCanvas.transferToImageBitmap()
  // transformedImageBitmap.close()  // DON'T close.
  return transformedImageBitmap

  // Alternatively, just return the offscreenCanvas - but this may result in a performance cost.
  // return offscreenCanvas
}
