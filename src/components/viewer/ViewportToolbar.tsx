import { useState } from 'react'
import {
  MonitorCog,
  Target,
  FileText,
  ScanLine,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Ruler,
  Triangle,
  Circle,
  Square,
  Eraser,
  MousePointer2,
  Spline,
  Pipette,
  ArrowUpRight,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { useFavoritesStore, FavoriteImage } from '@/stores/favoritesStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useAiAnalysisStore } from '@/stores/aiAnalysisStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { isMeasurementTool } from '@/lib/cornerstone/tools'
import { Tooltip } from '@/components/ui'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { mockDetector } from '@/lib/ai/mockVertebralDetector'
import { initDetector, getApiKeyForProvider } from '@/lib/ai/aiDetectorManager'
import { ensureLocalServer } from '@/lib/ai/localServer'
import { MR_SEGMENTATION_AVAILABLE } from '@/lib/ai/segmentationServer'
import { useMrEngineStore } from '@/stores/mrEngineStore'
import { isTauri } from '@/lib/utils/platform'
import { AiSendConfirmDialog } from './AiSendConfirmDialog'
import { confirmAiSend } from '@/lib/ai/ai-send-confirm'

/** Human-readable provider names for confirmation copy. */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  openai: 'OpenAI',
}

/** Log on-demand download progress to the console (lightweight status). */
function logDownloadProgress(prefix: string, p: { file: string; downloaded: number; total: number }) {
  const pct = p.total ? Math.round((p.downloaded / p.total) * 100) : 0
  console.log(`[${prefix}] ${p.file}: ${pct}% (${p.downloaded}/${p.total})`)
}
const logLocalProgress = (p: { file: string; downloaded: number; total: number }) =>
  logDownloadProgress('LocalAI', p)

interface ViewportToolbarProps {
  className?: string
  onExportClick?: () => void
  /** Whether the viewport is currently in full-screen mode */
  isFullscreen?: boolean
  /** Toggle full-screen mode */
  onToggleFullscreen?: () => void
}

const CINE_FPS_PRESETS = [5, 10, 15, 20, 30]

