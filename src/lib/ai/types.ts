import { DicomInstance } from '@/types'
import { MarkerAnnotation } from '@/types/annotation'
import { AiAnalysis } from '@/stores/aiAnalysisStore'

/**
 * Result of an AI vertebral detection run
 */
export interface DetectionResult {
  annotations: MarkerAnnotation[]
  confidence: number
  processingTimeMs: number
}

/**
 * Common vertebra detection response format shared across AI providers
 */
export interface VertebraResponse {
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
 * Result of a generic radiology analysis run
 */
export interface AnalysisResult {
  analysis: AiAnalysis
  processingTimeMs: number
}

/**
 * Common interface for all vision-based detectors.
 * Implementations: ClaudeVisionDetector, GeminiVisionDetector, MockVertebralDetector
 */
export interface VisionDetector {
  setApiKey(apiKey: string): void
  isConfigured(): boolean
  detectVertebrae(instance: DicomInstance): Promise<DetectionResult>
  analyzeImage(instance: DicomInstance): Promise<AnalysisResult>
}

/**
 * Result of DICOM-to-PNG conversion with dimension metadata
 */
export interface DicomImageData {
  /** Base64-encoded PNG image data */
  data: string
  /** Canvas render width in pixels */
  canvasWidth: number
  /** Canvas render height in pixels */
  canvasHeight: number
  /** DICOM image columns (native resolution) */
  imageColumns: number
  /** DICOM image rows (native resolution) */
  imageRows: number
}
