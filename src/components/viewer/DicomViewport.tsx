import { useRef, useState } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { ViewportToolbar } from './ViewportToolbar'
import { ExportDialog } from '@/components/export/ExportDialog'
import { AnnotationOverlay } from './AnnotationOverlay'
import { AiAnalysisModal } from './AiAnalysisModal'
import { AiStatusOverlays } from './AiStatusOverlays'
import { ViewportIndicators } from './ViewportIndicators'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useAiAnalysisStore } from '@/stores/aiAnalysisStore'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useViewportMouseInteraction } from '@/hooks/useViewportMouseInteraction'
import { useViewportPanAndZoom } from '@/hooks/useViewportPanAndZoom'
import { useViewportKeyboard } from '@/hooks/useViewportKeyboard'
import { useViewportSetup } from '@/hooks/useViewportSetup'

interface DicomViewportProps {
  className?: string
}

export function DicomViewport({ className = '' }: DicomViewportProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const fitScaleRef = useRef(1)
  const currentImageIdRef = useRef<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentStudy = useStudyStore((state) => state.currentStudy)
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
    handleError
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

  return (
    <div className={`bg-black ${className} relative`}>
      <div
        ref={canvasRef}
        data-testid="viewport"
        className="w-full h-full bg-black"
        style={{
          cursor: isDragging ? 'crosshair' : isPanning ? 'grabbing' : isModifierKeyPressed ? 'grab' : 'crosshair',
          imageRendering: 'crisp-edges' // Pixel-perfect rendering for medical images - no interpolation
        }}
      />

      {/* Viewport Toolbar */}
      <ViewportToolbar
        className="absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out"
        onExportClick={() => setShowExportDialog(true)}
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
