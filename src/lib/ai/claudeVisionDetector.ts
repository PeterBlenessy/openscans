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
 * Uses Claude 3.5 Sonnet for medical image analysis
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
  private async dicomToBase64Png(instance: DicomInstance): Promise<{
    data: string
    canvasWidth: number
    canvasHeight: number
    imageColumns: number
    imageRows: number
    viewportElement: HTMLElement
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
      const imageColumns = image.width
      const imageRows = image.height

      console.log(`[ClaudeDetector] Capturing canvas (${canvas.width}x${canvas.height})`)
      console.log(`[ClaudeDetector] DICOM image dimensions: ${imageColumns}x${imageRows}`)
      console.log(`[ClaudeDetector] Viewport:`, {
        scale: viewport.scale,
        translation: viewport.translation,
        hflip: viewport.hflip,
        vflip: viewport.vflip,
        rotation: viewport.rotation
      })

      // Convert to PNG and extract base64 data
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const base64Data = dataUrl.split(',')[1]

      if (!base64Data || base64Data.length === 0) {
        throw new Error('Canvas produced empty base64 data')
      }

      console.log(`[ClaudeDetector] Converted canvas to PNG (${base64Data.length} chars)`)

      return {
        data: base64Data,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageColumns,
        imageRows,
        viewportElement
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
      console.log('[ClaudeDetector] Converting DICOM to PNG...')
      const { data: imageData, canvasWidth, canvasHeight, imageColumns, imageRows, viewportElement } = await this.dicomToBase64Png(instance)

      // Call Claude API
      console.log('[ClaudeDetector] Calling Claude Vision API...')
      const message = await this.client!.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
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
                text: `You are a medical imaging assistant analyzing spinal MRI scans.

TASK: Identify each visible vertebra and mark the CENTER of its vertebral body.

CRITICAL INSTRUCTIONS:
1. Look carefully at the actual anatomical position of each vertebral body in the image
2. The spine is CURVED - the x-coordinates must follow the natural curve of the spine, not a straight vertical line
3. Place the marker at the CENTER of each vertebral body (the rectangular bone structure)
4. Use precise pixel coordinates based on what you actually see in the image

For each vertebra you identify:
- label: Anatomical name (C1-C7, T1-T12, L1-L5, S1)
- position: The ACTUAL center point of that vertebral body in pixel coordinates (x=0 is left edge, y=0 is top edge)
- confidence: How certain you are (0.0-1.0)

IMPORTANT: Do NOT use generic center-line positions. Each vertebra has its own unique x,y position following the spine's curve.

Return ONLY this JSON format, no other text:
{
  "vertebrae": [
    {"label": "L1", "position": {"x": 245, "y": 120}, "confidence": 0.92},
    {"label": "L2", "position": {"x": 238, "y": 165}, "confidence": 0.94}
  ]
}

If no vertebrae are visible, return: {"vertebrae": []}`,
              },
            ],
          },
        ],
      })

      console.log('[ClaudeDetector] Received response from Claude')

      // Parse response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      console.log('[ClaudeDetector] Response:', responseText)

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '')
      }

      const claudeResponse: ClaudeVertebraResponse = JSON.parse(jsonText)

      console.log('[ClaudeDetector] Coordinate conversion:', {
        canvas: `${canvasWidth}x${canvasHeight}`,
        dicom: `${imageColumns}x${imageRows}`
      })

      // Convert Claude's canvas coordinates to DICOM image coordinates using Cornerstone
      // This properly handles viewport transformations (scale, translation, rotation)
      const annotations: MarkerAnnotation[] = claudeResponse.vertebrae.map((vertebra, index) => {
        // Use Cornerstone's canvasToPixel to convert canvas coords to image pixel coords
        const canvasCoords = { x: vertebra.position.x, y: vertebra.position.y }
        const imageCoords = cornerstone.canvasToPixel(viewportElement as HTMLElement, canvasCoords)

        console.log(`[ClaudeDetector] ${vertebra.label}: canvas(${vertebra.position.x},${vertebra.position.y}) -> image(${imageCoords.x.toFixed(1)},${imageCoords.y.toFixed(1)})`)

        return {
          id: `ai-claude-${instance.sopInstanceUID}-${vertebra.label}-${Date.now()}-${index}`,
          type: 'marker',
          seriesInstanceUID: instance.metadata?.seriesDescription || '',
          sopInstanceUID: instance.sopInstanceUID,
          instanceNumber: instance.instanceNumber,
          severity: 'normal',
          description: `AI-detected ${vertebra.label} vertebra (confidence: ${(vertebra.confidence * 100).toFixed(1)}%)`,
          createdAt: new Date().toISOString(),
          createdBy: 'Claude-Sonnet-4.5',
          autoGenerated: true,
          modelVersion: 'claude-sonnet-4-5',
          position: {
            x: imageCoords.x,
            y: imageCoords.y
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
