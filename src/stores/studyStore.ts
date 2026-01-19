import { create } from 'zustand'
import { DicomStudy, DicomSeries, DicomInstance } from '@/types'

interface StudyState {
  // Data
  studies: DicomStudy[]
  currentStudy: DicomStudy | null
  currentSeries: DicomSeries | null
  currentInstance: DicomInstance | null
  currentInstanceIndex: number

  // Loading state
  isLoading: boolean
  error: string | null

  // Actions
  setStudies: (studies: DicomStudy[]) => void
  addStudy: (study: DicomStudy) => void
  setCurrentStudy: (studyUID: string) => void
  setCurrentSeries: (seriesUID: string) => void
  setCurrentInstance: (instanceIndex: number) => void
  nextInstance: () => void
  previousInstance: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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

export const useStudyStore = create<StudyState>((set, get) => ({
  ...initialState,

  setStudies: (studies) => {
    set({ studies })
    if (studies.length > 0) {
      get().setCurrentStudy(studies[0].studyInstanceUID)
    }
  },

  addStudy: (study) => {
    set((state) => ({
      studies: [...state.studies, study],
    }))
  },

  setCurrentStudy: (studyUID) => {
    const study = get().studies.find((s) => s.studyInstanceUID === studyUID)
    if (study) {
      set({ currentStudy: study })
      if (study.series.length > 0) {
        get().setCurrentSeries(study.series[0].seriesInstanceUID)
      }
    }
  },

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

  nextInstance: () => {
    const { currentInstanceIndex, currentSeries } = get()
    if (!currentSeries) return

    const nextIndex = Math.min(
      currentInstanceIndex + 1,
      currentSeries.instances.length - 1
    )
    get().setCurrentInstance(nextIndex)
  },

  previousInstance: () => {
    const { currentInstanceIndex } = get()
    const prevIndex = Math.max(currentInstanceIndex - 1, 0)
    get().setCurrentInstance(prevIndex)
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
