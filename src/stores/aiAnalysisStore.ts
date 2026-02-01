import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * AI radiology analysis result.
 *
 * Contains structured findings from Claude, Gemini, or OpenAI vision models
 * analyzing DICOM images for clinical findings.
 */
export interface AiAnalysis {
  /** Unique identifier for this analysis */
  id: string
  /** DICOM SOP Instance UID of the analyzed image */
  sopInstanceUID: string
  /** DICOM Study Instance UID (optional, added by caller like favorites pattern) */
  studyInstanceUID?: string
  /** Instance number in the series */
  instanceNumber: number
  /** AI-generated clinical findings text */
  findings: string
  /** ISO timestamp when analysis was created */
  createdAt: string
  /** Model identifier (e.g., 'claude-3-opus', 'gemini-pro-vision') */
  createdBy: string
  /** Model version string */
  modelVersion: string
}

/**
 * AI analysis store state interface.
 *
 * Manages AI-generated radiology analyses with persistence and modal display.
 * Only one analysis is stored per instance (newer analysis replaces older one).
 *
 * Analyses are persisted to localStorage and survive page refreshes.
 */
interface AiAnalysisState {
  /** All AI analyses (flat array, one per instance) */
  analyses: AiAnalysis[]
  /** ID of currently selected analysis (for modal display) */
  selectedAnalysisId: string | null
  /** Whether analysis is in progress */
  isAnalyzing: boolean
  /** Error message from analysis, null if no error */
  analysisError: string | null
  /** Whether the analysis modal is visible */
  isModalVisible: boolean

  // Actions
  /** Add or replace analysis for an instance and show modal */
  addAnalysis: (analysis: AiAnalysis) => void
  /** Delete a specific analysis by ID */
  deleteAnalysis: (id: string) => void
  /** Delete analysis for a specific instance */
  deleteAnalysisForInstance: (sopInstanceUID: string) => void
  /** Get analysis for a specific instance (or undefined if none) */
  getAnalysisForInstance: (sopInstanceUID: string) => AiAnalysis | undefined
  /** Set analyzing state */
  setAnalyzing: (analyzing: boolean, error?: string | null) => void
  /** Show modal for a specific analysis */
  showModal: (analysisId: string) => void
  /** Hide the analysis modal */
  hideModal: () => void
  /** Reset store to initial state (clears all analyses) */
  reset: () => void
}

const initialState = {
  analyses: [],
  selectedAnalysisId: null,
  isAnalyzing: false,
  analysisError: null,
  isModalVisible: false,
}

/**
 * Zustand store for managing AI radiology analyses.
 *
 * Analyses are persisted to localStorage under 'openscans-ai-analyses'.
 * Only the analyses array is persisted; UI state (selection, loading, modal visibility) is reset on reload.
 *
 * Key behavior:
 * - Only one analysis per instance (newer replaces older)
 * - Adding an analysis automatically selects it and shows the modal
 * - Analyses survive page refreshes via localStorage persistence
 *
 * @example
 * ```tsx
 * // Select state
 * const analyses = useAiAnalysisStore((state) => state.analyses)
 * const isAnalyzing = useAiAnalysisStore((state) => state.isAnalyzing)
 * const analysis = useAiAnalysisStore((state) =>
 *   state.getAnalysisForInstance(instanceUID)
 * )
 *
 * // Call actions
 * const { addAnalysis, showModal } = useAiAnalysisStore()
 * addAnalysis(aiResult) // Automatically shows modal
 * showModal(analysisId)  // Show existing analysis
 * ```
 *
 * @example
 * ```tsx
 * // Run AI analysis workflow
 * const { setAnalyzing, addAnalysis } = useAiAnalysisStore()
 *
 * setAnalyzing(true)
 * try {
 *   const result = await claudeDetector.analyzeImage(instance)
 *   addAnalysis({
 *     id: nanoid(),
 *     sopInstanceUID: instance.sopInstanceUID,
 *     studyInstanceUID: study.studyInstanceUID,
 *     findings: result.analysis.findings,
 *     // ... other fields
 *   })
 * } catch (error) {
 *   setAnalyzing(false, error.message)
 * }
 * ```
 */
export const useAiAnalysisStore = create<AiAnalysisState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Add or replace an AI analysis for an instance.
       *
       * If an analysis already exists for this sopInstanceUID, it will be replaced.
       * The new analysis is automatically selected and the modal is shown.
       *
       * @param analysis - The AI analysis to add
       *
       * @example
       * ```ts
       * const analysis: AiAnalysis = {
       *   id: nanoid(),
       *   sopInstanceUID: instance.sopInstanceUID,
       *   studyInstanceUID: study.studyInstanceUID,
       *   instanceNumber: instance.instanceNumber,
       *   findings: 'Normal brain MRI...',
       *   createdAt: new Date().toISOString(),
       *   createdBy: 'claude-3-opus',
       *   modelVersion: '20240229',
       * }
       * addAnalysis(analysis) // Replaces old analysis, shows modal
       * ```
       */
      addAnalysis: (analysis) => {
        const { analyses } = get()
        // Replace any existing analysis for this instance (like favorites avoids duplicates)
        set({
          analyses: [...analyses.filter(a => a.sopInstanceUID !== analysis.sopInstanceUID), analysis],
          selectedAnalysisId: analysis.id,
          isModalVisible: true,
        })
      },

      deleteAnalysis: (id) =>
        set((state) => ({
          analyses: state.analyses.filter((a) => a.id !== id),
          selectedAnalysisId: state.selectedAnalysisId === id ? null : state.selectedAnalysisId,
          isModalVisible: state.selectedAnalysisId === id ? false : state.isModalVisible,
        })),

      deleteAnalysisForInstance: (sopInstanceUID) =>
        set((state) => ({
          analyses: state.analyses.filter((a) => a.sopInstanceUID !== sopInstanceUID),
        })),

      getAnalysisForInstance: (sopInstanceUID) => {
        return get().analyses.find((a) => a.sopInstanceUID === sopInstanceUID)
      },

      setAnalyzing: (analyzing, error = null) => set({ isAnalyzing: analyzing, analysisError: error }),

      showModal: (analysisId) => set({ selectedAnalysisId: analysisId, isModalVisible: true }),

      hideModal: () => set({ isModalVisible: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'openscans-ai-analyses',
      version: 1,
      partialize: (state) => ({
        analyses: state.analyses, // Only persist the analyses array, not UI state
      }),
    }
  )
)
