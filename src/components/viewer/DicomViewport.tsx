import { useRef, useState } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { ViewportToolbar } from './ViewportToolbar'
import { ExportDialog } from '@/components/export/ExportDialog'
import { AnnotationOverlay } from './AnnotationOverlay'
import { AiAnalysisModal } from './AiAnalysisModal'
import { AiStatusOverlays } from './AiStatusOverlays'
import { DownloadProgressOverlay } from './DownloadProgressOverlay'
import { ViewportIndicators } from './ViewportIndicators'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useAiAnalysisStore } from '@/stores/aiAnalysisStore'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useViewportMouseInteraction } from '@/hooks/useViewportMouseInteraction'
import { useViewportPanAndZoom } from '@/hooks/useViewportPanAndZoom'
import { useViewportKeyboard } from '@/hooks/useViewportKeyboard'
import { useViewportSetup } from '@/hooks/useViewportSetup'
import { useViewportTools } from '@/hooks/useViewportTools'
import { useStackPrefetch } from '@/hooks/useStackPrefetch'
import { useCinePlayback } from '@/hooks/useCinePlayback'
import { useFullscreen } from '@/hooks/useFullscreen'

interface DicomViewportProps {
  className?: string
}

export function DicomViewport({ className = '' }: DicomViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fitScaleRef = useRef(1)
  const currentImageIdRef = useRef<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Full-screen mode (Browser Fullscreen API on the viewport container).
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const settings = useViewportStore((state) => state.settings)
  const setModality = useViewportStore((state) => state.setModality)
  const isDetecting = useViewportStore((state) => state.isDetecting)
  const detectionError = useViewportStore((state) => state.detectionError)
  const setDetecting = useViewportStore((state) => state.setDetecting)
  const addAnnotations = useAnnotationStore.getState().addAnnotations
  const deleteAnnotationsForInstance = useAnnotationStore.getState().deleteAnnotationsForInstance
  const isAnalyzing = useAiAnalysisStore((state) => state.isAnalyzing)
  const analysisError = useAiAnalysisStore((state) => state.analysisError)
  const addAnalysis = useAiAnalysisStore.getState().addAnalysis
  const setAnalyzing = useAiAnalysisStore.getState().setAnalyzing

  const { handleError } = useErrorHandler()

  // Viewport setup and lifecycle
  const { isInitialized, error } = useViewportSetup({
    canvasRef,
    currentInstance,
    settings,
    fitScaleRef,
    currentImageIdRef,
    setModality
  })

  // Window/level mouse interaction
  const { isDragging, currentWL } = useViewportMouseInteraction(canvasRef, isInitialized)

  // Pan and zoom interaction
  const { isPanning, isActivelyZooming } = useViewportPanAndZoom(canvasRef, isInitialized, {
    fitScaleRef
  })

  // Measurement / ROI tools (Length, Angle, Elliptical/Rectangle ROI)
  useViewportTools(canvasRef, isInitialized)
  useStackPrefetch(canvasRef, isInitialized)

  // Cine loop / auto-play through the current series
  useCinePlayback()

  // Keyboard shortcuts
  const { isModifierKeyPressed } = useViewportKeyboard({
    currentInstance,
    currentStudy,
    isDetecting,
    isAnalyzing,
    setDetecting,
    setAnalyzing,
    addAnnotations,
    deleteAnnotationsForInstance,
    addAnalysis,
    handleError,
    onToggleFullscreen: toggleFullscreen,
    onToggleCine: () => useViewportStore.getState().toggleCine(),
    onCineFrameRateUp: () =>
      useViewportStore.getState().setCineFrameRate(useViewportStore.getState().cineFrameRate + 1),
    onCineFrameRateDown: () =>
      useViewportStore.getState().setCineFrameRate(useViewportStore.getState().cineFrameRate - 1),
    onActivateLength: () => useViewportStore.getState().setActiveTool('Length'),
    onActivateAngle: () => useViewportStore.getState().setActiveTool('Angle')
  })

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-gray-400 text-center">
          <p className="text-xl">Initializing DICOM viewer...</p>
        </div>
      </div>
    )
  }

  if (!currentInstance) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-gray-400 text-center">
          <p className="text-xl">No image loaded</p>
          <p className="text-sm mt-2">Load DICOM files to begin</p>
        </div>
      </div>
    )
  }

  // Describe the currently displayed image for assistive technology. The canvas
  // is a non-text graphic, so it carries role="img" with a synthesized label.
  const modality = currentSeries?.modality || currentInstance.metadata?.modality
  const seriesDescription = currentSeries?.seriesDescription || currentInstance.metadata?.seriesDescription
  const totalInSeries = currentSeries?.instances.length
  const imageLabel = totalInSeries
    ? `${[modality, seriesDescription].filter(Boolean).join(' ') || 'DICOM image'}, image ${currentInstanceIndex + 1} of ${totalInSeries}`
    : `${[modality, seriesDescription].filter(Boolean).join(' ') || 'DICOM image'}`

  return (
    <div
      ref={containerRef}
      data-testid="viewport-container"
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      className={`bg-black ${className} relative group ${isFullscreen ? 'fullscreen-container' : ''}`}
    >
      <div
        ref={canvasRef}
        data-testid="viewport"
        role="img"
        aria-label={imageLabel}
        className="w-full h-full bg-black"
        style={{
          cursor: isDragging ? 'crosshair' : isPanning ? 'grabbing' : isModifierKeyPressed ? 'grab' : 'crosshair',
          imageRendering: 'crisp-edges' // Pixel-perfect rendering for medical images - no interpolation
        }}
      />

      {/* Viewport Toolbar. In fullscreen it auto-hides and reveals on hover. */}
      <ViewportToolbar
        className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${
          isFullscreen
            ? 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-events-auto'
            : ''
        }`}
        onExportClick={() => setShowExportDialog(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Annotation Overlay */}
      <AnnotationOverlay canvasElement={canvasRef.current} />

      {/* Export Dialog */}
      <ExportDialog
        show={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        viewportElement={canvasRef.current}
      />

      {/* AI Analysis Modal */}
      <AiAnalysisModal />

      {/* AI Status Overlays */}
      <AiStatusOverlays
        isDetecting={isDetecting}
        detectionError={detectionError}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        onDismissDetectionError={() => setDetecting(false, null)}
        onDismissAnalysisError={() => setAnalyzing(false, null)}
      />

      {/* On-demand download progress (local model / MR engine) */}
      <DownloadProgressOverlay />

      {/* Viewport Indicators */}
      <ViewportIndicators
        isDragging={isDragging}
        isPanning={isPanning}
        isActivelyZooming={isActivelyZooming}
        currentWL={currentWL}
        zoom={settings.zoom}
      />
    </div>
  )
}
