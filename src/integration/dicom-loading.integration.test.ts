/**
 * Integration tests for DICOM loading workflow
 *
 * Tests the complete flow from file selection through parsing,
 * study organization, and store updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStudyStore } from '@/stores/studyStore'
import { useDicomLoader } from '@/hooks/useDicomLoader'
import { renderHook, act } from '@testing-library/react'
import { createMockStudy } from '@/test/fixtures/dicomData'

// Mock DicomStudyService
vi.mock('@/lib/dicom/DicomStudyService', () => ({
  dicomStudyService: {
    loadStudiesFromFiles: vi.fn(),
  },
}))

describe('DICOM Loading Integration', () => {
  beforeEach(() => {
    useStudyStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('Single study loading', () => {
    it('should load files, parse DICOM, organize studies, and update store', async () => {
      const mockStudies = [createMockStudy(2, 5)]
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useDicomLoader())

      // Initial state
      expect(useStudyStore.getState().studies).toEqual([])
      expect(result.current.isLoading).toBe(false)

      // Create mock files
      const mockFiles = [
        new File([''], 'test1.dcm', { type: 'application/dicom' }),
        new File([''], 'test2.dcm', { type: 'application/dicom' }),
      ]

      // Load files
      await act(async () => {
        await result.current.loadFiles(mockFiles)
      })

      // Verify service was called
      expect(dicomStudyService.loadStudiesFromFiles).toHaveBeenCalledWith(
        mockFiles,
        undefined
      )

      // Verify store was updated
      const state = useStudyStore.getState()
      expect(state.studies).toEqual(mockStudies)
      expect(state.studies).toHaveLength(1)
      expect(state.studies[0].series).toHaveLength(2)
      expect(state.studies[0].series[0].instances).toHaveLength(5)

      // Verify loading state returned to false
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle loading errors gracefully', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      const error = new Error('Failed to parse DICOM files')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockRejectedValue(error)

      const { result } = renderHook(() => useDicomLoader())

      const mockFiles = [new File([''], 'invalid.dcm', { type: 'application/dicom' })]

      // Try to load files
      await act(async () => {
        try {
          await result.current.loadFiles(mockFiles)
        } catch (err) {
          // Expected to throw
        }
      })

      // Verify error was set
      expect(result.current.error).toBe('Failed to parse DICOM files')
      expect(result.current.isLoading).toBe(false)

      // Verify store was not updated
      expect(useStudyStore.getState().studies).toEqual([])
    })

    it('should handle empty file list', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue([])

      const { result } = renderHook(() => useDicomLoader())

      await act(async () => {
        try {
          await result.current.loadFiles([])
        } catch (err) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('No valid DICOM files found in the selected files/folder')
    })
  })

  describe('Multi-study loading', () => {
    it('should organize multiple studies correctly', async () => {
      const mockStudies = [
        createMockStudy(2, 3), // Study 1: 2 series, 3 instances each
        createMockStudy(1, 5), // Study 2: 1 series, 5 instances
      ]
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useDicomLoader())

      const mockFiles = [
        new File([''], 'study1_1.dcm', { type: 'application/dicom' }),
        new File([''], 'study2_1.dcm', { type: 'application/dicom' }),
      ]

      await act(async () => {
        await result.current.loadFiles(mockFiles)
      })

      const state = useStudyStore.getState()
      expect(state.studies).toHaveLength(2)
      expect(state.studies[0].series).toHaveLength(2)
      expect(state.studies[1].series).toHaveLength(1)
    })
  })

  describe('Store integration', () => {
    it('should set loading state in both hook and store', async () => {
      const mockStudies = [createMockStudy(1, 3)]
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useDicomLoader())
      const mockFiles = [new File([''], 'test.dcm', { type: 'application/dicom' })]

      // After loading completes, state should be false
      await act(async () => {
        await result.current.loadFiles(mockFiles)
      })

      // Check loading states are cleared after completion
      expect(result.current.isLoading).toBe(false)
      expect(useStudyStore.getState().isLoading).toBe(false)
    })

    it('should clear store errors before loading', async () => {
      const mockStudies = [createMockStudy(1, 2)]
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue(mockStudies)

      // Set an error in the store
      useStudyStore.getState().setError('Previous error')
      expect(useStudyStore.getState().error).toBe('Previous error')

      const { result } = renderHook(() => useDicomLoader())

      // Verify hook is ready
      expect(result.current).toBeDefined()
      expect(result.current.loadFiles).toBeDefined()

      const mockFiles = [new File([''], 'test.dcm', { type: 'application/dicom' })]

      await act(async () => {
        await result.current.loadFiles(mockFiles)
      })

      // Error should be cleared
      expect(useStudyStore.getState().error).toBeNull()
    })
  })

  describe('Desktop mode with folder path', () => {
    it('should pass folder path to service for caching', async () => {
      const mockStudies = [createMockStudy(1, 3)]
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromFiles).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useDicomLoader())

      // Ensure hook is ready
      expect(result.current).toBeDefined()

      const mockFiles = [new File([''], 'test.dcm', { type: 'application/dicom' })]
      const folderPath = '/path/to/dicom/folder'

      await act(async () => {
        await result.current.loadFiles(mockFiles, folderPath)
      })

      // Verify service was called with folder path
      expect(dicomStudyService.loadStudiesFromFiles).toHaveBeenCalledWith(
        mockFiles,
        folderPath
      )
    })
  })
})
