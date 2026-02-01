import { create } from 'zustand'
import { DicomStudy, DicomSeries, DicomInstance } from '@/types'

/**
 * Study store state interface.
 *
 * Manages the complete DICOM study hierarchy:
 * - Studies (patient exams)
 * - Series (imaging sequences within a study)
 * - Instances (individual images/slices within a series)
 */
interface StudyState {
  // Data
  /** All loaded DICOM studies */
  studies: DicomStudy[]
  /** Currently selected study for viewing */
  currentStudy: DicomStudy | null
  /** Currently selected series within the current study */
  currentSeries: DicomSeries | null
  /** Currently selected instance (image) within the current series */
  currentInstance: DicomInstance | null
  /** Index of the current instance in the series (0-based) */
  currentInstanceIndex: number

  // Loading state
  /** Whether studies are currently being loaded */
  isLoading: boolean
  /** Error message if loading failed, null otherwise */
  error: string | null

  // Actions
  /** Set all studies and auto-select the first one */
  setStudies: (studies: DicomStudy[]) => void
  /** Add a single study to the collection */
  addStudy: (study: DicomStudy) => void
  /** Set current study by UID and auto-select first series */
  setCurrentStudy: (studyUID: string) => void
  /** Set current series by UID and auto-select first instance */
  setCurrentSeries: (seriesUID: string) => void
  /** Set current instance by index in the series */
  setCurrentInstance: (instanceIndex: number) => void
  /** Navigate to the next instance in the series */
  nextInstance: () => void
  /** Navigate to the previous instance in the series */
  previousInstance: () => void
  /** Set loading state */
  setLoading: (loading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Reset store to initial state */
  reset: () => void
}

const initialState = {
  studies: [],
  currentStudy: null,
  currentSeries: null,
  currentInstance: null,
  currentInstanceIndex: 0,
  isLoading: false,
  error: null,
}

/**
 * Zustand store for managing DICOM study hierarchy and navigation.
 *
 * This store manages the three-level hierarchy of DICOM data:
 * 1. Study (patient exam) - identified by studyInstanceUID
 * 2. Series (imaging sequence) - identified by seriesInstanceUID
 * 3. Instance (individual image/slice) - identified by sopInstanceUID
 *
 * When selecting a study, the first series and first instance are auto-selected.
 * When selecting a series, the first instance is auto-selected.
 *
 * @example
 * ```tsx
 * // Select state
 * const studies = useStudyStore((state) => state.studies)
 * const currentInstance = useStudyStore((state) => state.currentInstance)
 *
 * // Call actions
 * const { setStudies, nextInstance } = useStudyStore()
 * setStudies(parsedStudies)
 * nextInstance()
 * ```
 *
 * @example
 * ```tsx
 * // Navigation workflow
 * const { setCurrentStudy, setCurrentSeries, nextInstance } = useStudyStore()
 *
 * // Select a study (auto-selects first series and instance)
 * setCurrentStudy('1.2.840.113619...')
 *
 * // Select a specific series (auto-selects first instance)
 * setCurrentSeries('1.2.840.113619...')
 *
 * // Navigate through instances
 * nextInstance() // Move forward
 * previousInstance() // Move backward
 * ```
 */
export const useStudyStore = create<StudyState>((set, get) => ({
  ...initialState,

  /**
   * Set all studies and auto-select the first one.
   * Clears any previously loaded studies.
   *
   * @param studies - Array of parsed DICOM studies to load
   *
   * @example
   * ```ts
   * const studies = await dicomStudyService.loadStudiesFromFiles(files)
   * useStudyStore.getState().setStudies(studies)
   * ```
   */
  setStudies: (studies) => {
    set({ studies })
    if (studies.length > 0) {
      get().setCurrentStudy(studies[0].studyInstanceUID)
    }
  },

  /**
   * Add a single study to the collection without changing current selection.
   *
   * @param study - The DICOM study to add
   */
  addStudy: (study) => {
    set((state) => ({
      studies: [...state.studies, study],
    }))
  },

  /**
   * Set the current study by UID and auto-select its first series and instance.
   *
   * This triggers a cascade:
   * 1. Sets currentStudy
   * 2. Calls setCurrentSeries with first series
   * 3. setCurrentSeries sets first instance
   *
   * @param studyUID - The studyInstanceUID to select
   *
   * @example
   * ```ts
   * // Select first study from loaded studies
   * const studies = useStudyStore.getState().studies
   * if (studies.length > 0) {
   *   useStudyStore.getState().setCurrentStudy(studies[0].studyInstanceUID)
   * }
   * ```
   */
  setCurrentStudy: (studyUID) => {
    const study = get().studies.find((s) => s.studyInstanceUID === studyUID)
    if (study) {
      set({ currentStudy: study })
      if (study.series.length > 0) {
        get().setCurrentSeries(study.series[0].seriesInstanceUID)
      }
    }
  },

  /**
   * Set the current series by UID and auto-select its first instance.
   *
   * This function searches all studies to find the series, then:
   * 1. Sets currentStudy (if series is in a different study)
   * 2. Sets currentSeries
   * 3. Sets currentInstance to first instance (index 0)
   *
   * @param seriesUID - The seriesInstanceUID to select
   *
   * @example
   * ```ts
   * // Select a specific series (e.g., from thumbnail click)
   * useStudyStore.getState().setCurrentSeries('1.2.840.113619...')
   * ```
   */
  setCurrentSeries: (seriesUID) => {
    const { studies } = get()

    // Find which study contains this series
    let foundStudy: DicomStudy | null = null
    let foundSeries: DicomSeries | null = null

    for (const study of studies) {
      const series = study.series.find(
        (s) => s.seriesInstanceUID === seriesUID
      )
      if (series) {
        foundStudy = study
        foundSeries = series
        break
      }
    }

    if (foundStudy && foundSeries) {
      set({
        currentStudy: foundStudy,
        currentSeries: foundSeries,
        currentInstanceIndex: 0,
        currentInstance: foundSeries.instances[0] || null,
      })
    }
  },

  /**
   * Set the current instance by index within the current series.
   *
   * The index is automatically clamped to valid range [0, instances.length - 1].
   * Does nothing if no series is currently selected.
   *
   * @param instanceIndex - Zero-based index of the instance in the current series
   *
   * @example
   * ```ts
   * // Jump to specific instance (e.g., from slider)
   * useStudyStore.getState().setCurrentInstance(10)
   *
   * // Jump to first instance
   * useStudyStore.getState().setCurrentInstance(0)
   * ```
   */
  setCurrentInstance: (instanceIndex) => {
    const { currentSeries } = get()
    if (!currentSeries) return

    const clampedIndex = Math.max(
      0,
      Math.min(instanceIndex, currentSeries.instances.length - 1)
    )
    set({
      currentInstanceIndex: clampedIndex,
      currentInstance: currentSeries.instances[clampedIndex] || null,
    })
  },

  /**
   * Navigate to the next instance in the current series.
   *
   * Stops at the last instance (does not wrap around).
   * Does nothing if no series is selected.
   *
   * @example
   * ```ts
   * // Navigate forward (e.g., arrow key, mouse wheel)
   * useStudyStore.getState().nextInstance()
   * ```
   */
  nextInstance: () => {
    const { currentInstanceIndex, currentSeries } = get()
    if (!currentSeries) return

    const nextIndex = Math.min(
      currentInstanceIndex + 1,
      currentSeries.instances.length - 1
    )
    get().setCurrentInstance(nextIndex)
  },

  /**
   * Navigate to the previous instance in the current series.
   *
   * Stops at the first instance (does not wrap around).
   * Does nothing if no series is selected.
   *
   * @example
   * ```ts
   * // Navigate backward (e.g., arrow key, mouse wheel)
   * useStudyStore.getState().previousInstance()
   * ```
   */
  previousInstance: () => {
    const { currentInstanceIndex } = get()
    const prevIndex = Math.max(currentInstanceIndex - 1, 0)
    get().setCurrentInstance(prevIndex)
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