export function ViewportToolbar({
  className = '',
  onExportClick,
  isFullscreen = false,
  onToggleFullscreen,
}: ViewportToolbarProps) {
  const settings = useViewportStore((state) => state.settings)
  const resetSettings = useViewportStore((state) => state.resetSettings)
  const setRotation = useViewportStore((state) => state.setRotation)
  const setFlipHorizontal = useViewportStore((state) => state.setFlipHorizontal)
  const setFlipVertical = useViewportStore((state) => state.setFlipVertical)
  const setInvert = useViewportStore((state) => state.setInvert)
  const setZoom = useViewportStore((state) => state.setZoom)
  const setWindowLevel = useViewportStore((state) => state.setWindowLevel)
  const isDetecting = useViewportStore((state) => state.isDetecting)
  const setDetecting = useViewportStore((state) => state.setDetecting)

  // Cine + measurement tool state
  const activeTool = useViewportStore((state) => state.activeTool)
  const setActiveTool = useViewportStore((state) => state.setActiveTool)
  // The measurement/ROI tools live in a reveal-able sub-toolbar (they're many
  // and crowd the main bar). Toggled by the Measure button; stays open until
  // toggled off.
  const [showMeasureTools, setShowMeasureTools] = useState(false)
  // Derive from the canonical tool list so new measurement tools don't need a
  // second edit here (Pointer/Eraser are the non-measurement viewport modes).
  const measurementToolActive = activeTool === 'Pointer' || activeTool === 'Eraser' || isMeasurementTool(activeTool)
  const cineEnabled = useViewportStore((state) => state.cineEnabled)
  const cineFrameRate = useViewportStore((state) => state.cineFrameRate)
  const toggleCine = useViewportStore((state) => state.toggleCine)
  const setCineFrameRate = useViewportStore((state) => state.setCineFrameRate)
  // Cine-speed and window-preset menus are Radix DropdownMenus — open/close,
  // outside-click, Escape and arrow-key focus are handled by Radix.
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const addAnnotations = useAnnotationStore((state) => state.addAnnotations)
  const deleteAnnotationsForInstance = useAnnotationStore((state) => state.deleteAnnotationsForInstance)
  const addAnalysis = useAiAnalysisStore((state) => state.addAnalysis)
  const isAnalyzing = useAiAnalysisStore((state) => state.isAnalyzing)
  const setAnalyzing = useAiAnalysisStore((state) => state.setAnalyzing)
  const getAnalysisForInstance = useAiAnalysisStore((state) => state.getAnalysisForInstance)

  const { handleError } = useErrorHandler()
  const showModal = useAiAnalysisStore((state) => state.showModal)

  // Cloud AI is desktop-only — gate every AI entry point on the platform.
  const showAiControls = isTauri()

  // AI settings
  const theme = useSettingsStore((state) => state.theme)
  // Shared dropdown-menu styling (themed).
  const menuContentClass = `${themeClasses.bg(theme)} ${themeClasses.border(theme)} border rounded-lg shadow-xl py-1 z-50`
  const menuItemHl = themeClasses.menuHighlight(theme)
  const aiEnabled = useSettingsStore((state) => state.aiEnabled)
  const aiProvider = useSettingsStore((state) => state.aiProvider)
  const localModel = useSettingsStore((state) => state.localModel)
  const localPort = useSettingsStore((state) => state.localPort)
  const aiSettings = useSettingsStore((state) => ({
    aiApiKey: state.aiApiKey,
    geminiApiKey: state.geminiApiKey,
    openaiApiKey: state.openaiApiKey,
  }))

  // Subscribe to favorites array to trigger re-render on changes
  const isCurrentFavorite = useFavoritesStore((state) =>
    currentInstance ? state.favorites.some(f => f.sopInstanceUID === currentInstance.sopInstanceUID) : false
  )

  const handleRotateLeft = () => {
    setRotation((settings.rotation - 90 + 360) % 360)
  }

  const handleRotateRight = () => {
    setRotation((settings.rotation + 90) % 360)
  }

  const handleFlipHorizontal = () => {
    setFlipHorizontal(!settings.flipHorizontal)
  }

  const handleFlipVertical = () => {
    setFlipVertical(!settings.flipVertical)
  }

  const handleInvert = () => {
    setInvert(!settings.invert)
  }

  const handleZoomIn = () => {
    setZoom(Math.min(20, settings.zoom * 1.25))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, settings.zoom / 1.25))
  }

  const handleFitToScreen = () => {
    // Reset zoom and pan to defaults
    useViewportStore.getState().setZoom(1)
    useViewportStore.getState().setPan(0, 0)
  }

  // Toggle a measurement tool: clicking the active tool returns to Window/Level.
  const handleToggleTool = (toolName: string) => {
    setActiveTool(activeTool === toolName ? 'WindowLevel' : toolName)
  }

  const handleToggleFavorite = () => {
    if (!currentInstance || !currentStudy || !currentSeries) return

    const favoriteImage: FavoriteImage = {
      sopInstanceUID: currentInstance.sopInstanceUID,
      studyInstanceUID: currentStudy.studyInstanceUID,
      seriesInstanceUID: currentSeries.seriesInstanceUID,
      instanceNumber: currentInstance.instanceNumber,
      imageId: currentInstance.imageId,
      patientName: currentInstance.metadata?.patientName,
      studyDate: currentInstance.metadata?.studyDate,
      seriesNumber: currentInstance.metadata?.seriesNumber,
      seriesDescription: currentInstance.metadata?.seriesDescription,
      modality: currentInstance.metadata?.modality,
      favoritedAt: Date.now(),
    }

    toggleFavorite(favoriteImage)
  }

  const handleAiDetection = async () => {
    if (!currentInstance || isDetecting) return

    // Cloud AI is desktop-only — never attempt a detection from the web build.
    if (!isTauri()) return

    try {
      // Use AI detector if enabled, otherwise use mock detector
      let detector: { detectVertebrae: typeof mockDetector.detectVertebrae } = mockDetector

      if (aiEnabled && aiProvider !== 'none') {
        const apiKey = getApiKeyForProvider(aiProvider, aiSettings)
        const aiDetector = await initDetector(aiProvider, apiKey)
        if (aiDetector && aiDetector.isConfigured()) {
          detector = aiDetector
        }
      }

      // The mock detector and the bundled local LLM both run locally (no
      // egress) — only confirm when a real cloud detector will send the image.
      const willEgress = detector !== mockDetector && aiProvider !== 'local'
      if (willEgress) {
        const confirmed = await confirmAiSend(PROVIDER_DISPLAY_NAMES[aiProvider] || aiProvider)
        if (!confirmed) return
      }

      setDetecting(true)

      // Provision the bundled local server (download model + start) on first use.
      if (aiProvider === 'local') {
        await ensureLocalServer(localModel, localPort, logLocalProgress)
      }

      deleteAnnotationsForInstance(currentInstance.sopInstanceUID, true)

      const result = await detector.detectVertebrae(currentInstance)
      addAnnotations(result.annotations)
      console.log(`AI detection: ${result.annotations.length} vertebrae detected in ${result.processingTimeMs.toFixed(0)}ms (confidence: ${(result.confidence * 100).toFixed(0)}%)`)
      setDetecting(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('AI detection failed:', error)
      setDetecting(false, errorMessage)
    }
  }

  const windowPresets = [
    { name: 'Soft Tissue', contrast: 400, brightness: 40 },
    { name: 'Lung', contrast: 1500, brightness: -600 },
    { name: 'Bone', contrast: 2500, brightness: 480 },
    { name: 'Brain', contrast: 80, brightness: 40 },
    { name: 'Liver', contrast: 150, brightness: 30 },
    { name: 'Abdomen', contrast: 350, brightness: 40 },
  ]

  const handlePresetClick = (brightness: number, contrast: number) => {
    setWindowLevel(brightness, contrast)
  }

  const handleAiAnalysis = async () => {
    if (!currentInstance || isAnalyzing) return

    // Check if there's already an analysis for this image
    const existingAnalysis = getAnalysisForInstance(currentInstance.sopInstanceUID)
    if (existingAnalysis) {
      // Show the existing analysis instead of generating a new one (no egress).
      showModal(existingAnalysis.id)
      return
    }

    // Cloud AI is desktop-only — radiology analysis always needs a cloud call.
    if (!isTauri()) return

    // Get current study UID
    const studyUID = currentStudy?.studyInstanceUID
    if (!studyUID) {
      console.error('No study loaded')
      return
    }

    // Require an AI provider to be configured
    if (!aiEnabled || aiProvider === 'none') {
      handleError(
        'Please enable and configure an AI provider in settings to use radiology analysis.',
        'AI Analysis',
        'warning'
      )
      return
    }

    // Cloud analysis sends the image off-device — confirm the egress (and
    // consent) first. The bundled local provider runs on loopback (zero egress).
    if (aiProvider !== 'local') {
      const confirmed = await confirmAiSend(PROVIDER_DISPLAY_NAMES[aiProvider] || aiProvider)
      if (!confirmed) return
    }

    try {
      setAnalyzing(true)

      // Provision the bundled local server (download model + start) on first use.
      if (aiProvider === 'local') {
        await ensureLocalServer(localModel, localPort, logLocalProgress)
      }

      // Dynamically load and initialize the AI detector
      const apiKey = getApiKeyForProvider(aiProvider, aiSettings)
      const analyzer = await initDetector(aiProvider, apiKey)

      if (!analyzer || !analyzer.isConfigured()) {
        const providerNames: Record<string, string> = {
          claude: 'Anthropic',
          gemini: 'Google AI',
          openai: 'OpenAI',
        }
        handleError(
          `Please configure your ${providerNames[aiProvider] || aiProvider} API key in settings.`,
          'AI Analysis',
          'warning'
        )
        setAnalyzing(false)
        return
      }

      const result = await analyzer.analyzeImage(currentInstance)
      // Add studyInstanceUID to the analysis
      addAnalysis({ ...result.analysis, studyInstanceUID: studyUID })
      console.log(`AI analysis: Generated in ${result.processingTimeMs.toFixed(0)}ms`)
      setAnalyzing(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('AI analysis failed:', error)
      setAnalyzing(false, errorMessage)
    }
  }

  /**
   * MR-precision segmentation (Phase 3): runs the on-demand local
   * TotalSegmentator-MRI engine over the current series and adds precise
   * vertebra markers across its slices. Desktop-only; needs a folder-loaded
   * study (the engine reads the DICOM files on disk).
   */
  const handleMrSegmentation = async () => {
    if (!currentInstance || isDetecting || isAnalyzing) return
    if (!isTauri()) return

    const folderPath = currentStudy?.folderPath
    const seriesUID = currentSeries?.seriesInstanceUID
    if (!folderPath || folderPath.startsWith('webkit:')) {
      handleError(
        'MR segmentation needs a study opened from a folder in the desktop app.',
        'MR Segmentation',
        'warning'
      )
      return
    }
    if (!seriesUID) {
      handleError('No series selected for MR segmentation.', 'MR Segmentation', 'warning')
      return
    }

    // Delegate to the global MR engine store: it gates first-run consent,
    // provisions the engine, runs segmentation, and drives the minimizable
    // progress UI — all in the background so the user can keep working. Markers
    // are added to the annotation store on completion.
    void useMrEngineStore.getState().requestSegmentation({
      seriesDir: folderPath,
      seriesUid: seriesUID,
      ctx: { seriesInstanceUID: seriesUID, modelVersion: 'totalsegmentator-mri' },
    })
  }


  const rowClass = `flex items-center gap-1 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border ${themeClasses.bg(theme)} ${themeClasses.border(theme)}`
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className={rowClass}>
      {/* Reset */}
      <ToolbarButton
        onClick={resetSettings}
        title="Reset all (R)"
        data-testid="reset-button"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
          </svg>
        }
      />

      <ToolbarDivider />

      {/* Fit to Screen */}
      <ToolbarButton
        onClick={handleFitToScreen}
        title="Fit to screen (F)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 01.75-.75h2.5a.75.75 0 000-1.5h-2.5zM13.25 2a.75.75 0 000 1.5h2.5a.75.75 0 01.75.75v2.5a.75.75 0 001.5 0v-2.5A2.25 2.25 0 0015.75 2h-2.5zM2 13.25a.75.75 0 011.5 0v2.5a.75.75 0 00.75.75h2.5a.75.75 0 010 1.5h-2.5A2.25 2.25 0 012 15.75v-2.5zM16.5 13.25a.75.75 0 011.5 0v2.5A2.25 2.25 0 0115.75 18h-2.5a.75.75 0 010-1.5h2.5a.75.75 0 00.75-.75v-2.5z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Zoom In */}
      <ToolbarButton
        onClick={handleZoomIn}
        title="Zoom in (+)"
        data-testid="zoom-in-button"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
            <path fillRule="evenodd" d="M2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm7-5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Zoom Out */}
      <ToolbarButton
        onClick={handleZoomOut}
        title="Zoom out (-)"
        data-testid="zoom-out-button"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.75 8.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
            <path fillRule="evenodd" d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z" clipRule="evenodd" />
          </svg>
        }
      />

      <ToolbarDivider />

      {/* Rotate Left */}
      <ToolbarButton
        onClick={handleRotateLeft}
        title="Rotate left ([)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Rotate Right */}
      <ToolbarButton
        onClick={handleRotateRight}
        title="Rotate right (])"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 scale-x-[-1]">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clipRule="evenodd" />
          </svg>
        }
      />

      <ToolbarDivider />

      {/* Flip Horizontal */}
      <ToolbarButton
        onClick={handleFlipHorizontal}
        active={settings.flipHorizontal}
        isToggle
        title="Flip horizontal (H)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Flip Vertical */}
      <ToolbarButton
        onClick={handleFlipVertical}
        active={settings.flipVertical}
        isToggle
        title="Flip vertical (V)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 rotate-90">
            <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Invert */}
      <ToolbarButton
        onClick={handleInvert}
        active={settings.invert}
        isToggle
        title="Invert colors (I)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
          </svg>
        }
      />

      <ToolbarDivider />

      {/* Measure & annotate — opens the tool sub-toolbar (see below). */}
      <ToolbarButton
        onClick={() => setShowMeasureTools((v) => !v)}
        active={showMeasureTools || measurementToolActive}
        isToggle
        disabled={!currentInstance}
        title="Measure & annotate (ruler, angle, ROI)"
        data-testid="measure-tools-toggle"
        icon={<Ruler className="w-4 h-4" />}
      />

      <ToolbarDivider />

      {/* Cine play/pause */}
      <ToolbarButton
        onClick={toggleCine}
        active={cineEnabled}
        disabled={!currentInstance}
        title={cineEnabled ? 'Pause cine (Space)' : 'Play cine (Space)'}
        data-testid="cine-toggle-button"
        icon={cineEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      />

      {/* Cine speed dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            title="Cine speed (frames per second)"
            disabled={!currentInstance}
            data-testid="cine-speed-button"
            className={`px-2 py-2 rounded text-xs font-mono transition-colors ${
              !currentInstance
                ? `${themeClasses.textTertiary(theme)} cursor-not-allowed`
                : cineEnabled
                ? `${themeClasses.text(theme)} ${themeClasses.hoverBgSecondary(theme)}`
                : `${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)} ${themeClasses.hoverText(theme)}`
            }`}
          >
            {cineFrameRate}fps
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className={`${menuContentClass} min-w-[120px]`}
          >
            <DropdownMenu.Label className={`px-2 pb-0.5 mb-0.5 border-b text-[11px] font-medium ${themeClasses.border(theme)} ${themeClasses.textSecondary(theme)}`}>
              Cine Speed
            </DropdownMenu.Label>
            {CINE_FPS_PRESETS.map((fps) => (
              <DropdownMenu.Item
                key={fps}
                onSelect={() => setCineFrameRate(fps)}
                className={`w-full cursor-pointer rounded px-2 py-1 text-left text-xs outline-none transition-colors ${menuItemHl} ${
                  cineFrameRate === fps ? themeClasses.text(theme) : themeClasses.textSecondary(theme)
                }`}
              >
                {fps} fps
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Window Presets Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            title="Window presets"
            aria-label="Window presets"
            disabled={!currentInstance}
            className={`p-2 rounded transition-colors ${
              !currentInstance
                ? `${themeClasses.textTertiary(theme)} cursor-not-allowed`
                : `${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)} ${themeClasses.hoverText(theme)}`
            }`}
          >
            <MonitorCog size={16} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className={`${menuContentClass} min-w-[180px]`}
          >
            <DropdownMenu.Label className={`px-2 pb-0.5 mb-0.5 border-b text-[11px] font-medium ${themeClasses.border(theme)} ${themeClasses.textSecondary(theme)}`}>
              Window Presets
            </DropdownMenu.Label>
            {windowPresets.map((preset) => (
              <DropdownMenu.Item
                key={preset.name}
                onSelect={() => handlePresetClick(preset.brightness, preset.contrast)}
                className={`w-full cursor-pointer px-2 py-1 text-left text-xs outline-none transition-colors ${themeClasses.text(theme)} ${menuItemHl}`}
              >
                <div className="font-medium">{preset.name}</div>
                <div className={`text-[11px] ${themeClasses.textSecondary(theme)}`}>C:{preset.contrast} B:{preset.brightness}</div>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className={`my-0.5 border-t ${themeClasses.border(theme)}`} />
            <DropdownMenu.Item
              onSelect={() => resetSettings()}
              className={`w-full cursor-pointer rounded px-2 py-1 text-[11px] font-medium outline-none transition-colors ${themeClasses.textSecondary(theme)} ${menuItemHl}`}
            >
              Reset to Default
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ToolbarDivider />

      {/* Favorite */}
      <Tooltip label={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}>
      <button
        onClick={handleToggleFavorite}
        aria-label={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
        // Native title fallback while disabled (Radix tooltip won't fire).
        title={!currentInstance ? (isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites') : undefined}
        aria-pressed={isCurrentFavorite}
        disabled={!currentInstance}
        data-testid="favorite-button"
        className={`p-2 rounded transition-colors ${
          !currentInstance
            ? `${themeClasses.textTertiary(theme)} cursor-not-allowed`
            : isCurrentFavorite
            ? `${themeClasses.text(theme)} ${themeClasses.hoverBgSecondary(theme)}`
            : `${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)} ${themeClasses.hoverText(theme)}`
        }`}
      >
        {isCurrentFavorite ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        )}
      </button>
      </Tooltip>

      {/* Export */}
      <ToolbarButton
        onClick={onExportClick || (() => {})}
        title="Export image (E)"
        disabled={!currentInstance}
        data-testid="export-button"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.25 2.25 0 004.25 17.5h11.5A2.25 2.25 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .414-.336.75-.75.75H4.25a.75.75 0 01-.75-.75v-2.5z" />
          </svg>
        }
      />

      {/* AI controls — desktop-only. Cloud vision (Claude/OpenAI/Gemini) sends
          DICOM pixels off-device, so the AI entry points are not rendered in
          the web build at all. */}
      {showAiControls && (
        <>
          <ToolbarDivider />

          {/* AI Vertebrae Detection */}
          <ToolbarButton
            onClick={handleAiDetection}
            title="AI vertebrae detection (M)"
            disabled={!currentInstance || isDetecting || isAnalyzing}
            data-testid="ai-detection-button"
            icon={<Target className="w-4 h-4" />}
          />

          {/* AI Radiology Analysis */}
          <ToolbarButton
            onClick={handleAiAnalysis}
            title={
              currentInstance && getAnalysisForInstance(currentInstance.sopInstanceUID)
                ? "View AI analysis (N)"
                : "AI radiology analysis (N)"
            }
            disabled={!currentInstance || isDetecting || isAnalyzing}
            data-testid="ai-analysis-button"
            icon={<FileText className="w-4 h-4" />}
          />

          {/* MR-precision segmentation — local TotalSegmentator-MRI (Phase 3).
              Gated until the engine is published (see MR_SEGMENTATION_AVAILABLE). */}
          <ToolbarButton
            onClick={handleMrSegmentation}
            title={
              MR_SEGMENTATION_AVAILABLE
                ? 'MR-precision vertebra segmentation (local, on-device)'
                : 'MR-precision segmentation — coming soon (engine not yet available)'
            }
            disabled={
              !MR_SEGMENTATION_AVAILABLE || !currentInstance || isDetecting || isAnalyzing
            }
            data-testid="mr-segmentation-button"
            icon={<ScanLine className="w-4 h-4" />}
          />

          {/* Per-send confirmation dialog (imperative, awaited by the handlers) */}
          <AiSendConfirmDialog />
        </>
      )}

      {/* Full-screen toggle — rightmost */}
      {onToggleFullscreen && (
        <>
          <ToolbarDivider />
          <ToolbarButton
            onClick={onToggleFullscreen}
            active={isFullscreen}
            title={isFullscreen ? 'Exit full screen (Shift+F)' : 'Full screen (Shift+F)'}
            data-testid="fullscreen-button"
            icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          />
        </>
      )}
      </div>

      {/* Reveal-able measurement / annotation sub-toolbar. */}
      {showMeasureTools && (
        <div className={rowClass} data-testid="measure-sub-toolbar">
          <ToolbarButton
            onClick={() => setActiveTool('Pointer')}
            active={activeTool === 'Pointer'}
            isToggle
            disabled={!currentInstance}
            title="Pointer — select, move and resize measurements"
            data-testid="pointer-tool-button"
            icon={<MousePointer2 className="w-4 h-4" />}
          />
          <ToolbarDivider />
          <ToolbarButton
            onClick={() => handleToggleTool('Length')}
            active={activeTool === 'Length'}
            isToggle
            disabled={!currentInstance}
            title="Distance measurement (L) — click again to deselect"
            data-testid="length-tool-button"
            icon={<Ruler className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('Angle')}
            active={activeTool === 'Angle'}
            isToggle
            disabled={!currentInstance}
            title="Angle measurement (Shift+A) — click again to deselect"
            data-testid="angle-tool-button"
            icon={<Triangle className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('CobbAngle')}
            active={activeTool === 'CobbAngle'}
            isToggle
            disabled={!currentInstance}
            title="Cobb angle (spine) — click again to deselect"
            data-testid="cobb-angle-button"
            icon={<Spline className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('EllipticalRoi')}
            active={activeTool === 'EllipticalRoi'}
            isToggle
            disabled={!currentInstance}
            title="Elliptical ROI — click again to deselect"
            data-testid="ellipse-roi-button"
            icon={<Circle className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('RectangleRoi')}
            active={activeTool === 'RectangleRoi'}
            isToggle
            disabled={!currentInstance}
            title="Rectangle ROI — click again to deselect"
            data-testid="rectangle-roi-button"
            icon={<Square className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('Probe')}
            active={activeTool === 'Probe'}
            isToggle
            disabled={!currentInstance}
            title="Probe — click to read the pixel/HU value — click again to deselect"
            data-testid="probe-button"
            icon={<Pipette className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => handleToggleTool('ArrowAnnotate')}
            active={activeTool === 'ArrowAnnotate'}
            isToggle
            disabled={!currentInstance}
            title="Arrow + label annotation — click again to deselect"
            data-testid="arrow-annotate-button"
            icon={<ArrowUpRight className="w-4 h-4" />}
          />
          <ToolbarDivider />
          <ToolbarButton
            onClick={() => setActiveTool('Eraser')}
            active={activeTool === 'Eraser'}
            isToggle
            disabled={!currentInstance}
            title="Eraser — click a measurement to delete it"
            data-testid="eraser-tool-button"
            icon={<Eraser className="w-4 h-4" />}
          />
        </div>
      )}
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  title: string
  icon: React.ReactNode
  active?: boolean
  disabled?: boolean
  /** When true, the button is a toggle and `active` is reflected via aria-pressed. */
  isToggle?: boolean
  'data-testid'?: string
}

function ToolbarButton({ onClick, title, icon, active = false, disabled = false, isToggle = false, 'data-testid': testId }: ToolbarButtonProps) {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <Tooltip label={title}>
      <button
        onClick={onClick}
        aria-label={title}
        // Radix tooltips don't fire on a disabled button (no pointer events),
        // so fall back to a native title tooltip while disabled.
        title={disabled ? title : undefined}
        aria-pressed={isToggle ? active : undefined}
        disabled={disabled}
        data-testid={testId}
        className={`p-2 rounded transition-colors ${
          disabled
            ? `${themeClasses.textTertiary(theme)} cursor-not-allowed`
            : active
            ? `${themeClasses.bgActive(theme)} ${themeClasses.text(theme)}`
            : `${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)} ${themeClasses.hoverText(theme)}`
        }`}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    </Tooltip>
  )
}

function ToolbarDivider() {
  const theme = useSettingsStore((s) => s.theme)
  return <div className={`w-px h-6 mx-1 ${themeClasses.divider(theme)}`} />
}
