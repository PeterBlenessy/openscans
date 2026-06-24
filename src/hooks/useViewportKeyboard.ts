import { useEffect, useState } from 'react'
import { DicomInstance, DicomStudy } from '../types'
import { Annotation } from '../types/annotation'
import { AiAnalysis } from '../stores/aiAnalysisStore'
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
  addAnalysis: (analysis: AiAnalysis) => void
  handleError: (error: Error | string, context: string, severity?: 'error' | 'warning' | 'info' | 'success') => void
  /** Toggle full-screen mode (Shift+F) */
  onToggleFullscreen?: () => void
  /** Toggle cine play/pause (Space) */
  onToggleCine?: () => void
  /** Increase cine frame rate (+/=) */
  onCineFrameRateUp?: () => void
  /** Decrease cine frame rate (-) */
  onCineFrameRateDown?: () => void
  /** Activate the distance/ruler tool (L) */
  onActivateLength?: () => void
  /** Activate the angle tool (Shift+A) */
  onActivateAngle?: () => void
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
    handleError,
    onToggleFullscreen,
    onToggleCine,
    onCineFrameRateUp,
    onCineFrameRateDown,
    onActivateLength,
    onActivateAngle
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

      // Don't handle shortcuts if user is typing in an input field
      // (mirrors the guard in useKeyboardShortcuts.ts). Without this, the M/N
      // AI shortcuts fire while typing an API key, language, etc.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Full-screen toggle (Shift+F). Plain F is "toggle favorite" elsewhere.
      if ((e.key === 'f' || e.key === 'F') && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onToggleFullscreen) {
          e.preventDefault()
          onToggleFullscreen()
        }
      }

      // Cine play/pause (Space)
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (onToggleCine) {
          e.preventDefault()
          onToggleCine()
        }
      }

      // Cine frame rate up (+ / =)
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onCineFrameRateUp) {
          e.preventDefault()
          onCineFrameRateUp()
        }
      }

      // Cine frame rate down (-)
      if (e.key === '-' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onCineFrameRateDown) {
          e.preventDefault()
          onCineFrameRateDown()
        }
      }

      // Distance / ruler tool (L)
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (onActivateLength) {
          e.preventDefault()
          onActivateLength()
        }
      }

      // Angle tool (Shift+A) — plain A toggles annotation visibility elsewhere.
      if ((e.key === 'a' || e.key === 'A') && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onActivateAngle) {
          e.preventDefault()
          onActivateAngle()
        }
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
  }, [
    currentInstance,
    isDetecting,
    isAnalyzing,
    handleAiDetection,
    handleAiAnalysis,
    onToggleFullscreen,
    onToggleCine,
    onCineFrameRateUp,
    onCineFrameRateDown,
    onActivateLength,
    onActivateAngle
  ])

  return { isModifierKeyPressed }
}
