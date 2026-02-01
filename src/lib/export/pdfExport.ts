import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { captureViewportCanvas, canvasToBlob } from './imageCapture'
import { generateFilename } from './fileNaming'
import { ExportOptions, ExportResult } from './types'
import { DicomInstance } from '@/types'
import { ViewportSettings } from '@/types'
import { formatSeriesDescription } from '../utils/formatSeriesDescription'

/**
 * Export the current viewport as a PDF report with comprehensive DICOM metadata.
 *
 * Creates a professional 2-page PDF report in A4 landscape format:
 * - **Page 1**: Metadata cover page with study information, image parameters, and export settings
 * - **Page 2**: Captured viewport image with optional annotations and window/level indicators
 *
 * The PDF workflow:
 * 1. Creates jsPDF document (A4 landscape for typical DICOM aspect ratios)
 * 2. Generates metadata cover page with DICOM tags and viewport settings
 * 3. Captures viewport canvas and embeds as image on page 2
 * 4. Generates filename based on DICOM metadata
 * 5. Triggers browser download using FileSaver.js
 *
 * Privacy: Patient identifying information is only included if `includePatientID` or
 * `includePatientName` options are enabled, allowing HIPAA-compliant exports.
 *
 * @param element - The enabled Cornerstone viewport element to capture
 * @param currentInstance - Current DICOM instance for metadata and filename
 * @param viewportSettings - Current viewport settings (window/level, zoom, etc.) for documentation
 * @param options - Export configuration (scale, quality, patient info inclusion)
 * @returns Promise resolving to export result with success status, filename, and optional blob/error
 *
 * @example
 * ```ts
 * // Export as PDF with metadata, excluding patient information
 * const result = await exportPDF(
 *   viewportElement,
 *   currentInstance,
 *   viewportSettings,
 *   {
 *     format: 'pdf',
 *     scale: 2,
 *     includePatientID: false,
 *     includePatientName: false
 *   }
 * )
 * if (result.success) {
 *   console.log(`Exported: ${result.filename}`)
 * }
 * ```
 *
 * @example
 * ```ts
 * // Export with full patient information (authorized use only)
 * const result = await exportPDF(
 *   viewportElement,
 *   currentInstance,
 *   viewportSettings,
 *   {
 *     format: 'pdf',
 *     scale: 1,
 *     includePatientID: true,
 *     includePatientName: true
 *   }
 * )
 * ```
 */
export async function exportPDF(
  element: HTMLDivElement,
  currentInstance: DicomInstance | null,
  viewportSettings: ViewportSettings,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    // Create PDF document (A4 landscape for typical DICOM aspect ratio)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15

    // Page 1: Metadata cover page
    addCoverPage(pdf, currentInstance, viewportSettings, options, pageWidth, pageHeight, margin)

    // Page 2: Image
    pdf.addPage()
    await addImagePage(pdf, element, currentInstance, viewportSettings, options, pageWidth, pageHeight, margin)

    // Generate filename
    const filename = generateFilename(currentInstance, 'pdf', options.includePatientID)

    // Convert to blob and download
    const blob = pdf.output('blob')
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      blob
    }
  } catch (err) {
    console.error('PDF export failed:', err)
    return {
      success: false,
      filename: '',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Add metadata cover page to PDF
 */
function addCoverPage(
  pdf: jsPDF,
  instance: DicomInstance | null,
  viewportSettings: ViewportSettings,
  options: ExportOptions,
  _pageWidth: number,
  _pageHeight: number,
  margin: number
) {
  let yPosition = margin

  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('OpenScans - Export Report', margin, yPosition)
  yPosition += 10

  // Export date
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  const exportDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  pdf.text(`Export Date: ${exportDate}`, margin, yPosition)
  yPosition += 15

  // Section: Study Information
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Study Information', margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  if (instance?.metadata) {
    const { metadata } = instance

    // Always include (non-identifying)
    addMetadataRow(pdf, margin, yPosition, 'Modality', metadata.modality || 'Unknown')
    yPosition += 6

    if (metadata.studyDate) {
      addMetadataRow(pdf, margin, yPosition, 'Study Date', formatDicomDate(metadata.studyDate))
      yPosition += 6
    }

    if (metadata.seriesNumber !== undefined) {
      addMetadataRow(pdf, margin, yPosition, 'Series Number', String(metadata.seriesNumber))
      yPosition += 6
    }

    // Optional patient information (only if enabled)
    if (options.includePatientName && metadata.patientName) {
      addMetadataRow(pdf, margin, yPosition, 'Patient Name', metadata.patientName)
      yPosition += 6
    }

    if (options.includePatientID && metadata.patientID) {
      addMetadataRow(pdf, margin, yPosition, 'Patient ID', metadata.patientID)
      yPosition += 6
    }

    if (options.includeStudyDescription && metadata.studyDescription) {
      addMetadataRow(pdf, margin, yPosition, 'Study Description', metadata.studyDescription)
      yPosition += 6
    }

    if (options.includeSeriesDescription && metadata.seriesDescription) {
      addMetadataRow(pdf, margin, yPosition, 'Series Description', formatSeriesDescription(metadata.seriesDescription))
      yPosition += 6
    }
  }

  yPosition += 5

  // Section: Image Information
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Image Information', margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  if (instance?.metadata) {
    const { metadata } = instance

    if (metadata.instanceNumber !== undefined) {
      addMetadataRow(pdf, margin, yPosition, 'Instance Number', String(metadata.instanceNumber))
      yPosition += 6
    }

    if (metadata.columns && metadata.rows) {
      addMetadataRow(pdf, margin, yPosition, 'Dimensions', `${metadata.columns} × ${metadata.rows}`)
      yPosition += 6
    }

    if (metadata.sliceLocation !== undefined) {
      addMetadataRow(pdf, margin, yPosition, 'Slice Location', `${metadata.sliceLocation.toFixed(2)} mm`)
      yPosition += 6
    }
  }

  yPosition += 5

  // Section: Viewport Settings
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Viewport Settings', margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  addMetadataRow(pdf, margin, yPosition, 'Window Width', String(Math.round(viewportSettings.windowWidth)))
  yPosition += 6

  addMetadataRow(pdf, margin, yPosition, 'Window Center', String(Math.round(viewportSettings.windowCenter)))
  yPosition += 6

  addMetadataRow(pdf, margin, yPosition, 'Zoom', `${viewportSettings.zoom.toFixed(1)}x`)
  yPosition += 6

  if (viewportSettings.rotation !== 0) {
    addMetadataRow(pdf, margin, yPosition, 'Rotation', `${viewportSettings.rotation}°`)
    yPosition += 6
  }

  if (viewportSettings.flipHorizontal || viewportSettings.flipVertical) {
    const flips = []
    if (viewportSettings.flipHorizontal) flips.push('Horizontal')
    if (viewportSettings.flipVertical) flips.push('Vertical')
    addMetadataRow(pdf, margin, yPosition, 'Flipped', flips.join(', '))
    yPosition += 6
  }

  if (viewportSettings.invert) {
    addMetadataRow(pdf, margin, yPosition, 'Inverted', 'Yes')
  }
}

