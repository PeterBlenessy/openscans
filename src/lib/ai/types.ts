import { DicomInstance } from '@/types'
import { MarkerAnnotation } from '@/types/annotation'

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
 * Common interface for all vision-based vertebral detectors.
 * Implementations: ClaudeVisionDetector, GeminiVisionDetector, MockVertebralDetector
 */
export interface VisionDetector {
  setApiKey(apiKey: string): void
  isConfigured(): boolean
  detectVertebrae(instance: DicomInstance): Promise<DetectionResult>
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
