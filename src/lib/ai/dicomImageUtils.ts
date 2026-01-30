import cornerstone from 'cornerstone-core'
import { DicomImageData } from './types'

/**
 * Convert the currently displayed DICOM image to a base64-encoded PNG.
 *
 * Renders at the native DICOM image resolution (not the viewport canvas size)
 * so that AI-returned pixel coordinates map directly to DICOM image space.
 * Geometric transforms (flip, rotation, scale) are stripped to produce a
 * canonical view; window/level settings are preserved.
 */
export async function dicomToBase64Png(): Promise<DicomImageData> {
  try {
    // Find the active viewport element
    const viewportElement = document.querySelector('[data-testid="viewport"]') as HTMLDivElement
    if (!viewportElement) {
      throw new Error('No active viewport found. Make sure a DICOM image is loaded.')
    }

    // Get the canvas from the active viewport
    const canvas = viewportElement.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('No canvas found in viewport. Make sure Cornerstone is initialized.')
    }

    // Verify canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has invalid dimensions')
    }

    // Get the enabled image from Cornerstone to get actual image dimensions and viewport
    const enabledElement = cornerstone.getEnabledElement(viewportElement)
    if (!enabledElement || !enabledElement.image) {
      throw new Error('No Cornerstone image found in viewport')
    }

    const image = enabledElement.image
    const viewport = enabledElement.viewport

    // Check both Cornerstone's image object and raw DICOM metadata
    const cornerstoneWidth = image.width
    const cornerstoneHeight = image.height
    const imageColumns = image.columns || cornerstoneWidth
    const imageRows = image.rows || cornerstoneHeight

    // CRITICAL: Render at IMAGE dimensions, not canvas dimensions
    // This ensures AI coordinates are directly in DICOM image pixel space
    // cornerstone.pixelToCanvas() expects image coordinates and handles all transformations
    const renderWidth = imageColumns
    const renderHeight = imageRows

    // Create temporary canvas at original resolution
    const renderCanvas = document.createElement('canvas')
    renderCanvas.width = renderWidth
    renderCanvas.height = renderHeight

    // Render DICOM image to canvas using Cornerstone
    const renderElement = document.createElement('div')
    renderElement.style.width = `${renderWidth}px`
    renderElement.style.height = `${renderHeight}px`
    renderElement.style.position = 'absolute'
    renderElement.style.left = '-9999px'
    document.body.appendChild(renderElement)

    try {
      cornerstone.enable(renderElement)

      // Display the same image with same viewport settings at original resolution
      await cornerstone.displayImage(renderElement, image)

      // Apply same viewport settings for window/level and inversion
      // CRITICAL: Do NOT copy hflip/vflip/rotation/scale/translation
      // We want the AI to analyze the CANONICAL image (no transformations)
      // Then pixelToCanvas() will apply the user's transformations when rendering
      const renderViewport = cornerstone.getViewport(renderElement)
      renderViewport.voi = viewport.voi  // Window/level - affects brightness
      renderViewport.invert = viewport.invert  // Invert grayscale
      renderViewport.pixelReplication = viewport.pixelReplication
      renderViewport.modalityLUT = viewport.modalityLUT
      renderViewport.voiLUT = viewport.voiLUT
      // Reset all geometric transformations to get canonical view
      renderViewport.hflip = false
      renderViewport.vflip = false
      renderViewport.rotation = 0
      renderViewport.scale = 1.0
      renderViewport.translation = { x: 0, y: 0 }
      cornerstone.setViewport(renderElement, renderViewport)

      // Force a render update to ensure canvas is drawn
      cornerstone.updateImage(renderElement)

      // Wait a bit for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get the canvas
      const renderCanvasElement = renderElement.querySelector('canvas') as HTMLCanvasElement
      if (!renderCanvasElement) {
        throw new Error('Failed to create render canvas')
      }

      // Verify canvas has content
      const ctx = renderCanvasElement.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context')
      }

      const imageData = ctx.getImageData(0, 0, renderCanvasElement.width, renderCanvasElement.height)
      const pixels = imageData.data
      let hasContent = false
      for (let i = 0; i < pixels.length; i += 4) {
        // Check if any pixel is not transparent
        if (pixels[i + 3] !== 0) {
          hasContent = true
          break
        }
      }

      if (!hasContent) {
        throw new Error('Render canvas is empty - rendering failed')
      }

      // Convert canvas to PNG
      const dataUrl = renderCanvasElement.toDataURL('image/png', 1.0)
      const base64Data = dataUrl.split(',')[1]

      if (!base64Data || base64Data.length === 0) {
        throw new Error('Canvas produced empty base64 data')
      }

      // Clean up
      cornerstone.disable(renderElement)
      document.body.removeChild(renderElement)

      return {
        data: base64Data,
        canvasWidth: renderWidth,
        canvasHeight: renderHeight,
        imageColumns,
        imageRows
      }
    } catch (error) {
      // Clean up on error
      try {
        cornerstone.disable(renderElement)
        document.body.removeChild(renderElement)
      } catch { /* ignore cleanup errors */ }
      throw error
    }
  } catch (error) {
    console.error('Failed to convert DICOM to PNG:', error)
    throw error
  }
}

/**
 * Parse a JSON vertebra response from AI output text.
 * Handles markdown code blocks, raw JSON, and surrounding text.
 */
export function parseVertebraJson(responseText: string): { vertebrae: Array<{ label: string; position: { x: number; y: number }; confidence: number }> } {
  let jsonText = responseText.trim()

  // Try to find JSON in markdown code block first
  const jsonBlockMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n```/)
  if (jsonBlockMatch) {
    jsonText = jsonBlockMatch[1]
  } else {
    // Try generic code block
    const codeBlockMatch = jsonText.match(/```\s*\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1]
    } else {
      // Try to find JSON object directly (look for { ... })
      const jsonMatch = jsonText.match(/\{[\s\S]*"vertebrae"[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }
    }
  }

  return JSON.parse(jsonText)
}