/**
 * Add image page to PDF
 */
async function addImagePage(
  pdf: jsPDF,
  element: HTMLDivElement,
  instance: DicomInstance | null,
  viewportSettings: ViewportSettings,
  options: ExportOptions,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  // Capture canvas (use 2x scale for PDF to ensure good quality)
  const scale = Math.max(2, options.scale) as 1 | 2 | 4
  const canvas = captureViewportCanvas(element, scale)

  if (!canvas) {
    throw new Error('Failed to capture viewport canvas')
  }

  // Convert to JPEG blob for PDF embedding
  const blob = await canvasToBlob(canvas, 'jpeg', 0.9)
  if (!blob) {
    throw new Error('Failed to convert canvas to blob')
  }

  // Convert blob to data URL
  const dataUrl = await blobToDataUrl(blob)

  // Calculate image dimensions to fit page with margins
  const availableWidth = pageWidth - 2 * margin
  const availableHeight = pageHeight - 2 * margin - 15 // Reserve space for caption

  const imageAspectRatio = canvas.width / canvas.height
  const availableAspectRatio = availableWidth / availableHeight

  let imageWidth: number
  let imageHeight: number

  if (imageAspectRatio > availableAspectRatio) {
    // Image is wider - fit to width
    imageWidth = availableWidth
    imageHeight = availableWidth / imageAspectRatio
  } else {
    // Image is taller - fit to height
    imageHeight = availableHeight
    imageWidth = availableHeight * imageAspectRatio
  }

  // Center the image on the page
  const imageX = (pageWidth - imageWidth) / 2
  const imageY = margin

  // Add image to PDF
  pdf.addImage(dataUrl, 'JPEG', imageX, imageY, imageWidth, imageHeight)

  // Add caption below image
  const captionY = imageY + imageHeight + 8
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100)

  const metadata = instance?.metadata
  const parts: string[] = []

  if (metadata?.instanceNumber !== undefined) {
    parts.push(`Instance ${metadata.instanceNumber}`)
  }

  if (metadata?.columns && metadata?.rows) {
    parts.push(`${metadata.columns}×${metadata.rows}`)
  }

  parts.push(`W/L: ${Math.round(viewportSettings.windowWidth)}/${Math.round(viewportSettings.windowCenter)}`)
  parts.push(`Scale: ${viewportSettings.zoom.toFixed(1)}x`)

  const caption = parts.join(' | ')
  const captionWidth = pdf.getTextWidth(caption)
  const captionX = (pageWidth - captionWidth) / 2

  pdf.text(caption, captionX, captionY)
}

/**
 * Helper: Add metadata row to PDF
 */
function addMetadataRow(pdf: jsPDF, x: number, y: number, label: string, value: string) {
  pdf.setFont('helvetica', 'bold')
  const labelText = `${label}:`
  pdf.text(labelText, x, y)

  pdf.setFont('helvetica', 'normal')
  const labelWidth = pdf.getTextWidth(labelText)
  pdf.text(value, x + labelWidth + 2, y) // +2mm spacing between label and value
}

/**
 * Helper: Format DICOM date (YYYYMMDD) to readable format
 */
function formatDicomDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return dateStr

  const cleanDate = dateStr.replace(/[^0-9]/g, '')
  const year = cleanDate.substring(0, 4)
  const month = cleanDate.substring(4, 6)
  const day = cleanDate.substring(6, 8)

  const date = new Date(`${year}-${month}-${day}`)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Helper: Convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
