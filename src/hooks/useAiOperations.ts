import { useCallback } from 'react'
import { DicomInstance, DicomStudy } from '../types'
import { Annotation } from '../types/annotation'
import { AiAnalysis } from '../stores/aiAnalysisStore'
import { useSettingsStore } from '../stores/settingsStore'
import { mockDetector } from '../lib/ai/mockVertebralDetector'
import { initDetector, getApiKeyForProvider } from '../lib/ai/aiDetectorManager'
import { isTauri } from '../lib/utils/platform'
import { confirmAiSend } from '../lib/ai/ai-send-confirm'

/** Human-readable provider names for confirmation copy. */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  openai: 'OpenAI',
}

function providerDisplayName(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider] || provider
}

interface UseAiOperationsOptions {
  currentInstance: DicomInstance | null
  currentStudy: DicomStudy | null
  isDetecting: boolean
  isAnalyzing: boolean
  setDetecting: (isDetecting: boolean, error?: string | null) => void
  setAnalyzing: (isAnalyzing: boolean, error?: string | null) => void
  addAnnotations: (annotations: Annotation[]) => void
  deleteAnnotationsForInstance: (instanceUID: string, isAiGenerated: boolean) => void
  addAnalysis: (analysis: AiAnalysis) => void
  handleError: (error: Error | string, context: string, severity?: 'error' | 'warning' | 'info') => void
}

interface UseAiOperationsReturn {
  handleAiDetection: () => Promise<void>
  handleAiAnalysis: () => Promise<void>
}

/**
 * Hook for managing AI operations (vertebra detection and radiology analysis).
 * Provides reusable functions for triggering AI operations from keyboard shortcuts,
 * toolbar buttons, or other UI elements.
 *
 * @param options - Configuration including current instance/study, AI state, and callbacks
 * @returns Object with handleAiDetection and handleAiAnalysis functions
 *
 * @example
 * ```tsx
 * const { handleAiDetection, handleAiAnalysis } = useAiOperations({
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
 *
 * // Call from keyboard shortcut
 * if (e.key === 'm') {
 *   await handleAiDetection()
 * }
 *
 * // Call from toolbar button
 * <button onClick={handleAiDetection}>Detect Vertebrae</button>
 * ```
 */
export function useAiOperations(options: UseAiOperationsOptions): UseAiOperationsReturn {
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

  /**
   * Triggers AI vertebra detection on the current instance.
   * Deletes existing AI-generated annotations before running detection.
   * Uses the configured AI provider or falls back to mock detector.
   */
  const handleAiDetection = useCallback(async () => {
    if (!currentInstance || isDetecting) return

    // Cloud AI is desktop-only. On web, the only available detector is the
    // local mock; never attempt a cloud call.
    if (!isTauri()) {
      handleError(
        'AI detection requires the OpenScans desktop app.',
        'AI Detection',
        'info'
      )
      return
    }

    try {
      // Get AI settings
      const aiSettings = useSettingsStore.getState()
      let detector = mockDetector

      // Try to use configured AI provider
      if (aiSettings.aiEnabled && aiSettings.aiProvider !== 'none') {
        const apiKey = getApiKeyForProvider(aiSettings.aiProvider, {
          aiApiKey: aiSettings.aiApiKey,
          geminiApiKey: aiSettings.geminiApiKey,
          openaiApiKey: aiSettings.openaiApiKey,
        })
        const aiDetector = await initDetector(aiSettings.aiProvider, apiKey)
        if (aiDetector && aiDetector.isConfigured()) {
          detector = aiDetector
        }
      }

      // A cloud provider will run only when we resolved a real (configured)
      // detector that actually sends data off-device. The mock detector and the
      // bundled local LLM ('local') both run with zero egress, so neither must
      // trigger the confirmation/consent gate.
      const willEgress = detector !== mockDetector && aiSettings.aiProvider !== 'local'
      if (willEgress) {
        const confirmed = await confirmAiSend(providerDisplayName(aiSettings.aiProvider))
        if (!confirmed) {
          // User aborted the send before any image left the device.
          return
        }
      }

      setDetecting(true)
      deleteAnnotationsForInstance(currentInstance.sopInstanceUID, true)

      const result = await detector.detectVertebrae(currentInstance)
      addAnnotations(result.annotations)
      console.log(`AI detection completed in ${result.processingTimeMs.toFixed(0)}ms with ${result.confidence.toFixed(2)} confidence`)
      setDetecting(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('AI detection failed:', error)
      setDetecting(false, errorMessage)
    }
  }, [currentInstance, isDetecting, setDetecting, deleteAnnotationsForInstance, addAnnotations, handleError])

  /**
   * Triggers AI radiology analysis on the current instance.
   * Requires an AI provider to be configured in settings.
   * Supports Claude, Gemini, and OpenAI.
   */
  const handleAiAnalysis = useCallback(async () => {
    if (!currentInstance || isAnalyzing) return

    // Cloud AI is desktop-only. Radiology analysis always requires a cloud
    // provider, so it is unavailable on web.
    if (!isTauri()) {
      handleError(
        'AI radiology analysis requires the OpenScans desktop app.',
        'AI Analysis',
        'info'
      )
      return
    }

    const studyUID = currentStudy?.studyInstanceUID
    if (!studyUID) {
      console.error('No study loaded')
      return
    }

    // Require AI provider configuration for analysis
    const aiSettings = useSettingsStore.getState()
    if (!aiSettings.aiEnabled || aiSettings.aiProvider === 'none') {
      handleError(
        'Please enable and configure an AI provider in settings to use radiology analysis.',
        'AI Analysis',
        'warning'
      )
      return
    }

    // Cloud analysis sends the image off-device — confirm the egress (and,
    // implicitly, consent) before anything leaves. The bundled local LLM
    // ('local') runs on loopback with zero egress, so it skips the gate.
    if (aiSettings.aiProvider !== 'local') {
      const confirmed = await confirmAiSend(providerDisplayName(aiSettings.aiProvider))
      if (!confirmed) {
        return
      }
    }

    try {
      setAnalyzing(true)

      // Dynamically load and initialize the AI detector
      const apiKey = getApiKeyForProvider(aiSettings.aiProvider, {
        aiApiKey: aiSettings.aiApiKey,
        geminiApiKey: aiSettings.geminiApiKey,
        openaiApiKey: aiSettings.openaiApiKey,
      })
      const analyzer = await initDetector(aiSettings.aiProvider, apiKey)

      if (!analyzer || !analyzer.isConfigured()) {
        const providerNames: Record<string, string> = {
          claude: 'Anthropic',
          gemini: 'Google AI',
          openai: 'OpenAI',
        }
        handleError(
          `Please configure your ${providerNames[aiSettings.aiProvider] || aiSettings.aiProvider} API key in settings.`,
          'AI Analysis',
          'warning'
        )
        setAnalyzing(false)
        return
      }

      const result = await analyzer.analyzeImage(currentInstance)
      addAnalysis({ ...result.analysis, studyInstanceUID: studyUID })
      console.log(`AI analysis completed in ${result.processingTimeMs.toFixed(0)}ms`)
      setAnalyzing(false)
    } catch (error) {
      handleError(error as Error, 'AI Analysis', 'error')
      setAnalyzing(false)
    }
  }, [currentInstance, currentStudy, isAnalyzing, setAnalyzing, addAnalysis, handleError])

  return {
    handleAiDetection,
    handleAiAnalysis
  }
}
