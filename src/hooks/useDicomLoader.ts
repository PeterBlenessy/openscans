import { useState } from 'react'
import { dicomStudyService } from '@/lib/dicom/DicomStudyService'
import { useStudyStore } from '@/stores/studyStore'
import { cacheStudies } from '@/lib/storage/studyCache'

/**
 * Hook for loading and parsing DICOM files into organized studies.
 * Manages loading state, error handling, and integration with the study store.
 *
 * This hook is the primary entry point for loading DICOM files from user input
 * (file picker, drag & drop, etc.) and converting them into viewable studies.
 *
 * @returns Object with loadFiles function, loading state, and error state
 *
 * @example
 * ```tsx
 * function FileLoader() {
 *   const { loadFiles, isLoading, error } = useDicomLoader()
 *
 *   const handleFiles = async (files: File[]) => {
 *     try {
 *       await loadFiles(files)
 *       console.log('Studies loaded successfully')
 *     } catch (err) {
 *       console.error('Failed to load:', err)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => handleFiles(Array.from(e.target.files))} />
 *       {isLoading && <Spinner />}
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDicomLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setStudies, setLoading: setStoreLoading, setError: setStoreError } = useStudyStore()

  /**
   * Load DICOM files and organize them into studies.
   * Updates both local state and the global study store.
   *
   * @param files - Array of DICOM files to parse
   * @param folderPath - Optional folder path for caching in desktop mode
   * @throws {Error} If no valid DICOM files are found or parsing fails
   *
   * @example
   * ```ts
   * // Web mode (from file picker)
   * await loadFiles(files)
   *
   * // Desktop mode (with folder path for caching)
   * await loadFiles(files, '/path/to/dicom/folder')
   * ```
   */
  const loadFiles = async (files: File[], folderPath?: string) => {
    setIsLoading(true)
    setStoreLoading(true)
    setError(null)
    setStoreError(null)

    try {
      // Use DicomStudyService to load and parse files
      const studies = await dicomStudyService.loadStudiesFromFiles(files, folderPath)

      if (studies.length === 0) {
        throw new Error('No valid DICOM files found in the selected files/folder')
      }

      setStudies(studies)

      // Cache the parsed studies if we have a folderPath (desktop mode)
      if (folderPath) {
        cacheStudies(folderPath, studies)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load DICOM files'
      console.error('Error loading DICOM files:', err)
      setError(errorMessage)
      setStoreError(errorMessage)
      throw err // Re-throw so the caller knows loading failed
    } finally {
      setIsLoading(false)
      setStoreLoading(false)
    }
  }

  return {
    loadFiles,
    isLoading,
    error,
  }
}
