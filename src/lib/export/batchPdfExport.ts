import { jsPDF } from 'jspdf'
import { saveFile } from './fileSaver'
import { FavoriteImage } from '@/stores/favoritesStore'
import { cornerstone } from '@/lib/cornerstone/initCornerstone'
import { ExportResult } from './types'

export type GridLayout = '1x1' | '2x2' | '2x3' | '3x3' | '4x4'

interface BatchExportOptions {
  gridLayout: GridLayout
  includeMetadata: boolean
  onProgress?: (current: number, total: number) => void
}

/**
 * Export multiple favorite images to a single PDF with grid layout
 */
export async function exportBatchPDF(
  favorites: FavoriteImage[],
  options: BatchExportOptions
): Promise<ExportResult> {
  if (favorites.length === 0) {
    return {
      success: false,
      filename: '',
      error: 'No images to export'
    }
  }

  try {
    // Create PDF document (A4 landscape for better image display)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    let pageAdded = false

    // Add metadata cover page if requested
    if (options.includeMetadata) {
      addBatchCoverPage(pdf, favorites, pageWidth, pageHeight, margin)
      pageAdded = true
    }

    // Get grid dimensions
    const { cols, rows } = getGridDimensions(options.gridLayout)
    const imagesPerPage = cols * rows

    // Calculate cell dimensions
    const availableWidth = pageWidth - 2 * margin
    const availableHeight = pageHeight - 2 * margin
    const cellWidth = availableWidth / cols
    const cellHeight = availableHeight / rows
    const imageMargin = 2 // Small margin between images

    // Process images in batches (one page at a time)
    for (let i = 0; i < favorites.length; i += imagesPerPage) {
      const pageImages = favorites.slice(i, i + imagesPerPage)

      // Add new page (except for first page if metadata was added)
      if (pageAdded) {
        pdf.addPage()
      } else {
        pageAdded = true
      }

      // Load and add images for this page
      for (let j = 0; j < pageImages.length; j++) {
        const favorite = pageImages[j]

        // Update progress
        if (options.onProgress) {
          options.onProgress(i + j + 1, favorites.length)
        }

        // Calculate grid position
        const col = j % cols
        const row = Math.floor(j / cols)
        const x = margin + col * cellWidth + imageMargin
        const y = margin + row * cellHeight + imageMargin
        const maxWidth = cellWidth - 2 * imageMargin
        const maxHeight = cellHeight - 2 * imageMargin - 6 // Reserve 6mm for caption

        try {
          // Load image using Cornerstone
          const image = await cornerstone.loadImage(favorite.imageId)

          // Create a temporary canvas to render the image
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height

          const context = canvas.getContext('2d')
          if (!context) continue

          // Render image to canvas
          const imageData = image.getPixelData()
          const canvasImageData = context.createImageData(image.width, image.height)

          // Convert pixel data to RGBA
          for (let p = 0; p < imageData.length; p++) {
            const value = imageData[p]
            canvasImageData.data[p * 4] = value
            canvasImageData.data[p * 4 + 1] = value
            canvasImageData.data[p * 4 + 2] = value
            canvasImageData.data[p * 4 + 3] = 255
          }

          context.putImageData(canvasImageData, 0, 0)

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

          // Calculate image dimensions to fit in cell
          const imageAspect = image.width / image.height
          const cellAspect = maxWidth / maxHeight

          let imgWidth: number
          let imgHeight: number

          if (imageAspect > cellAspect) {
            // Image is wider - fit to width
            imgWidth = maxWidth
            imgHeight = maxWidth / imageAspect
          } else {
            // Image is taller - fit to height
            imgHeight = maxHeight
            imgWidth = maxHeight * imageAspect
          }

          // Center image in cell
          const imgX = x + (maxWidth - imgWidth) / 2
          const imgY = y + (maxHeight - imgHeight) / 2

          // Add image to PDF
          pdf.addImage(dataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight)

          // Add caption below image
          const captionY = y + maxHeight + 4
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(100)

          const caption = `#${favorite.instanceNumber}`
          const captionWidth = pdf.getTextWidth(caption)
          const captionX = x + (maxWidth - captionWidth) / 2

          pdf.text(caption, captionX, captionY)

        } catch (err) {
          console.error(`Failed to load image ${favorite.sopInstanceUID}:`, err)
          // Continue with next image even if one fails
        }
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const filename = `Favorites_${favorites.length}images_${timestamp}.pdf`

    // Save PDF
    const blob = pdf.output('blob')
    await saveFile(blob, filename)

    return {
      success: true,
      filename,
      blob
    }
  } catch (err) {
    console.error('Batch PDF export failed:', err)
    return {
      success: false,
      filename: '',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Get grid dimensions for layout
 */
function getGridDimensions(layout: GridLayout): { cols: number; rows: number } {
  switch (layout) {
    case '1x1':
      return { cols: 1, rows: 1 }
    case '2x2':
      return { cols: 2, rows: 2 }
    case '2x3':
      return { cols: 3, rows: 2 } // 3 columns x 2 rows for landscape
    case '3x3':
      return { cols: 3, rows: 3 }
    case '4x4':
      return { cols: 4, rows: 4 }
    default:
      return { cols: 1, rows: 1 }
  }
}

/**
 * Add cover page with batch export summary
 */
function addBatchCoverPage(
  pdf: jsPDF,
  favorites: FavoriteImage[],
  _pageWidth: number,
  _pageHeight: number,
  margin: number
) {
  let yPosition = margin

  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('OpenScans - Favorites Export', margin, yPosition)
  yPosition += 10

  // Export info
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
  yPosition += 6
  pdf.text(`Total Images: ${favorites.length}`, margin, yPosition)
  yPosition += 15

  // Summary section
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Summary', margin, yPosition)
  yPosition += 7

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  // Group by study/series
  const studies = new Map<string, FavoriteImage[]>()
  favorites.forEach((fav) => {
    const key = `${fav.studyDate || 'Unknown'}_${fav.seriesNumber || 0}`
    if (!studies.has(key)) {
      studies.set(key, [])
    }
    studies.get(key)!.push(fav)
  })

  studies.forEach((images) => {
    const first = images[0]
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${first.modality || 'Unknown'} - Series ${first.seriesNumber}`, margin, yPosition)
    yPosition += 5

    pdf.setFont('helvetica', 'normal')
    pdf.text(`  ${images.length} images • ${first.studyDate ? formatDate(first.studyDate) : 'Unknown date'}`, margin, yPosition)
    yPosition += 6
  })
}

/**
 * Format DICOM date
 */
function formatDate(dateStr: string): string {
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
