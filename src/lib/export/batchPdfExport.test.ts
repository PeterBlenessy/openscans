/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Unit tests for batch PDF export
 *
 * Critical functionality tests:
 * - Grid layouts (1x1, 2x2, 2x3, 3x3, 4x4)
 * - Pagination logic
 * - Progress callbacks
 * - Empty favorites handling
 *
 * Target: ~25 assertions, 85%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportBatchPDF } from './batchPdfExport'
import type { FavoriteImage } from '@/stores/favoritesStore'
import { createMockInstance as _createMockInstance } from '@/test/fixtures/dicomData'

// Mock jsPDF (reuse from pdfExport tests)
const mockPdfInstance = {
  addPage: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  output: vi.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' })),
  getTextWidth: vi.fn(() => 50),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  rect: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 297),
      getHeight: vi.fn(() => 210),
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

// Mock cornerstone
vi.mock('@/lib/cornerstone/initCornerstone', () => ({
  cornerstone: {
    loadImage: vi.fn(() => {
      // Create mock pixel data (grayscale)
      const width = 512
      const height = 512
      const pixelData = new Uint16Array(width * height)
      // Fill with some test pattern
      for (let i = 0; i < pixelData.length; i++) {
        pixelData[i] = (i % 256) * 16 // Simple gradient
      }

      return Promise.resolve({
        imageId: 'mock://image',
        width,
        height,
        getPixelData: () => pixelData,
      })
    }),
  },
}))

// Mock canvas for image processing
const createMockCanvas = () => {
  const mockContext = {
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    putImageData: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockContext),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockImageData'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  return canvas
}

