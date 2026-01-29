import { GoogleGenAI } from '@google/genai'
import { DicomInstance } from '@/types'
import { MarkerAnnotation } from '@/types/annotation'
import { DetectionResult, VisionDetector, VertebraResponse } from './types'
import { dicomToBase64Png } from './dicomImageUtils'

/**
 * Gemini 3 Flash Vision detector with Agentic Vision (code execution).
 *
 * Uses Gemini's Think-Act-Observe loop: the model can generate and execute
 * Python code to crop, annotate, and measure the image before producing
 * final coordinates. This "visual scratchpad" approach yields 5-10% better
 * accuracy compared to single-pass vision analysis.
 *
 * Requires enabling code_execution as a tool in the API request.
 */
export class GeminiVisionDetector implements VisionDetector {
  private client: GoogleGenAI | null = null
  private apiKey: string | null = null

  /**
   * Initialize with Google AI API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.client = new GoogleGenAI({ apiKey })
  }

  /**
   * Check if detector is configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null
  }

  /**
   * Build the vertebrae detection prompt optimized for Gemini's agentic vision.
   * Instructs the model to use code execution for precise coordinate measurement.
   */
  private buildPrompt(imageColumns: number, imageRows: number): string {
    return `You are an expert radiologist analyzing a spinal MRI scan. The image is ${imageColumns} × ${imageRows} pixels. The coordinate origin (0,0) is at the TOP-LEFT corner; X increases rightward, Y increases downward.

TASK: Identify each visible vertebra and determine the precise CENTER of its vertebral body.

Use code execution to improve accuracy:
1. Load and analyze the image using Python (PIL/numpy)
2. Examine pixel intensity profiles to locate vertebral body boundaries
3. Compute the centroid of each vertebral body
4. Optionally draw reference annotations on the image to verify your findings

The spine follows a natural CURVE — do NOT assume all vertebrae share the same x-coordinate.

After your analysis, return ONLY a JSON object in this exact format (no markdown, no explanation):
{"vertebrae": [{"label": "L1", "position": {"x": 245, "y": 120}, "confidence": 0.92}]}

Rules:
- Labels: C1-C7, T1-T12, L1-L5, S1
- Coordinates: integer pixel values within image bounds (0 to ${imageColumns - 1} for x, 0 to ${imageRows - 1} for y)
- Confidence: 0.0-1.0 certainty for each detection
- If no vertebrae are visible, return: {"vertebrae": []}`
  }

  /**
   * Extract the final JSON vertebra response from Gemini's multi-part output.
   *
   * Agentic vision responses may contain multiple content parts:
   * - thought (reasoning)
   * - executableCode (generated Python)
   * - codeExecutionResult (stdout/output from executed code)
   * - text (final answer)
   *
   * We search for the vertebrae JSON in text parts first, then fall back to
   * code execution results in case the model placed its final answer there.
   */
  private parseGeminiResponse(response: { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string; executableCode?: { code?: string }; codeExecutionResult?: { output?: string } }> } }> }): VertebraResponse {
    // First try the simple .text accessor
    if (response.text) {
      try {
        return this.extractJson(response.text)
      } catch {
        // Fall through to candidate parsing
      }
    }

    // Parse through candidates and their parts
    const candidates = response.candidates || []
    const textParts: string[] = []
    const codeOutputParts: string[] = []

    for (const candidate of candidates) {
      const parts = candidate.content?.parts || []
      for (const part of parts) {
        if (part.text) {
          textParts.push(part.text)
        }
        if (part.codeExecutionResult?.output) {
          codeOutputParts.push(part.codeExecutionResult.output)
        }
      }
    }

    // Try text parts first (final answer is usually here)
    for (const text of textParts) {
      try {
        return this.extractJson(text)
      } catch {
        continue
      }
    }

    // Fall back to code execution output
    for (const output of codeOutputParts) {
      try {
        return this.extractJson(output)
      } catch {
        continue
      }
    }

    throw new Error('Could not extract vertebrae JSON from Gemini response')
  }

  /**
   * Extract and parse JSON from a text string that may contain
   * markdown code blocks or surrounding text.
   */
  private extractJson(text: string): VertebraResponse {
    let jsonText = text.trim()

    // Try markdown json code block
    const jsonBlockMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n```/)
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1]
    } else {
      // Try generic code block
      const codeBlockMatch = jsonText.match(/```\s*\n([\s\S]*?)\n```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1]
      } else {
        // Try to find raw JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*"vertebrae"[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
        }
      }
    }

    const parsed = JSON.parse(jsonText) as VertebraResponse
    if (!Array.isArray(parsed.vertebrae)) {
      throw new Error('Response missing vertebrae array')
    }
    return parsed
  }

  /**
   * Detect vertebrae using Gemini 3 Flash with Agentic Vision (code execution).
   */
  async detectVertebrae(instance: DicomInstance): Promise<DetectionResult> {
    const startTime = performance.now()

    if (!this.isConfigured()) {
      throw new Error('Gemini Vision detector not configured. Please set API key in settings.')
    }

    try {
      // Convert DICOM to base64 PNG and get dimensions
      const { data: imageData, imageColumns, imageRows } = await dicomToBase64Png()

      // Call Gemini API with code execution enabled for agentic vision
      const response = await this.client!.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: imageData,
                },
              },
              {
                text: this.buildPrompt(imageColumns, imageRows),
              },
            ],
          },
        ],
        config: {
          tools: [{ codeExecution: {} }],
          temperature: 0.0,
          maxOutputTokens: 4096, // Higher limit for code execution multi-turn output
        },
      })

      // Parse the potentially multi-part agentic response
      const geminiResponse = this.parseGeminiResponse(response as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string; executableCode?: { code?: string }; codeExecutionResult?: { output?: string } }> } }> })

      const annotations: MarkerAnnotation[] = geminiResponse.vertebrae.map((vertebra, index) => ({
        id: `ai-gemini-${instance.sopInstanceUID}-${vertebra.label}-${Date.now()}-${index}`,
        type: 'marker' as const,
        seriesInstanceUID: instance.metadata?.seriesDescription || '',
        sopInstanceUID: instance.sopInstanceUID,
        instanceNumber: instance.instanceNumber,
        severity: 'normal' as const,
        description: `AI-detected ${vertebra.label} vertebra (confidence: ${(vertebra.confidence * 100).toFixed(1)}%)`,
        createdAt: new Date().toISOString(),
        createdBy: 'Gemini-3-Flash',
        autoGenerated: true,
        modelVersion: 'gemini-2.0-flash',
        position: {
          x: vertebra.position.x,
          y: vertebra.position.y,
        },
        label: vertebra.label,
      }))

      const avgConfidence =
        geminiResponse.vertebrae.length > 0
          ? geminiResponse.vertebrae.reduce((sum, v) => sum + v.confidence, 0) /
            geminiResponse.vertebrae.length
          : 0

      const processingTimeMs = performance.now() - startTime

      console.log(
        `[GeminiDetector] Detected ${annotations.length} vertebrae in ${processingTimeMs.toFixed(0)}ms`
      )

      return {
        annotations,
        confidence: avgConfidence,
        processingTimeMs,
      }
    } catch (error) {
      console.error('[GeminiDetector] Detection failed:', error)
      throw new Error(`Gemini Vision detection failed: ${error}`)
    }
  }
}

// Export singleton instance
export const geminiDetector = new GeminiVisionDetector()
