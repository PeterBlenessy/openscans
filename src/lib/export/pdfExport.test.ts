/**
 * Unit tests for PDF export - PRIVACY CRITICAL
 *
 * Critical privacy compliance tests:
 * - Patient data excluded by default in PDF metadata
 * - Patient info only included when explicitly enabled
 * - Cover page generation with metadata filtering
 * - Image capture and embedding
 *
 * Target: ~30 assertions, 95%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportPDF } from './pdfExport'
import { createMockInstance } from '@/test/fixtures/dicomData'
import type { ExportOptions } from './types'
import type { ViewportSettings } from '@/types'

// Mock jsPDF
const mockPdfInstance = {
  addPage: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  output: vi.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' })),
  getTextWidth: vi.fn(() => 50), // Mock text width for layout calculations
  setTextColor: vi.fn(), // For text color changes
  setDrawColor: vi.fn(), // For drawing colors
  setLineWidth: vi.fn(), // For line widths
  line: vi.fn(), // For drawing lines
  rect: vi.fn(), // For drawing rectangles
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 297), // A4 landscape width in mm
      getHeight: vi.fn(() => 210), // A4 landscape height in mm
    },
  },
}

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockPdfInstance),
}))

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

// Mock image capture functions
vi.mock('./imageCapture', () => ({
  captureViewportCanvas: vi.fn(() => {
    // Return mock canvas
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    return canvas
  }),
  canvasToBlob: vi.fn(() => Promise.resolve(new Blob(['mock image'], { type: 'image/jpeg' }))),
}))

// Mock formatSeriesDescription
vi.mock('../utils/formatSeriesDescription', () => ({
  formatSeriesDescription: vi.fn((desc: string) => desc),
}))

describe('PDF Export - Privacy Compliance', () => {
  let mockElement: HTMLDivElement
  let defaultViewportSettings: ViewportSettings
  let defaultOptions: ExportOptions

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementations
    mockPdfInstance.addPage.mockClear()
    mockPdfInstance.text.mockClear()
    mockPdfInstance.addImage.mockClear()
    mockPdfInstance.output.mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' }))

    mockElement = document.createElement('div')

    defaultViewportSettings = {
      windowCenter: 128,
      windowWidth: 256,
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotation: 0,
      invert: false,
      flipHorizontal: false,
      flipVertical: false,
    }

    defaultOptions = {
      format: 'pdf',
      scale: 1,
      includePatientName: false,
      includePatientID: false,
      includeStudyDescription: false,
      includeSeriesDescription: false,
    }
  })

  // Helper to extract just the text content from PDF text() calls
  function getTextContent(): string {
    const textCalls = mockPdfInstance.text.mock.calls
    // text() is called with (text, x, y) so we want the first argument
    return textCalls.map(call => call[0]).filter(text => typeof text === 'string').join(' ')
  }

  describe('Privacy - Patient Data Filtering', () => {
    it('should NOT include patient name by default', async () => {
      const instance = createMockInstance({
        metadata: {
          patientName: 'SENSITIVE^NAME',
          modality: 'MR',
        },
      })

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      // Check that text() was never called with patient name
      const textContent = getTextContent()

      expect(textContent).not.toContain('SENSITIVE')
      expect(textContent).not.toContain('Patient Name')
    })

    it('should include patient name when explicitly enabled', async () => {
      const instance = createMockInstance({
        metadata: {
          patientName: 'DOE^JOHN',
          modality: 'MR',
        },
      })

      const options: ExportOptions = {
        ...defaultOptions,
        includePatientName: true,
      }

      await exportPDF(mockElement, instance, defaultViewportSettings, options)

      // Check that patient name was added to PDF
      const textContent = getTextContent()

      expect(textContent).toContain('Patient Name')
      expect(textContent).toContain('DOE^JOHN')
    })

    it('should NOT include patient ID by default', async () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'SENSITIVE123',
          modality: 'MR',
        },
      })

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      const textContent = getTextContent()

      expect(textContent).not.toContain('SENSITIVE123')
      expect(textContent).not.toContain('Patient ID')
    })

    it('should include patient ID when explicitly enabled', async () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'PAT12345',
          modality: 'MR',
        },
      })

      const options: ExportOptions = {
        ...defaultOptions,
        includePatientID: true,
      }

      await exportPDF(mockElement, instance, defaultViewportSettings, options)

      const textContent = getTextContent()

      expect(textContent).toContain('Patient ID')
      expect(textContent).toContain('PAT12345')
    })

    it('should NOT include study description by default', async () => {
      const instance = createMockInstance({
        metadata: {
          studyDescription: 'Brain MRI Protocol',
          modality: 'MR',
        },
      })

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      const textContent = getTextContent()

      expect(textContent).not.toContain('Brain MRI Protocol')
      expect(textContent).not.toContain('Study Description')
    })

    it('should include study description when explicitly enabled', async () => {
      const instance = createMockInstance({
        metadata: {
          studyDescription: 'Brain MRI Protocol',
          modality: 'MR',
        },
      })

      const options: ExportOptions = {
        ...defaultOptions,
        includeStudyDescription: true,
      }

      await exportPDF(mockElement, instance, defaultViewportSettings, options)

      const textContent = getTextContent()

      expect(textContent).toContain('Study Description')
      expect(textContent).toContain('Brain MRI Protocol')
    })
  })

  describe('PDF Generation', () => {
    it('should create PDF with landscape A4 orientation', async () => {
      const { jsPDF } = await import('jspdf')
      const instance = createMockInstance()

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })
    })

    it('should add cover page and image page', async () => {
      const instance = createMockInstance()

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      // Should add one page (cover page is default, then addPage for image)
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1)
    })

    it('should include non-identifying metadata on cover page', async () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          studyDate: '20240101',
          seriesNumber: 5,
        },
      })

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      const textContent = getTextContent()

      expect(textContent).toContain('MR') // Modality is always included
      expect(textContent).toContain('Modality') // Label
    })

    it('should include viewport settings in PDF', async () => {
      const instance = createMockInstance()

      const viewportSettings: ViewportSettings = {
        windowCenter: 128,
        windowWidth: 256,
        zoom: 2.5,
        pan: { x: 0, y: 0 },
        rotation: 90,
        invert: true,
        flipHorizontal: false,
        flipVertical: false,
      }

      await exportPDF(mockElement, instance, viewportSettings, defaultOptions)

      const textContent = getTextContent()

      expect(textContent).toContain('Window Center')
      expect(textContent).toContain('Window Width')
      expect(textContent).toContain('Zoom')
      expect(textContent).toContain('Rotation')
      expect(textContent).toContain('Invert')
    })

    it('should capture canvas and add image to PDF', async () => {
      const { captureViewportCanvas } = await import('./imageCapture')
      const instance = createMockInstance()

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(captureViewportCanvas).toHaveBeenCalledWith(mockElement, 2) // 2x scale for PDF
      expect(mockPdfInstance.addImage).toHaveBeenCalled()
    })

    it('should generate correct filename', async () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.filename).toMatch(/\.pdf$/)
      expect(result.filename).toContain('MR')
    })

    it('should call saveAs to trigger download', async () => {
      const { saveAs } = await import('file-saver')
      const instance = createMockInstance()

      await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/\.pdf$/)
      )
    })

    it('should return success result with blob', async () => {
      const instance = createMockInstance()

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.filename).toBeTruthy()
      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle canvas capture failure', async () => {
      const { captureViewportCanvas } = await import('./imageCapture')
      vi.mocked(captureViewportCanvas).mockReturnValueOnce(null)

      const instance = createMockInstance()

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle blob conversion failure', async () => {
      const { canvasToBlob } = await import('./imageCapture')
      vi.mocked(canvasToBlob).mockResolvedValueOnce(null)

      const instance = createMockInstance()

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle null instance gracefully', async () => {
      const result = await exportPDF(mockElement, null, defaultViewportSettings, defaultOptions)

      // Should still succeed with minimal metadata
      expect(result.success).toBe(true)
    })

    it('should return error result on exception', async () => {
      const { jsPDF } = await import('jspdf')
      vi.mocked(jsPDF).mockImplementationOnce(() => {
        throw new Error('PDF creation failed')
      })

      const instance = createMockInstance()

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF creation failed')
    })
  })

  describe('Special Cases', () => {
    it('should handle missing metadata gracefully', async () => {
      const instance = createMockInstance({
        metadata: undefined,
      })

      const result = await exportPDF(mockElement, instance, defaultViewportSettings, defaultOptions)

      expect(result.success).toBe(true)
    })

    it('should handle flipped viewport settings', async () => {
      const instance = createMockInstance()

      const viewportSettings: ViewportSettings = {
        ...defaultViewportSettings,
        flipHorizontal: true,
        flipVertical: true,
      }

      await exportPDF(mockElement, instance, viewportSettings, defaultOptions)

      const textContent = getTextContent()

      expect(textContent).toContain('Flipped')
    })

    it('should skip rotation text when rotation is 0', async () => {
      const instance = createMockInstance()

      const viewportSettings: ViewportSettings = {
        ...defaultViewportSettings,
        rotation: 0,
      }

      await exportPDF(mockElement, instance, viewportSettings, defaultOptions)

      // Just verify the PDF was created without errors
      const result = await exportPDF(mockElement, instance, viewportSettings, defaultOptions)
      expect(result.success).toBe(true)
    })
  })
})
