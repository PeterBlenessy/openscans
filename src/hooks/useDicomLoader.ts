import { useState } from 'react'
import { parseDicomFiles } from '@/lib/dicom/parser'
import { useStudyStore } from '@/stores/studyStore'

export function useDicomLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setStudies, setLoading: setStoreLoading, setError: setStoreError } = useStudyStore()

  const loadFiles = async (files: File[], folderPath?: string) => {
    setIsLoading(true)
    setStoreLoading(true)
    setError(null)
    setStoreError(null)

    try {
      const studies = await parseDicomFiles(files, folderPath)

      if (studies.length === 0) {
        throw new Error('No valid DICOM files found in the selected files/folder')
      }

      setStudies(studies)
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
