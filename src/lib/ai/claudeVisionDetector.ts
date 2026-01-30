import Anthropic from '@anthropic-ai/sdk'
import { DicomInstance } from '@/types'
import { MarkerAnnotation } from '@/types/annotation'
import { DetectionResult, AnalysisResult, VisionDetector } from './types'
import { dicomToBase64Png, parseVertebraJson } from './dicomImageUtils'
import { AiAnalysis } from '@/stores/aiAnalysisStore'
import { parseApiError } from './errorHandler'

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
export class ClaudeVisionDetector implements VisionDetector {
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
   * Detect vertebrae using Claude Vision API
   */
  async detectVertebrae(instance: DicomInstance): Promise<DetectionResult> {
    const startTime = performance.now()

    if (!this.isConfigured()) {
      throw new Error('Claude Vision detector not configured. Please set API key in settings.')
    }

    try {
      // Convert DICOM to base64 PNG and get dimensions
      const { data: imageData, imageColumns, imageRows } = await dicomToBase64Png()

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
      const claudeResponse = parseVertebraJson(responseText)

      // NOTE: Claude Vision API coordinates require manual adjustment for medical-grade accuracy.
      // The general-purpose vision model identifies vertebrae but lacks the precision of
      // specialized medical imaging models like MONAI or TotalSegmentator.
      // Users can drag markers to correct positions after AI detection.

      const annotations: MarkerAnnotation[] = claudeResponse.vertebrae.map((vertebra, index) => ({
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
          x: vertebra.position.x,
          y: vertebra.position.y
        },
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
      const errorDetails = parseApiError(error, 'claude')
      console.error('[ClaudeDetector] Detection failed:', errorDetails.message)

      // Create a user-friendly error
      const userError = new Error(errorDetails.userMessage)
      // Attach error details for debugging
      ;(userError as any).details = errorDetails
      throw userError
    }
  }

  /**
   * Perform generic radiology analysis using Claude Vision API
   * Returns a comprehensive analysis of the medical image
   */
  async analyzeImage(instance: DicomInstance): Promise<AnalysisResult> {
    const startTime = performance.now()

    if (!this.isConfigured()) {
      throw new Error('Claude Vision detector not configured. Please set API key in settings.')
    }

    try {
      // Convert DICOM to base64 PNG and get dimensions
      const { data: imageData } = await dicomToBase64Png()

      // Call Claude API with a more open-ended prompt
      const message = await this.client!.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        temperature: 0.0,
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
                text: `You are an experienced expert radiologist analyzing a medical imaging scan.

Please provide a comprehensive analysis of this medical image, including:

1. **Image Type & Quality**: What type of scan is this (MRI, CT, X-ray, etc.)? Comment on image quality and any technical factors that may affect interpretation.

2. **Anatomical Structures**: Identify the key anatomical structures visible in the image. What body region and orientation is shown?

3. **Normal Findings**: Describe any normal anatomical features that are clearly visible.

4. **Abnormal Findings**: Identify any abnormalities, lesions, fractures, misalignments, or other pathological features. Be specific about location, size, and characteristics.

5. **Clinical Significance**: What is the potential clinical significance of your findings? Are there any urgent or concerning features?

6. **Recommendations**: Suggest any follow-up imaging, clinical correlation, or additional views that might be helpful.

IMPORTANT:
- Be thorough but concise
- Use clear medical terminology but explain complex terms
- Note any limitations in your analysis
- If you're uncertain about any findings, explicitly state this
- This is for educational/review purposes; clinical decisions should be made by qualified medical professionals with full patient context

Please provide your analysis in a clear, structured format.`,
              },
            ],
          },
        ],
      })

      // Extract the analysis text
      const analysisText = message.content[0].type === 'text' ? message.content[0].text : ''

      if (!analysisText || analysisText.trim().length === 0) {
        throw new Error('Claude returned an empty analysis')
      }

      const analysis: AiAnalysis = {
        id: `ai-analysis-${instance.sopInstanceUID}-${Date.now()}`,
        sopInstanceUID: instance.sopInstanceUID,
        instanceNumber: instance.instanceNumber,
        findings: analysisText,
        createdAt: new Date().toISOString(),
        createdBy: 'Claude-Sonnet-4.5',
        modelVersion: 'claude-sonnet-4-5',
      }

      const processingTimeMs = performance.now() - startTime

      console.log(
        `[ClaudeDetector] Generated radiology analysis in ${processingTimeMs.toFixed(0)}ms`
      )

      return {
        analysis,
        processingTimeMs,
      }
    } catch (error) {
      const errorDetails = parseApiError(error, 'claude')
      console.error('[ClaudeDetector] Analysis failed:', errorDetails.message)

      // Create a user-friendly error
      const userError = new Error(errorDetails.userMessage)
      // Attach error details for debugging
      ;(userError as any).details = errorDetails
      throw userError
    }
  }
}

// Export singleton instance
export const claudeDetector = new ClaudeVisionDetector()
