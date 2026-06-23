import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, CardButton, Checkbox } from '@/components/ui'
import { useSettingsStore, Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { ExportFormat, ExportScale, ExportOptions } from '@/lib/export/types'
import { previewFilename } from '@/lib/export/fileNaming'
import { estimateFileSize } from '@/lib/export/imageCapture'
import { exportImage } from '@/lib/export/imageExport'
import { exportPDF } from '@/lib/export/pdfExport'
import { useErrorHandler } from '@/hooks/useErrorHandler'

interface ExportDialogProps {
  show: boolean
  onClose: () => void
  viewportElement: HTMLDivElement | null
}

export function ExportDialog({ show, onClose, viewportElement }: ExportDialogProps) {
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const viewportSettings = useViewportStore((state) => state.settings)
  const { handleError } = useErrorHandler()

  // Export options state
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<ExportScale>(1)
  const [jpegQuality, setJpegQuality] = useState(95)
  const [includePatientName, setIncludePatientName] = useState(false)
  const [includePatientID, setIncludePatientID] = useState(false)
  const [includeStudyDescription, setIncludeStudyDescription] = useState(false)
  const [includeSeriesDescription, setIncludeSeriesDescription] = useState(false)

  // UI state
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (show) {
      setError(null)
    }
  }, [show])

  // Preview filename
  const filename = previewFilename(currentInstance, format, includePatientID)

  // Estimate file size
  const imageWidth = currentInstance?.metadata?.columns || 512
  const imageHeight = currentInstance?.metadata?.rows || 512
  const estimatedSize = estimateFileSize(imageWidth, imageHeight, scale, format)

  const theme = useSettingsStore((s) => s.theme)

  // Handle export
  const handleExport = async () => {
    if (!viewportElement || !currentInstance) {
      setError('No image loaded')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const options: ExportOptions = {
        format,
        scale,
        jpegQuality,
        includePatientName,
        includePatientID,
        includeStudyDescription,
        includeSeriesDescription,
      }

      let result

      if (format === 'pdf') {
        result = await exportPDF(viewportElement, currentInstance, viewportSettings, options)
      } else {
        result = await exportImage(viewportElement, currentInstance, options)
      }

      if (result.success) {
        // Success - confirm via toast, then close after a short delay
        handleError(`Saved ${filename}`, 'Export', 'success')
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Export Image"
      maxWidth="max-w-lg"
      dismissible={!isExporting}
      footer={
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || !currentInstance}
            loading={isExporting}
            data-testid="export-confirm-button"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      }
    >
      <div>
          {/* Format Selection */}
          <ExportSection title="Format" theme={theme}>
            <div className="flex gap-2">
              <FormatButton
                format="png"
                label="PNG"
                description="Lossless"
                selected={format === 'png'}
                onClick={() => setFormat('png')}
              />
              <FormatButton
                format="jpeg"
                label="JPEG"
                description="Smaller size"
                selected={format === 'jpeg'}
                onClick={() => setFormat('jpeg')}
              />
              <FormatButton
                format="pdf"
                label="PDF"
                description="With metadata"
                selected={format === 'pdf'}
                onClick={() => setFormat('pdf')}
              />
            </div>
          </ExportSection>

          {/* JPEG Quality (only for JPEG) */}
          {format === 'jpeg' && (
            <ExportSection title="JPEG Quality" theme={theme}>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                  aria-label="JPEG quality"
                  className="flex-1 h-2 cursor-pointer"
                />
                <span className={`text-sm font-mono w-12 text-right ${themeClasses.text(theme)}`}>
                  {jpegQuality}%
                </span>
              </div>
            </ExportSection>
          )}

          {/* Resolution */}
          <ExportSection title="Resolution" theme={theme}>
            <div className="flex gap-2">
              <ResolutionButton
                scale={1}
                label="1x"
                description="Original"
                selected={scale === 1}
                onClick={() => setScale(1)}
              />
              <ResolutionButton
                scale={2}
                label="2x"
                description="High detail"
                selected={scale === 2}
                onClick={() => setScale(2)}
              />
              <ResolutionButton
                scale={4}
                label="4x"
                description="Print quality"
                selected={scale === 4}
                onClick={() => setScale(4)}
              />
            </div>
          </ExportSection>

          {/* Metadata Options (only for PDF) */}
          {format === 'pdf' && (
            <ExportSection title="Include Metadata (Optional)" theme={theme}>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-200">
                  <p className="text-xs">
                    Privacy Notice: Patient identifiable information is excluded by default. Only enable if required for your use case.
                  </p>
                </div>

                <MetadataCheckbox
                  label="Include Patient Name"
                  checked={includePatientName}
                  onChange={setIncludePatientName}
                  data-testid="include-patient-name"
                />
                <MetadataCheckbox
                  label="Include Patient ID"
                  checked={includePatientID}
                  onChange={setIncludePatientID}
                  data-testid="include-patient-id"
                />
                <MetadataCheckbox
                  label="Include Study Description"
                  checked={includeStudyDescription}
                  onChange={setIncludeStudyDescription}
                />
                <MetadataCheckbox
                  label="Include Series Description"
                  checked={includeSeriesDescription}
                  onChange={setIncludeSeriesDescription}
                />
              </div>
            </ExportSection>
          )}

          {/* Filename Preview */}
          <ExportSection title="Filename Preview" theme={theme}>
            <div className={`p-3 rounded-lg font-mono text-sm ${themeClasses.bgSecondary(theme)} ${themeClasses.text(theme)}`}>
              {filename}
            </div>
            <p className={`text-xs mt-2 ${themeClasses.textSecondary(theme)}`}>
              Estimated size: {estimatedSize}
            </p>
          </ExportSection>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Section component
interface ExportSectionProps {
  title: string
  children: React.ReactNode
  theme: Theme
}

function ExportSection({ title, children, theme }: ExportSectionProps) {
  return (
    <div className="mb-6">
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${themeClasses.textSecondary(theme)}`}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// A selectable card showing a label + short description (format / resolution).
function CardOption({ label, description, selected, onClick }: {
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <CardButton selected={selected} onClick={onClick} ariaLabel={label}>
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{description}</div>
    </CardButton>
  )
}

// Format button component
interface FormatButtonProps {
  format: ExportFormat
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

function FormatButton({ label, description, selected, onClick }: FormatButtonProps) {
  return <CardOption label={label} description={description} selected={selected} onClick={onClick} />
}

// Resolution button component
interface ResolutionButtonProps {
  scale: ExportScale
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

function ResolutionButton({ label, description, selected, onClick }: ResolutionButtonProps) {
  return <CardOption label={label} description={description} selected={selected} onClick={onClick} />
}

// Metadata checkbox component
interface MetadataCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  'data-testid'?: string
}

function MetadataCheckbox({ label, checked, onChange, 'data-testid': testId }: MetadataCheckboxProps) {
  return <Checkbox checked={checked} onChange={onChange} label={label} data-testid={testId} />
}
