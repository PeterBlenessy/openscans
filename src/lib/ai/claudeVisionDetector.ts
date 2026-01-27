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
   * Convert DICOM image to base64 PNG
   */
  private async dicomToBase64Png(instance: DicomInstance): Promise<string> {
    // Get the image from Cornerstone
    const element = document.createElement('div')
    element.style.width = `${instance.columns}px`
    element.style.height = `${instance.rows}px`

    try {
      // Enable and load image
      cornerstone.enable(element)
      const image = await cornerstone.loadImage(instance.imageId)
      cornerstone.displayImage(element, image)

      // Get canvas and convert to base64
      const canvas = element.querySelector('canvas')
      if (!canvas) {
        throw new Error('Failed to get canvas from Cornerstone')
      }

      // Convert to PNG and extract base64 data
      const dataUrl = canvas.toDataURL('image/png')
      const base64Data = dataUrl.split(',')[1]

      // Cleanup
      cornerstone.disable(element)

      return base64Data
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
      // Convert DICOM to base64 PNG
      console.log('[ClaudeDetector] Converting DICOM to PNG...')
      const imageData = await this.dicomToBase64Png(instance)

      // Call Claude API
      console.log('[ClaudeDetector] Calling Claude Vision API...')
      const message = await this.client!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
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
                text: `You are a medical imaging assistant analyzing spinal scans.
Your task is to identify all visible vertebrae in the provided image.

For each vertebra:
1. Determine its anatomical label (C1-C7, T1-T12, L1-L5, S1)
2. Estimate its center position in pixel coordinates (0,0 is top-left)
3. Provide a confidence score (0.0-1.0)

Return ONLY valid JSON in this exact format:
{
  "vertebrae": [
    {"label": "T12", "position": {"x": 256, "y": 180}, "confidence": 0.95}
  ]
}

If no vertebrae are visible, return: {"vertebrae": []}

Important: Return only the JSON, no other text.`,
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

      // Convert to annotations
      const annotations: MarkerAnnotation[] = claudeResponse.vertebrae.map((vertebra, index) => ({
        id: `ai-claude-${instance.sopInstanceUID}-${vertebra.label}-${Date.now()}-${index}`,
        type: 'marker',
        seriesInstanceUID: instance.metadata?.seriesDescription || '',
        sopInstanceUID: instance.sopInstanceUID,
        instanceNumber: instance.instanceNumber,
        severity: 'normal',
        description: `AI-detected ${vertebra.label} vertebra (confidence: ${(vertebra.confidence * 100).toFixed(1)}%)`,
        createdAt: new Date().toISOString(),
        createdBy: 'Claude-3.5-Sonnet',
        autoGenerated: true,
        modelVersion: 'claude-3-5-sonnet-20241022',
        position: vertebra.position,
        label: vertebra.label,
      }))

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
