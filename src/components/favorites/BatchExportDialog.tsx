import { useState, useEffect } from 'react'
import { FavoriteImage } from '@/stores/favoritesStore'
import { exportBatchPDF, GridLayout } from '@/lib/export/batchPdfExport'

interface BatchExportDialogProps {
  show: boolean
  onClose: () => void
  favorites: FavoriteImage[]
}

export function BatchExportDialog({ show, onClose, favorites }: BatchExportDialogProps) {
  const [gridLayout, setGridLayout] = useState<GridLayout>('1x1')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  // Close on Escape key (but not while exporting)
  useEffect(() => {
    if (!show) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [show, onClose, isExporting])

  if (!show) return null

  const isDark = true

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setProgress({ current: 0, total: favorites.length })

    try {
      const result = await exportBatchPDF(favorites, {
        gridLayout,
        includeMetadata,
        onProgress: (current, total) => {
          setProgress({ current, total })
        },
      })

      if (result.success) {
        // Success - close after short delay
        setTimeout(() => {
          onClose()
          // Reset state
          setProgress({ current: 0, total: 0 })
        }, 500)
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (err) {
      console.error('Batch export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const imagesPerPage =
    gridLayout === '1x1' ? 1 :
    gridLayout === '2x2' ? 4 :
    gridLayout === '2x3' ? 6 :
    gridLayout === '3x3' ? 9 : 16
  const estimatedPages = Math.ceil(favorites.length / imagesPerPage)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isExporting ? undefined : onClose}
      />

      {/* Modal */}
      <div className={`relative rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Batch Export to PDF
          </h2>
          {!isExporting && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Summary */}
          <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Images to export:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{favorites.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Estimated pages:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{estimatedPages}</span>
            </div>
          </div>

          {/* Grid Layout Selection */}
          <div className="mb-4">
            <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Layout
            </h3>
            <div className="grid grid-cols-5 gap-2">
              <GridButton
                layout="1x1"
                label="1×1"
                description="1 per page"
                selected={gridLayout === '1x1'}
                onClick={() => setGridLayout('1x1')}
                isDark={isDark}
              />
              <GridButton
                layout="2x2"
                label="2×2"
                description="4 per page"
                selected={gridLayout === '2x2'}
                onClick={() => setGridLayout('2x2')}
                isDark={isDark}
              />
              <GridButton
                layout="2x3"
                label="2×3"
                description="6 per page"
                selected={gridLayout === '2x3'}
                onClick={() => setGridLayout('2x3')}
                isDark={isDark}
              />
              <GridButton
                layout="3x3"
                label="3×3"
                description="9 per page"
                selected={gridLayout === '3x3'}
                onClick={() => setGridLayout('3x3')}
                isDark={isDark}
              />
              <GridButton
                layout="4x4"
                label="4×4"
                description="16 per page"
                selected={gridLayout === '4x4'}
                onClick={() => setGridLayout('4x4')}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Metadata Option */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                disabled={isExporting}
              />
              <div>
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Include metadata page
                </span>
                <p className="text-xs text-gray-500">Add study information as first page</p>
              </div>
            </label>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Exporting image {progress.current} of {progress.total}
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gray-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || favorites.length === 0}
            className={`px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a]' : 'bg-gray-700 hover:bg-gray-800'}`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Grid button component
interface GridButtonProps {
  layout: GridLayout
  label: string
  description: string
  selected: boolean
  onClick: () => void
  isDark: boolean
}

function GridButton({ label, description, selected, onClick, isDark }: GridButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-all ${
        selected
          ? isDark
            ? 'border-[#4a4a4a] bg-[#2a2a2a]'
            : 'border-gray-400 bg-gray-200'
          : isDark
          ? 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#3a3a3a]'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </button>
  )
}
