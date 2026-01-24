import { saveAs } from 'file-saver'
import { captureViewportCanvas, canvasToBlob } from './imageCapture'
import { generateFilename } from './fileNaming'
import { ExportOptions, ExportResult } from './types'
import { DicomInstance } from '@/types'

/**
 * Export viewport as PNG or JPEG image
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
