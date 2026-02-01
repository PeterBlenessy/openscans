import { useState, useCallback } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { RecentStudyEntry } from '../stores/recentStudiesStore'
import { getCachedStudies, cacheStudies } from '../lib/storage/studyCache'
import {
  getDirectoryHandle,
  checkDirectoryPermission,
  requestDirectoryPermission,
  readDicomFilesWithDirectories,
} from '../lib/storage/directoryHandleStorage'
import { readFilesFromDirectory } from '../lib/utils/filePicker'
import { parseDicomFiles, parseDicomFilesWithDirectories } from '../lib/dicom/parser'
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
        const cacheKey = entry.folderPath || entry.directoryHandleId
        let studies: DicomStudy[] | null = null

        // Try cache first
        if (cacheKey) {
          studies = getCachedStudies(cacheKey) || null
        }

        // Load from source if not cached
        if (!studies) {
          if (entry.folderPath) {
            // Desktop mode - load from folder path
            const allFiles = await readFilesFromDirectory(entry.folderPath)

            if (allFiles.length === 0) {
              throw new Error('No DICOM files found in the folder')
            }

            studies = await parseDicomFiles(allFiles, entry.folderPath)

            if (studies.length === 0) {
              throw new Error('No valid DICOM studies found in the folder')
            }

            // Cache the loaded studies
            cacheStudies(entry.folderPath, studies)
          } else if (entry.directoryHandleId) {
            // Web mode - load from directory handle
            const dirHandle = await getDirectoryHandle(entry.directoryHandleId)

            if (!dirHandle) {
              throw new Error(
                'Directory handle not found. The folder may have been moved or deleted.'
              )
            }

            // Check permission
            let hasPermission = await checkDirectoryPermission(dirHandle)

            // Request permission if needed and allowed
            if (!hasPermission && requestPermission) {
              hasPermission = await requestDirectoryPermission(dirHandle)
            }

            if (!hasPermission) {
              throw new Error('Permission denied to access the folder')
            }

            // Read and parse DICOM files
            const filesWithDirs = await readDicomFilesWithDirectories(dirHandle)

            if (filesWithDirs.length === 0) {
              throw new Error('No DICOM files found in the folder')
            }

            studies = await parseDicomFilesWithDirectories(filesWithDirs, dirHandle)

            if (studies.length === 0) {
              throw new Error('No valid DICOM studies found in the folder')
            }

            // Cache the loaded studies
            cacheStudies(entry.directoryHandleId, studies)
          } else {
            throw new Error('Invalid study entry: no folder path or directory handle')
          }
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
