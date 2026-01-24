import { cornerstone } from '@/lib/cornerstone/initCornerstone'

/**
 * Capture canvas from Cornerstone viewport with optional resolution scaling
 *
 * @param element - The enabled Cornerstone element
 * @param scale - Resolution multiplier (1x, 2x, 4x)
 * @returns Canvas element with captured image
 */
export function captureViewportCanvas(
  element: HTMLDivElement,
  scale: 1 | 2 | 4 = 1
): HTMLCanvasElement | null {
  try {
    // Get the enabled element data from Cornerstone
    const enabledElement = cornerstone.getEnabledElement(element)
    if (!enabledElement || !enabledElement.canvas) {
      console.error('No canvas found in enabled element')
      return null
    }

    const sourceCanvas = enabledElement.canvas

    // If scale is 1x, return the original canvas
    if (scale === 1) {
      return sourceCanvas
    }

    // Create a new canvas with scaled dimensions
    const scaledCanvas = document.createElement('canvas')
    scaledCanvas.width = sourceCanvas.width * scale
    scaledCanvas.height = sourceCanvas.height * scale

    const ctx = scaledCanvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context for scaled canvas')
      return null
    }

    // Disable image smoothing for pixel-perfect medical images
    ctx.imageSmoothingEnabled = false

    // Draw the source canvas scaled up
    ctx.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      0,
      0,
      scaledCanvas.width,
      scaledCanvas.height
    )

    return scaledCanvas
  } catch (err) {
    console.error('Failed to capture viewport canvas:', err)
    return null
  }
}

/**
 * Convert canvas to Blob with specified format and quality
 *
 * @param canvas - The canvas element to convert
 * @param format - 'png' or 'jpeg'
 * @param quality - JPEG quality (0.5-1.0), ignored for PNG
 * @returns Promise resolving to Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  quality: number = 0.95
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      mimeType,
      format === 'jpeg' ? quality : undefined
    )
  })
}

/**
 * Estimate file size for different export options
 * Very rough estimate based on canvas dimensions and format
 */
export function estimateFileSize(
  width: number,
  height: number,
  scale: number,
  format: 'png' | 'jpeg' | 'pdf'
): string {
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const pixels = scaledWidth * scaledHeight

  let bytesPerPixel: number

  switch (format) {
    case 'png':
      // PNG is lossless, typically 2-3 bytes per pixel for medical images
      bytesPerPixel = 2.5
      break
    case 'jpeg':
      // JPEG is lossy, typically 0.5-1 bytes per pixel at high quality
      bytesPerPixel = 0.7
      break
    case 'pdf':
      // PDF contains JPEG compressed image + metadata, similar to JPEG
      bytesPerPixel = 0.8
      break
  }

  const estimatedBytes = pixels * bytesPerPixel

  // Format as human-readable size
  if (estimatedBytes < 1024) {
    return `${Math.round(estimatedBytes)} B`
  } else if (estimatedBytes < 1024 * 1024) {
    return `${(estimatedBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
