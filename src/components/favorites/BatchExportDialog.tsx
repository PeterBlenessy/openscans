import { useState } from 'react'
import { Button, CardButton, Checkbox, ProgressBar, Modal } from '@/components/ui'
import { FavoriteImage } from '@/stores/favoritesStore'
import { exportBatchPDF, GridLayout } from '@/lib/export/batchPdfExport'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'

interface BatchExportDialogProps {
  show: boolean
  onClose: () => void
  favorites: FavoriteImage[]
}

export function BatchExportDialog({ show, onClose, favorites }: BatchExportDialogProps) {
  const theme = useSettingsStore((s) => s.theme)
  const [gridLayout, setGridLayout] = useState<GridLayout>('1x1')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const { handleError } = useErrorHandler()

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
        // Success - confirm via toast, then close after a short delay
        handleError(`Exported ${favorites.length} image${favorites.length === 1 ? '' : 's'} to PDF`, 'Batch Export', 'success')
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

  const footer = (
    <div className="flex items-center justify-between">
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
  )

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Batch Export to PDF"
      maxWidth="max-w-lg"
      dismissible={!isExporting}
      footer={footer}
    >
      {/* Summary */}
      <div className={`p-3 rounded-lg mb-4 ${themeClasses.bgSecondary(theme)}`}>
        <div className="flex items-center justify-between text-sm">
          <span className={themeClasses.textSecondary(theme)}>Images to export:</span>
          <span className={`font-semibold ${themeClasses.text(theme)}`}>{favorites.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className={themeClasses.textSecondary(theme)}>Estimated pages:</span>
          <span className={`font-semibold ${themeClasses.text(theme)}`}>{estimatedPages}</span>
        </div>
      </div>

      {/* Grid Layout Selection */}
      <div className="mb-4">
        <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${themeClasses.textSecondary(theme)}`}>
          Layout
        </h3>
        <div className="grid grid-cols-5 gap-2">
          <GridButton layout="1x1" label="1×1" description="1 per page" selected={gridLayout === '1x1'} onClick={() => setGridLayout('1x1')} />
          <GridButton layout="2x2" label="2×2" description="4 per page" selected={gridLayout === '2x2'} onClick={() => setGridLayout('2x2')} />
          <GridButton layout="2x3" label="2×3" description="6 per page" selected={gridLayout === '2x3'} onClick={() => setGridLayout('2x3')} />
          <GridButton layout="3x3" label="3×3" description="9 per page" selected={gridLayout === '3x3'} onClick={() => setGridLayout('3x3')} />
          <GridButton layout="4x4" label="4×4" description="16 per page" selected={gridLayout === '4x4'} onClick={() => setGridLayout('4x4')} />
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
              <p className={`text-xs ${themeClasses.textSecondary(theme)}`}>Add study information as first page</p>
            </div>
          }
        />
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className={themeClasses.textSecondary(theme)}>
              Exporting image {progress.current} of {progress.total}
            </span>
            <span className={`font-semibold ${themeClasses.text(theme)}`}>
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
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </Modal>
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
