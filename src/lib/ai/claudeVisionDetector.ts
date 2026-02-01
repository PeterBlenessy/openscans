import Anthropic from '@anthropic-ai/sdk'
import { VertebraResponse } from './types'
import { parseVertebraJson } from './dicomImageUtils'
import { BaseVisionDetector } from './BaseVisionDetector'

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
export class ClaudeVisionDetector extends BaseVisionDetector {
  protected client: Anthropic | null = null

  protected getName(): string {
    return 'Claude'
  }

  protected getModelVersion(): string {
    return 'claude-opus-4-5'
  }

  protected initializeClient(apiKey: string): void {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // For development - should use backend proxy in production
    })
  }

  protected async callDetectionAPI(
    imageData: string,
    dims: { imageColumns: number; imageRows: number }
  ): Promise<any> {
    const { imageColumns, imageRows } = dims

    return await this.client!.messages.create({
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
  }

  protected parseDetectionResponse(response: any): VertebraResponse {
    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    return parseVertebraJson(responseText)
  }

  protected async callAnalysisAPI(imageData: string, language: string): Promise<any> {
    const languageInstruction =
      language !== 'English'
        ? `\n\nIMPORTANT: Please provide your entire response in ${language}.`
        : ''

    return await this.client!.messages.create({
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
- This is for educational/review purposes; clinical decisions should be made by qualified medical professionals with full patient context${languageInstruction}

Please provide your analysis in a clear, structured format.`,
              },
            ],
          },
        ],
      })
  }

  protected parseAnalysisResponse(response: any): string {
    return response.content[0].type === 'text' ? response.content[0].text : ''
  }
}

// Export singleton instance
export const claudeDetector = new ClaudeVisionDetector()
