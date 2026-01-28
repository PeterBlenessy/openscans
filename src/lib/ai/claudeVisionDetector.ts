import Anthropic from '@anthropic-ai/sdk'
import { DicomInstance } from '@/types'
import { MarkerAnnotation } from '@/types/annotation'
import { DetectionResult } from './mockVertebralDetector'
import cornerstone from 'cornerstone-core'

/**
 * Vertebra detection response from Claude
 */
interface ClaudeVertebraResponse {
  vertebrae: Array<{
    label: string
    position: {
      x: number
      y: number
    }
    confidence: number
  }>
}

/**
 * Claude Vision API-based vertebral detector
 *
 * Uses Claude Opus 4.5 for medical image analysis. This is a general-purpose
 * vision model that can identify vertebral structures but lacks the precision
 * of specialized medical imaging models like MONAI or TotalSegmentator.
 *
 * Detected markers can be manually adjusted by dragging them to correct positions.
 * For production use, consider integrating specialized medical imaging models.
 */
export class ClaudeVisionDetector {
  private client: Anthropic | null = null
  private apiKey: string | null = null

  /**
   * Initialize with API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // For development - should use backend proxy in production
    })
  }

  /**
   * Check if detector is configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null
  }

  /**
   * Convert DICOM image to base64 PNG using the active viewport canvas
   * Returns base64 data, canvas dimensions, and actual DICOM image dimensions from Cornerstone
   */
  private async dicomToBase64Png(): Promise<{
    data: string
    canvasWidth: number
    canvasHeight: number
    imageColumns: number
    imageRows: number
  }> {
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
      // This ensures Claude's coordinates are directly in DICOM image pixel space
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
        // We want Claude to analyze the CANONICAL image (no transformations)
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
        } catch {}
        throw error
      }
    } catch (error) {
      console.error('Failed to convert DICOM to PNG:', error)
      throw error
    }
  }

  /**
   * Detect vertebrae using Claude Vision API
   */
  async detectVertebrae(instance: DicomInstance): Promise<DetectionResult> {
    const startTime = performance.now()

    if (!this.isConfigured()) {
      throw new Error('Claude Vision detector not configured. Please set API key in settings.')
    }

    try {
      // Convert DICOM to base64 PNG and get dimensions
      const { data: imageData, canvasWidth, canvasHeight, imageColumns, imageRows } = await this.dicomToBase64Png()

      // Call Claude API
      const message = await this.client!.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        temperature: 0.0, // Deterministic responses - same image = same coordinates every time
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: `You are an expert radiologist analyzing spinal MRI scans with high precision.

IMAGE DIMENSIONS: ${imageColumns} × ${imageRows} pixels
COORDINATE SYSTEM: Origin (0,0) is at TOP-LEFT corner. X increases rightward, Y increases downward.

TASK: Identify each visible vertebra and mark the precise CENTER of its vertebral body.

CRITICAL INSTRUCTIONS:
1. Carefully examine the ACTUAL anatomical position of each vertebral body in the image
2. The spine follows a natural CURVE - each vertebra has a unique x-coordinate following this curvature
3. Place the marker at the geometric CENTER of each vertebral body (the main rectangular bone structure)
4. Use EXACT pixel coordinates based on what you see - measure the center point precisely
5. The coordinate system: x=0 is the LEFT edge, y=0 is the TOP edge of the image
6. X coordinates range from 0 to ${imageColumns-1}, Y coordinates range from 0 to ${imageRows-1}

For each vertebra you identify:
- label: Anatomical name (C1-C7, T1-T12, L1-L5, S1)
- position: The precise center point in pixel coordinates, measuring from top-left corner (0,0)
- confidence: Your certainty level (0.0-1.0)

IMPORTANT:
- Do NOT place all markers on a vertical centerline
- Each vertebra sits at a different horizontal position along the spine's curve
- Measure pixel coordinates precisely - accuracy is critical for medical annotation

Return ONLY this JSON format, no other text:
{"vertebrae": [{"label": "L1", "position": {"x": 245, "y": 120}, "confidence": 0.92}, {"label": "L2", "position": {"x": 238, "y": 165}, "confidence": 0.94}]}

If no vertebrae are visible, return: {"vertebrae": []}`,
              },
            ],
          },
        ],
      })

      // Parse response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // Extract JSON from response (handle markdown code blocks and surrounding text)
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

      const claudeResponse: ClaudeVertebraResponse = JSON.parse(jsonText)

      // NOTE: Claude Vision API coordinates require manual adjustment for medical-grade accuracy.
      // The general-purpose vision model identifies vertebrae but lacks the precision of
      // specialized medical imaging models like MONAI or TotalSegmentator.
      // Users can drag markers to correct positions after AI detection.

      const annotations: MarkerAnnotation[] = claudeResponse.vertebrae.map((vertebra, index) => {
        const imageX = vertebra.position.x
        const imageY = vertebra.position.y

        return {
          id: `ai-claude-${instance.sopInstanceUID}-${vertebra.label}-${Date.now()}-${index}`,
          type: 'marker',
          seriesInstanceUID: instance.metadata?.seriesDescription || '',
          sopInstanceUID: instance.sopInstanceUID,
          instanceNumber: instance.instanceNumber,
          severity: 'normal',
          description: `AI-detected ${vertebra.label} vertebra (confidence: ${(vertebra.confidence * 100).toFixed(1)}%)`,
          createdAt: new Date().toISOString(),
          createdBy: 'Claude-Opus-4.5',
          autoGenerated: true,
          modelVersion: 'claude-opus-4-5',
          position: {
            x: imageX,
            y: imageY
          },
          label: vertebra.label,
        }
      })

      // Calculate average confidence
      const avgConfidence =
        claudeResponse.vertebrae.length > 0
          ? claudeResponse.vertebrae.reduce((sum, v) => sum + v.confidence, 0) /
            claudeResponse.vertebrae.length
          : 0

      const processingTimeMs = performance.now() - startTime

      console.log(
        `[ClaudeDetector] Detected ${annotations.length} vertebrae in ${processingTimeMs.toFixed(0)}ms`
      )

      return {
        annotations,
        confidence: avgConfidence,
        processingTimeMs,
      }
    } catch (error) {
      console.error('[ClaudeDetector] Detection failed:', error)
      throw new Error(`Claude Vision detection failed: ${error}`)
    }
  }
}

// Export singleton instance
export const claudeDetector = new ClaudeVisionDetector()
