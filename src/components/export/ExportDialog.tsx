import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { ExportFormat, ExportScale, ExportOptions } from '@/lib/export/types'
import { previewFilename } from '@/lib/export/fileNaming'
import { estimateFileSize } from '@/lib/export/imageCapture'
import { exportImage } from '@/lib/export/imageExport'
import { exportPDF } from '@/lib/export/pdfExport'

interface ExportDialogProps {
  show: boolean
  onClose: () => void
  viewportElement: HTMLDivElement | null
}

export function ExportDialog({ show, onClose, viewportElement }: ExportDialogProps) {
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const viewportSettings = useViewportStore((state) => state.settings)

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

  const isDark = true // Always use dark theme to match app

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
        // Success - close dialog after short delay
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
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm transition-colors text-gray-400 hover:text-white"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !currentInstance}
            data-testid="export-confirm-button"
            className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a]"
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
              'Export'
            )}
          </button>
        </div>
      }
    >
      <div>
          {/* Format Selection */}
          <ExportSection title="Format" isDark={isDark}>
            <div className="flex gap-2">
              <FormatButton
                format="png"
                label="PNG"
                description="Lossless"
                selected={format === 'png'}
                onClick={() => setFormat('png')}
                isDark={isDark}
              />
              <FormatButton
                format="jpeg"
                label="JPEG"
                description="Smaller size"
                selected={format === 'jpeg'}
                onClick={() => setFormat('jpeg')}
                isDark={isDark}
              />
              <FormatButton
                format="pdf"
                label="PDF"
                description="With metadata"
                selected={format === 'pdf'}
                onClick={() => setFormat('pdf')}
                isDark={isDark}
              />
            </div>
          </ExportSection>

          {/* JPEG Quality (only for JPEG) */}
          {format === 'jpeg' && (
            <ExportSection title="JPEG Quality" isDark={isDark}>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-200'}`}
                />
                <span className={`text-sm font-mono w-12 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {jpegQuality}%
                </span>
              </div>
            </ExportSection>
          )}

          {/* Resolution */}
          <ExportSection title="Resolution" isDark={isDark}>
            <div className="flex gap-2">
              <ResolutionButton
                scale={1}
                label="1x"
                description="Original"
                selected={scale === 1}
                onClick={() => setScale(1)}
                isDark={isDark}
              />
              <ResolutionButton
                scale={2}
                label="2x"
                description="High detail"
                selected={scale === 2}
                onClick={() => setScale(2)}
                isDark={isDark}
              />
              <ResolutionButton
                scale={4}
                label="4x"
                description="Print quality"
                selected={scale === 4}
                onClick={() => setScale(4)}
                isDark={isDark}
              />
            </div>
          </ExportSection>

          {/* Metadata Options (only for PDF) */}
          {format === 'pdf' && (
            <ExportSection title="Include Metadata (Optional)" isDark={isDark}>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    Privacy Notice: Patient identifiable information is excluded by default. Only enable if required for your use case.
                  </p>
                </div>

                <MetadataCheckbox
                  label="Include Patient Name"
                  checked={includePatientName}
                  onChange={setIncludePatientName}
                  isDark={isDark}
                  data-testid="include-patient-name"
                />
                <MetadataCheckbox
                  label="Include Patient ID"
                  checked={includePatientID}
                  onChange={setIncludePatientID}
                  isDark={isDark}
                  data-testid="include-patient-id"
                />
                <MetadataCheckbox
                  label="Include Study Description"
                  checked={includeStudyDescription}
                  onChange={setIncludeStudyDescription}
                  isDark={isDark}
                />
                <MetadataCheckbox
                  label="Include Series Description"
                  checked={includeSeriesDescription}
                  onChange={setIncludeSeriesDescription}
                  isDark={isDark}
                />
              </div>
            </ExportSection>
          )}

          {/* Filename Preview */}
          <ExportSection title="Filename Preview" isDark={isDark}>
            <div className={`p-3 rounded-lg font-mono text-sm ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
              {filename}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estimated size: {estimatedSize}
            </p>
          </ExportSection>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
            <p className="text-sm text-red-400">{error}</p>
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
  isDark: boolean
}

function ExportSection({ title, children, isDark }: ExportSectionProps) {
  return (
    <div className="mb-6">
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// Format button component
interface FormatButtonProps {
  format: ExportFormat
  label: string
  description: string
  selected: boolean
  onClick: () => void
  isDark: boolean
}

function FormatButton({ label, description, selected, onClick, isDark }: FormatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
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

// Resolution button component
interface ResolutionButtonProps {
  scale: ExportScale
  label: string
  description: string
  selected: boolean
  onClick: () => void
  isDark: boolean
}

function ResolutionButton({ label, description, selected, onClick, isDark }: ResolutionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
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

// Metadata checkbox component
interface MetadataCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  isDark: boolean
  'data-testid'?: string
}

function MetadataCheckbox({ label, checked, onChange, isDark, 'data-testid': testId }: MetadataCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
        data-testid={testId}
      />
      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</span>
    </label>
  )
}
