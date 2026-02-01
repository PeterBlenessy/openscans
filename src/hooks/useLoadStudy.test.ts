/**
 * Unit tests for useLoadStudy hook
 *
 * Tests study loading from recent entries including:
 * - Desktop mode (folder path)
 * - Web mode (directory handle)
 * - Caching
 * - Permission handling
 * - Error handling
 * - Study selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoadStudy } from './useLoadStudy'
import { useStudyStore } from '@/stores/studyStore'
import { createMockStudy } from '@/test/fixtures/dicomData'
import type { RecentStudyEntry } from '@/stores/recentStudiesStore'

// Mock DicomStudyService
vi.mock('@/lib/dicom/DicomStudyService', () => ({
  dicomStudyService: {
    loadStudiesFromDirectory: vi.fn(),
    loadStudiesFromHandle: vi.fn(),
  },
}))

// Mock directory handle storage
vi.mock('@/lib/storage/directoryHandleStorage', () => ({
  getDirectoryHandle: vi.fn(),
}))

describe('useLoadStudy', () => {
  const mockStudies = [createMockStudy(2, 3), createMockStudy(1, 2)]

  beforeEach(() => {
    vi.clearAllMocks()
    useStudyStore.getState().reset()
  })

  describe('initial state', () => {
    it('should return initial loading state as false', () => {
      const { result } = renderHook(() => useLoadStudy())
      expect(result.current.isLoading).toBe(false)
    })

    it('should return initial error as null', () => {
      const { result } = renderHook(() => useLoadStudy())
      expect(result.current.error).toBeNull()
    })
  })

  describe('loadStudy - desktop mode', () => {
    it('should load study from folder path', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[0].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      let studies: any
      await act(async () => {
        studies = await result.current.loadStudy(entry)
      })

      expect(dicomStudyService.loadStudiesFromDirectory).toHaveBeenCalledWith(
        '/path/to/dicom',
        { useCache: true }
      )
      expect(studies).toEqual(mockStudies)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set studies in store', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[0].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(useStudyStore.getState().studies).toEqual(mockStudies)
    })

    it('should select target study if specified', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[1].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry, {
          targetStudyUID: mockStudies[1].studyInstanceUID,
        })
      })

      expect(useStudyStore.getState().currentStudy?.studyInstanceUID).toBe(
        mockStudies[1].studyInstanceUID
      )
    })
  })

  describe('loadStudy - web mode', () => {
    it('should load study from directory handle', async () => {
      const mockHandle = {} as FileSystemDirectoryHandle
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      const { getDirectoryHandle } = await import('@/lib/storage/directoryHandleStorage')

      vi.mocked(getDirectoryHandle).mockResolvedValue(mockHandle)
      vi.mocked(dicomStudyService.loadStudiesFromHandle).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[0].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        directoryHandleId: 'handle-id-123',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(getDirectoryHandle).toHaveBeenCalledWith('handle-id-123')
      expect(dicomStudyService.loadStudiesFromHandle).toHaveBeenCalledWith(
        mockHandle,
        {
          useCache: true,
          cacheKey: 'handle-id-123',
          requestPermission: false,
        }
      )
    })

    it('should request permission when specified', async () => {
      const mockHandle = {} as FileSystemDirectoryHandle
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      const { getDirectoryHandle } = await import('@/lib/storage/directoryHandleStorage')

      vi.mocked(getDirectoryHandle).mockResolvedValue(mockHandle)
      vi.mocked(dicomStudyService.loadStudiesFromHandle).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[0].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        directoryHandleId: 'handle-id-123',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry, { requestPermission: true })
      })

      expect(dicomStudyService.loadStudiesFromHandle).toHaveBeenCalledWith(
        mockHandle,
        expect.objectContaining({ requestPermission: true })
      )
    })

    it('should handle missing directory handle', async () => {
      const { getDirectoryHandle } = await import('@/lib/storage/directoryHandleStorage')
      vi.mocked(getDirectoryHandle).mockResolvedValue(null)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        directoryHandleId: 'handle-id-123',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      let studies: any
      await act(async () => {
        studies = await result.current.loadStudy(entry)
      })

      expect(studies).toBeNull()
      expect(result.current.error).toContain('Directory handle not found')
    })
  })

  describe('error handling', () => {
    it('should set error on load failure', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockRejectedValue(
        new Error('Load failed')
      )

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(result.current.error).toBe('Load failed')
      expect(result.current.isLoading).toBe(false)
    })

    it('should call onError callback on failure', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      const error = new Error('Load failed')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry, { onError })
      })

      expect(onError).toHaveBeenCalledWith(error)
    })

    it('should handle invalid entry (no folder path or handle)', async () => {
      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(result.current.error).toContain('Invalid study entry')
    })

    it('should clear error', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockRejectedValue(
        new Error('Test error')
      )

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      // Trigger an error first
      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(result.current.error).toBeTruthy()

      // Then clear it
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('loading state', () => {
    it('should transition from false to true to false during load', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      // Initially not loading
      expect(result.current.isLoading).toBe(false)

      // After load completes, should be back to false
      await act(async () => {
        await result.current.loadStudy(entry)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('should call onSuccess callback', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockResolvedValue(mockStudies)

      const { result } = renderHook(() => useLoadStudy())
      const onSuccess = vi.fn()
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: mockStudies[0].studyInstanceUID,
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry, { onSuccess })
      })

      expect(onSuccess).toHaveBeenCalledWith(mockStudies, mockStudies[0])
    })

    it('should not call onSuccess on failure', async () => {
      const { dicomStudyService } = await import('@/lib/dicom/DicomStudyService')
      vi.mocked(dicomStudyService.loadStudiesFromDirectory).mockRejectedValue(
        new Error('Failed')
      )

      const { result } = renderHook(() => useLoadStudy())
      const onSuccess = vi.fn()
      const entry: RecentStudyEntry = {
        id: 'entry1',
        studyInstanceUID: 'study-uid',
        patientName: 'Test Patient',
        studyDate: '20240101',
        folderPath: '/path/to/dicom',
        patientID: '12345',
        studyDescription: 'Test Study',
        seriesCount: 1,
        imageCount: 3,
        loadedAt: Date.now(),
      }

      await act(async () => {
        await result.current.loadStudy(entry, { onSuccess })
      })

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
