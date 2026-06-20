import OpenAI from 'openai'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { VertebraResponse } from './types'
import { parseVertebraJson } from './dicomImageUtils'
import { BaseVisionDetector } from './BaseVisionDetector'
import { useSettingsStore, DEFAULT_LOCAL_MODEL, DEFAULT_LOCAL_PORT } from '@/stores/settingsStore'

/**
 * Local LLM vision detector — talks to the bundled `llama-server` (llama.cpp)
 * over its OpenAI-compatible API on loopback. No data ever leaves the device:
 * the request only reaches `http://localhost:<port>/v1`.
 *
 * Structurally identical to {@link OpenAIVisionDetector}, but:
 * - points the OpenAI client at the local server instead of api.openai.com
 * - uses the user-configured (preconfigured + overridable) model id
 * - needs no API key, so it self-configures and reports `isConfigured()` true
 *   on every call, re-reading the model/port from settings (so changing the
 *   model in Settings takes effect immediately, with no re-init dance).
 *
 * The model VLMs (e.g. MedGemma 4B) give approximate vertebra markers and solid
 * radiology-style descriptions; precise MR detection is handled separately by
 * the MONAI segmentation engine (see plans/LOCAL_AI_PROVIDER.md, Phase 3).
 */
export class LocalVisionDetector extends BaseVisionDetector {
  protected client: OpenAI | null = null

  protected getName(): string {
    return 'Local'
  }

  /** Current model id from settings, falling back to the default. */
  protected getModelVersion(): string {
    return useSettingsStore.getState().localModel || DEFAULT_LOCAL_MODEL
  }

  /** Base URL of the bundled llama-server's OpenAI-compatible API. */
  private getBaseUrl(): string {
    const port = useSettingsStore.getState().localPort || DEFAULT_LOCAL_PORT
    return `http://localhost:${port}/v1`
  }

  /**
   * No API key is required for a local server. We still (re)build the client
   * here so the base URL always reflects the current settings.
   */
  protected initializeClient(_apiKey?: string): void {
    this.client = new OpenAI({
      apiKey: 'sk-no-key-required', // llama-server ignores auth on loopback
      baseURL: this.getBaseUrl(),
      dangerouslyAllowBrowser: true,
    })
  }

  /**
   * The local detector is always "configured": there is no key to set and the
   * endpoint is a fixed loopback address. We lazily build the client on first
   * use so a freshly selected model/port is always honoured.
   */
  isConfigured(): boolean {
    if (!this.client) {
      this.initializeClient()
    }
    return true
  }

  protected async callDetectionAPI(
    imageData: string,
    dims: { imageColumns: number; imageRows: number }
  ): Promise<any> {
    const { imageColumns, imageRows } = dims

    return await this.client!.chat.completions.create({
      model: this.getModelVersion(),
      max_tokens: 2048,
      temperature: 0.0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageData}` },
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
6. X coordinates range from 0 to ${imageColumns - 1}, Y coordinates range from 0 to ${imageRows - 1}

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
    const responseText = response.choices[0]?.message?.content || ''
    return parseVertebraJson(responseText)
  }

  protected async callAnalysisAPI(imageData: string, language: string): Promise<any> {
    const languageInstruction =
      language !== 'English'
        ? `\n\nIMPORTANT: Please provide your entire response in ${language}.`
        : ''

    return await this.client!.chat.completions.create({
      model: this.getModelVersion(),
      max_tokens: 4096,
      temperature: 0.0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageData}` },
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
    return response.choices[0]?.message?.content || ''
  }
}

// Export singleton instance
export const localDetector = new LocalVisionDetector()
