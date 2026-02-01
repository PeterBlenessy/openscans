import { saveAs } from 'file-saver'
import { captureViewportCanvas, canvasToBlob } from './imageCapture'
import { generateFilename } from './fileNaming'
import { ExportOptions, ExportResult } from './types'
import { DicomInstance } from '@/types'

/**
 * Export the current viewport as a PNG or JPEG image with optional resolution scaling.
 *
 * The export workflow:
 * 1. Captures the Cornerstone canvas from the enabled viewport element
 * 2. Optionally scales up the resolution (2x or 4x for high-DPI displays)
 * 3. Converts canvas to the specified format (PNG or JPEG)
 * 4. Generates a filename based on DICOM metadata
 * 5. Triggers browser download using FileSaver.js
 *
 * @param element - The enabled Cornerstone viewport element to capture
 * @param currentInstance - Current DICOM instance for filename generation
 * @param options - Export configuration (format, scale, quality, patient ID inclusion)
 * @returns Promise resolving to export result with success status, filename, and optional blob/error
 *
 * @example
 * ```ts
 * // Export as PNG at 2x resolution
 * const result = await exportImage(viewportElement, currentInstance, {
 *   format: 'png',
 *   scale: 2,
 *   includePatientID: false
 * })
 * if (result.success) {
 *   console.log(`Exported: ${result.filename}`)
 * }
 * ```
 *
 * @example
 * ```ts
 * // Export as JPEG with quality control
 * const result = await exportImage(viewportElement, currentInstance, {
 *   format: 'jpeg',
 *   scale: 1,
 *   jpegQuality: 90,
 *   includePatientID: true
 * })
 * ```
 */
export async function exportImage(
  element: HTMLDivElement,
  currentInstance: DicomInstance | null,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    // Capture canvas with resolution scaling
    const canvas = captureViewportCanvas(element, options.scale)
    if (!canvas) {
      return {
        success: false,
        filename: '',
        error: 'Failed to capture viewport canvas'
      }
    }

    // Convert to blob (PDF shouldn't reach here, but handle it just in case)
    const imageFormat = options.format === 'pdf' ? 'png' : options.format
    const quality = options.format === 'jpeg' ? (options.jpegQuality || 95) / 100 : 0.95
    const blob = await canvasToBlob(canvas, imageFormat, quality)

    if (!blob) {
      return {
        success: false,
        filename: '',
        error: 'Failed to convert canvas to blob'
      }
    }

    // Generate filename
    const filename = generateFilename(
      currentInstance,
      options.format,
      options.includePatientID
    )

    // Download file
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      blob
    }
  } catch (err) {
    console.error('Export failed:', err)
    return {
      success: false,
      filename: '',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}
