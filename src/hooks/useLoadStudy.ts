import { useState, useCallback } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { RecentStudyEntry } from '../stores/recentStudiesStore'
import { dicomStudyService } from '../lib/dicom/DicomStudyService'
import { getDirectoryHandle } from '../lib/storage/directoryHandleStorage'
import { DicomStudy } from '../types'

interface LoadStudyOptions {
  /** Target study UID to select after loading */
  targetStudyUID?: string
  /** Whether to request permission if needed (web mode only) */
  requestPermission?: boolean
  /** Callback for successful load */
  onSuccess?: (studies: DicomStudy[], selectedStudy: DicomStudy) => void
  /** Callback for errors */
  onError?: (error: Error) => void
}

interface UseLoadStudyReturn {
  /** Load a study from a recent entry */
  loadStudy: (entry: RecentStudyEntry, options?: LoadStudyOptions) => Promise<DicomStudy[] | null>
  /** Whether a study is currently loading */
  isLoading: boolean
  /** Current error message, if any */
  error: string | null
  /** Clear the current error */
  clearError: () => void
}

/**
 * Hook for loading DICOM studies from recent entries.
 * Handles both desktop (folder path) and web (directory handle) modes.
 * Automatically manages cache, permissions, and study selection.
 *
 * @example
 * ```tsx
 * const { loadStudy, isLoading, error } = useLoadStudy()
 *
 * const handleClick = async (entry: RecentStudyEntry) => {
 *   const studies = await loadStudy(entry, {
 *     targetStudyUID: entry.studyInstanceUID,
 *     requestPermission: true,
 *     onSuccess: () => console.log('Loaded!'),
 *     onError: (err) => alert(err.message)
 *   })
 * }
 * ```
 */
export function useLoadStudy(): UseLoadStudyReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setStudies = useStudyStore((s) => s.setStudies)
  const setCurrentStudy = useStudyStore((s) => s.setCurrentStudy)

  const loadStudy = useCallback(
    async (
      entry: RecentStudyEntry,
      options: LoadStudyOptions = {}
    ): Promise<DicomStudy[] | null> => {
      const { targetStudyUID, requestPermission = false, onSuccess, onError } = options

      setIsLoading(true)
      setError(null)

      try {
        let studies: DicomStudy[]

        // Load from appropriate source
        if (entry.folderPath) {
          // Check if this is a webkitdirectory path (Safari/Firefox fallback)
          if (entry.folderPath.startsWith('webkit:')) {
            // For webkitdirectory, we can only load from cache since we don't have persistent folder access
            const { getCachedStudies } = await import('../lib/storage/studyCache')
            const cached = getCachedStudies(entry.folderPath)

            if (!cached || cached.length === 0) {
              throw new Error(
                'This study was loaded using Safari/Firefox folder selection and is no longer available in cache. Please reselect the folder to reload it.'
              )
            }

            studies = cached
          } else {
            // Desktop mode (Tauri) - load from folder path with caching
            studies = await dicomStudyService.loadStudiesFromDirectory(entry.folderPath, {
              useCache: true,
            })
          }
        } else if (entry.directoryHandleId) {
          // Web mode - load from directory handle
          const dirHandle = await getDirectoryHandle(entry.directoryHandleId)

          if (!dirHandle) {
            throw new Error(
              'Directory handle not found. The folder may have been moved or deleted.'
            )
          }

          studies = await dicomStudyService.loadStudiesFromHandle(dirHandle, {
            useCache: true,
            cacheKey: entry.directoryHandleId,
            requestPermission,
          })
        } else {
          throw new Error('Invalid study entry: no folder path or directory handle')
        }

        if (!studies || studies.length === 0) {
          throw new Error('No valid DICOM studies found')
        }

        // Set loaded studies in store
        setStudies(studies)

        // Select the target study or first one
        const targetStudy =
          targetStudyUID || entry.studyInstanceUID
            ? studies.find(
                (s) => s.studyInstanceUID === (targetStudyUID || entry.studyInstanceUID)
              )
            : studies[0]

        const selectedStudy = targetStudy || studies[0]
        setCurrentStudy(selectedStudy.studyInstanceUID)

        // Call success callback
        if (onSuccess) {
          onSuccess(studies, selectedStudy)
        }

        return studies
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading study'
        setError(errorMessage)
        console.error('[useLoadStudy]', err)

        // Call error callback
        if (onError && err instanceof Error) {
          onError(err)
        }

        return null
      } finally {
        setIsLoading(false)
      }
    },
    [setStudies, setCurrentStudy]
  )

  const clearError = useCallback(() => setError(null), [])

  return { loadStudy, isLoading, error, clearError }
}
