import { useEffect, useState } from 'react'
import { DicomInstance, DicomStudy } from '../types'
import { Annotation } from '../types/annotation'
import { useAiOperations } from './useAiOperations'

interface UseViewportKeyboardOptions {
  currentInstance: DicomInstance | null
  currentStudy: DicomStudy | null
  isDetecting: boolean
  isAnalyzing: boolean
  setDetecting: (isDetecting: boolean, error?: string | null) => void
  setAnalyzing: (isAnalyzing: boolean, error?: string | null) => void
  addAnnotations: (annotations: Annotation[]) => void
  deleteAnnotationsForInstance: (instanceUID: string, isAiGenerated: boolean) => void
  addAnalysis: (analysis: any) => void
  handleError: (error: Error | string, context: string, severity?: 'error' | 'warning' | 'info') => void
}

/**
 * Hook for handling keyboard shortcuts in the DICOM viewport.
 * Tracks modifier key state for cursor indication and handles AI shortcuts.
 *
 * @param options - Configuration including current instance, AI state, and callbacks
 * @returns Object with isModifierKeyPressed state
 *
 * @example
 * ```tsx
 * const { isModifierKeyPressed } = useViewportKeyboard({
 *   currentInstance,
 *   currentStudy,
 *   isDetecting,
 *   isAnalyzing,
 *   setDetecting,
 *   setAnalyzing,
 *   addAnnotations,
 *   deleteAnnotationsForInstance,
 *   addAnalysis,
 *   handleError
 * })
 * ```
 */
export function useViewportKeyboard(options: UseViewportKeyboardOptions) {
  const {
    currentInstance,
    currentStudy,
    isDetecting,
    isAnalyzing,
    setDetecting,
    setAnalyzing,
    addAnnotations,
    deleteAnnotationsForInstance,
    addAnalysis,
    handleError
  } = options

  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false)

  // Get AI operation handlers
  const { handleAiDetection, handleAiAnalysis } = useAiOperations({
    currentInstance,
    currentStudy,
    isDetecting,
    isAnalyzing,
    setDetecting,
    setAnalyzing,
    addAnnotations,
    deleteAnnotationsForInstance,
    addAnalysis,
    handleError
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsModifierKeyPressed(true)
      }

      // AI detection keyboard shortcut (M)
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (currentInstance && !isDetecting && !isAnalyzing) {
          e.preventDefault()
          // Trigger AI detection
          handleAiDetection()
        }
      }

      // AI analysis keyboard shortcut (N)
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (currentInstance && !isDetecting && !isAnalyzing) {
          e.preventDefault()
          // Trigger AI analysis
          handleAiAnalysis()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsModifierKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [currentInstance, isDetecting, isAnalyzing, handleAiDetection, handleAiAnalysis])

  return { isModifierKeyPressed }
}
