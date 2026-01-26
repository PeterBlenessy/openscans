import { create } from 'zustand'

export interface RecentStudyEntry {
  id: string
  studyInstanceUID: string
  patientName: string
  patientID: string
  studyDate: string
  studyDescription: string
  seriesCount: number
  imageCount: number
  loadedAt: number
  directoryHandleId?: string // Reference to stored directory handle in IndexedDB (web mode)
  folderPath?: string // Folder path for desktop mode
}

interface RecentStudiesState {
  recentStudies: RecentStudyEntry[]
  addRecentStudy: (entry: Omit<RecentStudyEntry, 'id' | 'loadedAt'>) => void
  removeRecentStudy: (id: string) => void
  clearRecentStudies: () => void
}

const STORAGE_KEY = 'openscans-recent-studies'

function loadRecentStudies(): RecentStudyEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load recent studies:', e)
  }
  return []
}

function saveRecentStudies(studies: RecentStudyEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studies))
  } catch (e) {
    console.error('Failed to save recent studies:', e)
  }
}

export const useRecentStudiesStore = create<RecentStudiesState>((set, get) => ({
  recentStudies: loadRecentStudies(),

  addRecentStudy: (entry) => {
    const newEntry: RecentStudyEntry = {
      ...entry,
      id: crypto.randomUUID(),
      loadedAt: Date.now(),
    }

    set((state) => {
      // Check if study already exists (by studyInstanceUID)
      const existingIndex = state.recentStudies.findIndex(
        (s) => s.studyInstanceUID === entry.studyInstanceUID
      )

      let updatedStudies: RecentStudyEntry[]

      if (existingIndex >= 0) {
        // Move existing study to front and update loadedAt
        const updated = [...state.recentStudies]
        updated[existingIndex] = { ...updated[existingIndex], loadedAt: Date.now() }
        updatedStudies = [
          updated[existingIndex],
          ...updated.slice(0, existingIndex),
          ...updated.slice(existingIndex + 1),
        ]
      } else {
        // Add new study to front, limit to 10 entries
        updatedStudies = [newEntry, ...state.recentStudies].slice(0, 10)
      }

      saveRecentStudies(updatedStudies)
      return { recentStudies: updatedStudies }
    })
  },

  removeRecentStudy: (id) => {
    set((state) => {
      const updatedStudies = state.recentStudies.filter((s) => s.id !== id)
      saveRecentStudies(updatedStudies)
      return { recentStudies: updatedStudies }
    })
  },

  clearRecentStudies: () => {
    saveRecentStudies([])
    set({ recentStudies: [] })
  },
}))
