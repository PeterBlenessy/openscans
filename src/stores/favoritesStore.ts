import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Favorite image reference with essential metadata for display and export
 */
export interface FavoriteImage {
  sopInstanceUID: string
  studyInstanceUID: string
  seriesInstanceUID: string
  instanceNumber: number
  imageId: string

  // Metadata for display
  patientName?: string
  studyDate?: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string

  // Timestamp when favorited
  favoritedAt: number
}

interface FavoritesState {
  favorites: FavoriteImage[]

  // Actions
  addFavorite: (image: FavoriteImage) => void
  removeFavorite: (sopInstanceUID: string) => void
  toggleFavorite: (image: FavoriteImage) => boolean // Returns true if added, false if removed
  isFavorite: (sopInstanceUID: string) => boolean
  clearAllFavorites: () => void
  getFavoriteCount: () => number
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (image) => {
        const { favorites } = get()
        // Avoid duplicates
        if (!favorites.find((f) => f.sopInstanceUID === image.sopInstanceUID)) {
          set({ favorites: [...favorites, image] })
        }
      },

      removeFavorite: (sopInstanceUID) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.sopInstanceUID !== sopInstanceUID),
        }))
      },

      toggleFavorite: (image) => {
        const { favorites, addFavorite, removeFavorite } = get()
        const existing = favorites.find((f) => f.sopInstanceUID === image.sopInstanceUID)

        if (existing) {
          removeFavorite(image.sopInstanceUID)
          return false
        } else {
          addFavorite(image)
          return true
        }
      },

      isFavorite: (sopInstanceUID) => {
        return get().favorites.some((f) => f.sopInstanceUID === sopInstanceUID)
      },

      clearAllFavorites: () => {
        set({ favorites: [] })
      },

      getFavoriteCount: () => {
        return get().favorites.length
      },
    }),
    {
      name: 'mr-viewer-favorites', // localStorage key
      version: 1,
    }
  )
)