describe('Batch PDF Export', () => {
  let mockFavorites: FavoriteImage[]
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    // Save original createElement
    originalCreateElement = document.createElement.bind(document)

    // Mock canvas creation
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return createMockCanvas()
      }
      return originalCreateElement(tagName)
    })
    vi.clearAllMocks()
    mockPdfInstance.addPage.mockClear()
    mockPdfInstance.addImage.mockClear()
    mockPdfInstance.text.mockClear()
    mockPdfInstance.output.mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' }))

    // Create mock favorites matching FavoriteImage interface
    mockFavorites = [
      {
        sopInstanceUID: '1.2.3.4.1',
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: 1,
        imageId: 'dicomweb://1',
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      },
      {
        sopInstanceUID: '1.2.3.4.2',
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: 2,
        imageId: 'dicomweb://2',
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      },
      {
        sopInstanceUID: '1.2.3.4.3',
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: 3,
        imageId: 'dicomweb://3',
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      },
    ]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Empty Favorites Handling', () => {
    it('should return error for empty favorites array', async () => {
      const result = await exportBatchPDF([], {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('No images to export')
    })
  })

  describe('Grid Layouts', () => {
    it('should handle 1x1 grid layout', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '1x1',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 3 images in 1x1 grid = 3 pages (minus first which doesn't call addPage)
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(2)
    })

    it('should handle 2x2 grid layout', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 3 images in 2x2 grid (4 per page) = 1 page
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(0)
    })

    it('should handle 2x3 grid layout', async () => {
      const largeFavorites = Array.from({ length: 10 }, (_, i) => ({
        sopInstanceUID: `1.2.3.4.${i}`,
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: i,
        imageId: `dicomweb://${i}`,
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      }))

      const result = await exportBatchPDF(largeFavorites, {
        gridLayout: '2x3',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 10 images in 2x3 grid (6 per page) = 2 pages (1 addPage call)
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1)
    })

    it('should handle 3x3 grid layout', async () => {
      const largeFavorites = Array.from({ length: 20 }, (_, i) => ({
        sopInstanceUID: `1.2.3.4.${i}`,
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: i,
        imageId: `dicomweb://${i}`,
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      }))

      const result = await exportBatchPDF(largeFavorites, {
        gridLayout: '3x3',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 20 images in 3x3 grid (9 per page) = 3 pages (2 addPage calls)
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(2)
    })

    it('should handle 4x4 grid layout', async () => {
      const largeFavorites = Array.from({ length: 32 }, (_, i) => ({
        sopInstanceUID: `1.2.3.4.${i}`,
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: i,
        imageId: `dicomweb://${i}`,
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      }))

      const result = await exportBatchPDF(largeFavorites, {
        gridLayout: '4x4',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 32 images in 4x4 grid (16 per page) = 2 pages (1 addPage call)
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1)
    })
  })

  describe('Metadata Cover Page', () => {
    it('should add cover page when includeMetadata is true', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: true,
      })

      expect(result.success).toBe(true)
      // With metadata cover page, first image page calls addPage
      expect(mockPdfInstance.addPage).toHaveBeenCalled()
    })

    it('should not add cover page when includeMetadata is false', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 3 images in 2x2 grid = 1 page, no addPage calls
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(0)
    })
  })

  describe('Progress Callbacks', () => {
    it('should call progress callback for each image', async () => {
      const onProgress = vi.fn()

      await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
        onProgress,
      })

      // Should be called 3 times for 3 images
      expect(onProgress).toHaveBeenCalledTimes(3)
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3)
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3)
      expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3)
    })

    it('should work without progress callback', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
        // No onProgress
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Image Loading and Embedding', () => {
    it('should load all favorite images', async () => {
      const { cornerstone } = await import('@/lib/cornerstone/initCornerstone')

      await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      // Should load 3 images
      expect(cornerstone.loadImage).toHaveBeenCalledTimes(3)
      expect(cornerstone.loadImage).toHaveBeenCalledWith('dicomweb://1')
      expect(cornerstone.loadImage).toHaveBeenCalledWith('dicomweb://2')
      expect(cornerstone.loadImage).toHaveBeenCalledWith('dicomweb://3')
    })

    it('should add images to PDF', async () => {
      await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      // Should call addImage 3 times for 3 favorites
      expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(3)
    })
  })

  describe('File Generation', () => {
    it('should generate filename with image count and date', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      // Format: Favorites_3images_20240101.pdf
      expect(result.filename).toMatch(/^Favorites_\d+images_\d{8}\.pdf$/)
      expect(result.filename).toContain('3images') // 3 favorites
    })

    it('should call saveAs to trigger download', async () => {
      const { saveAs } = await import('file-saver')

      await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/\.pdf$/)
      )
    })

    it('should return success result with blob', async () => {
      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      expect(result.filename).toBeTruthy()
      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should continue when one image fails to load', async () => {
      const { cornerstone } = await import('@/lib/cornerstone/initCornerstone')

      // First call fails, second and third succeed
      vi.mocked(cornerstone.loadImage)
        .mockRejectedValueOnce(new Error('Failed to load image'))
        .mockResolvedValueOnce({
          imageId: 'mock://image/2',
          width: 512,
          height: 512,
          getPixelData: () => new Uint16Array(512 * 512),
        })
        .mockResolvedValueOnce({
          imageId: 'mock://image/3',
          width: 512,
          height: 512,
          getPixelData: () => new Uint16Array(512 * 512),
        })

      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      // Should still succeed (2 out of 3 images loaded)
      expect(result.success).toBe(true)
      // Only 2 images added (first one failed)
      expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(2)
    })

    it('should return error result on PDF creation failure', async () => {
      const { jsPDF } = await import('jspdf')
      vi.mocked(jsPDF).mockImplementationOnce(() => {
        throw new Error('PDF creation failed')
      })

      const result = await exportBatchPDF(mockFavorites, {
        gridLayout: '2x2',
        includeMetadata: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF creation failed')
    })
  })

  describe('Pagination Logic', () => {
    it('should correctly paginate 10 images in 3x3 grid', async () => {
      const largeFavorites = Array.from({ length: 10 }, (_, i) => ({
        sopInstanceUID: `1.2.3.4.${i}`,
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: i,
        imageId: `dicomweb://${i}`,
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      }))

      const result = await exportBatchPDF(largeFavorites, {
        gridLayout: '3x3',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // 10 images, 9 per page = 2 pages
      // Page 1: images 0-8 (9 images)
      // Page 2: images 9 (1 image)
      // First page doesn't call addPage, second page does
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1)
      expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(10)
    })

    it('should handle exact page fit (9 images in 3x3)', async () => {
      const exactFit = Array.from({ length: 9 }, (_, i) => ({
        sopInstanceUID: `1.2.3.4.${i}`,
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: i,
        imageId: `dicomweb://${i}`,
        modality: 'MR',
        seriesNumber: 1,
        favoritedAt: Date.now(),
      }))

      const result = await exportBatchPDF(exactFit, {
        gridLayout: '3x3',
        includeMetadata: false,
      })

      expect(result.success).toBe(true)
      // Exactly 9 images fit on 1 page
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(0)
    })
  })
})
