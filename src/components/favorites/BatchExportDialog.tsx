import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, CardButton, Checkbox, ProgressBar } from '@/components/ui'
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
    <Dialog.Root open={show} onOpenChange={(open) => { if (!open && !isExporting) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            aria-describedby={undefined}
            // Block Escape / outside-pointer dismissal while a batch export is
            // in flight (mirrors the previous `!isExporting` guards).
            onEscapeKeyDown={(e) => { if (isExporting) e.preventDefault() }}
            onPointerDownOutside={(e) => { if (isExporting) e.preventDefault() }}
            onInteractOutside={(e) => { if (isExporting) e.preventDefault() }}
            className={`pointer-events-auto relative rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border focus:outline-none ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
          >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <Dialog.Title id="batch-export-title" className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Batch Export to PDF
          </Dialog.Title>
          {!isExporting && (
            <Dialog.Close
              aria-label="Close dialog"
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </Dialog.Close>
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
              />
              <GridButton
                layout="2x2"
                label="2×2"
                description="4 per page"
                selected={gridLayout === '2x2'}
                onClick={() => setGridLayout('2x2')}
              />
              <GridButton
                layout="2x3"
                label="2×3"
                description="6 per page"
                selected={gridLayout === '2x3'}
                onClick={() => setGridLayout('2x3')}
              />
              <GridButton
                layout="3x3"
                label="3×3"
                description="9 per page"
                selected={gridLayout === '3x3'}
                onClick={() => setGridLayout('3x3')}
              />
              <GridButton
                layout="4x4"
                label="4×4"
                description="16 per page"
                selected={gridLayout === '4x4'}
                onClick={() => setGridLayout('4x4')}
              />
            </div>
          </div>

          {/* Metadata Option */}
          <div className="mb-4">
            <Checkbox
              checked={includeMetadata}
              onChange={setIncludeMetadata}
              disabled={isExporting}
              label={
                <div>
                  <span className="text-sm">Include metadata page</span>
                  <p className="text-xs text-gray-500">Add study information as first page</p>
                </div>
              }
            />
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
              <ProgressBar
                value={(progress.current / progress.total) * 100}
                label={`Exporting image ${progress.current} of ${progress.total}`}
              />
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
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || favorites.length === 0}
            loading={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Grid button component
interface GridButtonProps {
  layout: GridLayout
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

function GridButton({ label, description, selected, onClick }: GridButtonProps) {
  return (
    <CardButton selected={selected} onClick={onClick} ariaLabel={label}>
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{description}</div>
    </CardButton>
  )
}
