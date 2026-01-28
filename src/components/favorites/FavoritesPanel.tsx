import { useState, useEffect, useRef } from 'react'
import { useFavoritesStore, FavoriteImage } from '@/stores/favoritesStore'
import { useStudyStore } from '@/stores/studyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cornerstone } from '@/lib/cornerstone/initCornerstone'
import { BatchExportDialog } from './BatchExportDialog'
import { formatSeriesDescription } from '@/lib/utils/formatSeriesDescription'

type ViewMode = 'text' | 'thumbnails'

export function FavoritesPanel() {
  const favorites = useFavoritesStore((state) => state.favorites)
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite)
  const clearAllFavorites = useFavoritesStore((state) => state.clearAllFavorites)
  const setCurrentSeries = useStudyStore((state) => state.setCurrentSeries)
  const setCurrentInstance = useStudyStore((state) => state.setCurrentInstance)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const theme = useSettingsStore((state) => state.theme)

  const [showBatchExport, setShowBatchExport] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('favoritesViewMode')
    return (saved as ViewMode) || 'text'
  })

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('favoritesViewMode', viewMode)
  }, [viewMode])

  const handleFavoriteClick = (favorite: FavoriteImage) => {
    // Navigate to the series first
    setCurrentSeries(favorite.seriesInstanceUID)

    // Find the instance index in the series
    setTimeout(() => {
      const series = useStudyStore.getState().currentSeries
      if (series?.instances) {
        const instanceIndex = series.instances.findIndex(
          (inst) => inst.sopInstanceUID === favorite.sopInstanceUID
        )
        if (instanceIndex >= 0) {
          setCurrentInstance(instanceIndex)
        }
      }
    }, 100)
  }

  const handleRemoveFavorite = (sopInstanceUID: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFavorite(sopInstanceUID)
  }

  const handleClearAll = () => {
    clearAllFavorites()
    setShowClearConfirm(false)
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-10 h-10 mx-auto mb-2 opacity-20 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
        >
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          No favorites yet
        </p>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>
          Click the star icon to add
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {/* Header with count and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {favorites.length} {favorites.length === 1 ? 'image' : 'images'}
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'text' ? 'thumbnails' : 'text')}
              className={`transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              title={viewMode === 'text' ? 'Show thumbnails' : 'Show text'}
            >
              {viewMode === 'text' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowBatchExport(true)}
              className={`transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              title="Export all to PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.25 2.25 0 004.25 17.5h11.5A2.25 2.25 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .414-.336.75-.75.75H4.25a.75.75 0 01-.75-.75v-2.5z" />
              </svg>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              title="Clear all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Clear Confirmation */}
        {showClearConfirm && (
          <div className={`p-2 rounded text-xs mb-2 ${theme === 'dark' ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
            <p className={`mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Clear all {favorites.length} favorites?</p>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Favorites List - Text View */}
        {viewMode === 'text' && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {favorites.map((favorite) => {
              const isActive = currentInstance?.sopInstanceUID === favorite.sopInstanceUID

              return (
                <button
                  key={favorite.sopInstanceUID}
                  onClick={() => handleFavoriteClick(favorite)}
                  className={`w-full py-1.5 px-2 rounded text-left transition-colors group relative ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-[#2a2a2a] border border-[#3a3a3a]'
                        : 'bg-gray-200 border border-gray-300'
                      : theme === 'dark'
                      ? 'bg-[#0f0f0f] hover:bg-[#1a1a1a] border border-transparent'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {favorite.modality || 'Unknown'} • {formatSeriesDescription(favorite.seriesDescription) || `Series ${favorite.seriesNumber}`} • {favorite.instanceNumber}
                      </div>
                    </div>
                    <div
                      onClick={(e) => handleRemoveFavorite(favorite.sopInstanceUID, e)}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-red-900/30' : 'hover:bg-red-100'}`}
                      title="Remove"
                      role="button"
                      tabIndex={0}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}
                      >
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Favorites List - Thumbnail View */}
        {viewMode === 'thumbnails' && (
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {favorites.map((favorite) => (
              <FavoriteThumbnail
                key={favorite.sopInstanceUID}
                favorite={favorite}
                isActive={currentInstance?.sopInstanceUID === favorite.sopInstanceUID}
                onClick={() => handleFavoriteClick(favorite)}
                onRemove={(e) => handleRemoveFavorite(favorite.sopInstanceUID, e)}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch Export Dialog */}
      <BatchExportDialog
        show={showBatchExport}
        onClose={() => setShowBatchExport(false)}
        favorites={favorites}
      />
    </>
  )
}

// Thumbnail component for grid view
interface FavoriteThumbnailProps {
  favorite: FavoriteImage
  isActive: boolean
  onClick: () => void
  onRemove: (e: React.MouseEvent) => void
  theme: 'dark' | 'light'
}

function FavoriteThumbnail({ favorite, isActive, onClick, onRemove, theme }: FavoriteThumbnailProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!canvasRef.current || loadedRef.current) return

    const element = canvasRef.current

    async function loadThumbnail() {
      try {
        cornerstone.enable(element)
        const image = await cornerstone.loadImage(favorite.imageId)
        cornerstone.displayImage(element, image)

        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          // Calculate scale to fit 80x80 thumbnail
          const scale = Math.min(80 / image.width, 80 / image.height)
          viewport.scale = scale
          cornerstone.setViewport(element, viewport)
        }

        loadedRef.current = true
      } catch (err) {
        console.error(`Failed to load thumbnail for favorite:`, err)
      }
    }

    loadThumbnail()

    return () => {
      try {
        if (loadedRef.current) {
          cornerstone.disable(element)
        }
      } catch (err) {
        // Ignore disable errors
      }
    }
  }, [favorite.imageId])

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 relative group rounded overflow-hidden ${
        isActive
          ? 'ring-2 ring-[#4a4a4a]'
          : 'ring-1 ring-[#2a2a2a] hover:ring-[#3a3a3a]'
      }`}
    >
      <div
        ref={canvasRef}
        className="w-20 h-20 bg-black"
        style={{
          minWidth: '80px',
          minHeight: '80px',
          imageRendering: 'crisp-edges'
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
        {favorite.instanceNumber}
      </div>
      <div
        onClick={onRemove}
        className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-red-900/30' : 'hover:bg-red-100'}`}
        title="Remove"
        role="button"
        tabIndex={0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </div>
    </button>
  )
}
