import { useState, useRef, useEffect } from 'react'
import { MonitorCog, Target, FileText } from 'lucide-react'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { useFavoritesStore, FavoriteImage } from '@/stores/favoritesStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useAiAnalysisStore } from '@/stores/aiAnalysisStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { mockDetector } from '@/lib/ai/mockVertebralDetector'
import { initDetector, getApiKeyForProvider } from '@/lib/ai/aiDetectorManager'
import { uiColors } from '@/lib/colors'

interface ViewportToolbarProps {
  className?: string
  onExportClick?: () => void
}

export function ViewportToolbar({ className = '', onExportClick }: ViewportToolbarProps) {
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

  const [showPresets, setShowPresets] = useState(false)
  const presetsRef = useRef<HTMLDivElement>(null)
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

  // AI settings
  const aiEnabled = useSettingsStore((state) => state.aiEnabled)
  const aiProvider = useSettingsStore((state) => state.aiProvider)
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

    try {
      setDetecting(true)
      deleteAnnotationsForInstance(currentInstance.sopInstanceUID, true)

      // Use AI detector if enabled, otherwise use mock detector
      let detector: { detectVertebrae: typeof mockDetector.detectVertebrae } = mockDetector

      if (aiEnabled && aiProvider !== 'none') {
        const apiKey = getApiKeyForProvider(aiProvider, aiSettings)
        const aiDetector = await initDetector(aiProvider, apiKey)
        if (aiDetector && aiDetector.isConfigured()) {
          detector = aiDetector
        }
      }

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

  // Close presets dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(event.target as Node)) {
        setShowPresets(false)
      }
    }

    if (showPresets) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPresets])

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
    setShowPresets(false)
  }

  const handleAiAnalysis = async () => {
    if (!currentInstance || isAnalyzing) return

    // Check if there's already an analysis for this image
    const existingAnalysis = getAnalysisForInstance(currentInstance.sopInstanceUID)
    if (existingAnalysis) {
      // Show the existing analysis instead of generating a new one
      showModal(existingAnalysis.id)
      return
    }

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

    try {
      setAnalyzing(true)

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


  return (
    <div className={`flex items-center gap-1 bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-[#2a2a2a] ${className}`}>
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
        title="Invert colors (I)"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
          </svg>
        }
      />

      {/* Window Presets Dropdown */}
      <div className="relative" ref={presetsRef}>
        <button
          onClick={() => setShowPresets(!showPresets)}
          title="Window presets"
          disabled={!currentInstance}
          className={`p-2 rounded transition-colors ${
            !currentInstance
              ? 'text-gray-600 cursor-not-allowed'
              : showPresets
              ? 'text-white hover:bg-[#2a2a2a]'
              : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
          }`}
        >
          <MonitorCog size={16} />
        </button>
        {showPresets && (
          <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
            <div className="px-2 pb-0.5 mb-0.5 border-b border-[#2a2a2a]">
              <p className="text-[11px] font-medium text-gray-400">Window Presets</p>
            </div>
            {windowPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.brightness, preset.contrast)}
                className="w-full px-2 py-1 text-left text-xs text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-[11px] text-gray-500">C:{preset.contrast} B:{preset.brightness}</div>
              </button>
            ))}
            <div className="border-t border-[#2a2a2a] mt-0.5 pt-0.5 px-2">
              <button
                onClick={() => {
                  resetSettings()
                  setShowPresets(false)
                }}
                className="w-full px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Favorite */}
      <button
        onClick={handleToggleFavorite}
        title={isCurrentFavorite ? "Remove from favorites" : "Add to favorites"}
        disabled={!currentInstance}
        data-testid="favorite-button"
        className={`p-2 rounded transition-colors ${
          !currentInstance
            ? 'text-gray-600 cursor-not-allowed'
            : isCurrentFavorite
            ? 'text-white hover:bg-[#2a2a2a]'
            : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
        }`}
      >
        {isCurrentFavorite ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        )}
      </button>

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

      <ToolbarDivider />

      {/* AI Vertebrae Detection */}
      <ToolbarButton
        onClick={handleAiDetection}
        title={isDetecting ? "Detecting..." : "AI vertebrae detection (M)"}
        disabled={!currentInstance || isDetecting || isAnalyzing}
        active={isDetecting}
        data-testid="ai-detection-button"
        icon={
          isDetecting ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 animate-spin">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clipRule="evenodd" />
            </svg>
          ) : (
            <Target className="w-4 h-4" />
          )
        }
      />

      {/* AI Radiology Analysis */}
      <ToolbarButton
        onClick={handleAiAnalysis}
        title={
          isAnalyzing
            ? "Analyzing..."
            : currentInstance && getAnalysisForInstance(currentInstance.sopInstanceUID)
            ? "View AI analysis (N)"
            : "AI radiology analysis (N)"
        }
        disabled={!currentInstance || isDetecting || isAnalyzing}
        active={isAnalyzing}
        data-testid="ai-analysis-button"
        icon={
          isAnalyzing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 animate-spin">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clipRule="evenodd" />
            </svg>
          ) : (
            <FileText className="w-4 h-4" />
          )
        }
      />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  title: string
  icon: React.ReactNode
  active?: boolean
  disabled?: boolean
  'data-testid'?: string
}

function ToolbarButton({ onClick, title, icon, active = false, disabled = false, 'data-testid': testId }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-testid={testId}
      className={`p-2 rounded transition-colors ${
        disabled
          ? 'text-gray-600 cursor-not-allowed'
          : active
          ? 'text-white hover:bg-[#2a2a2a]'
          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
      }`}
    >
      {icon}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-[#3a3a3a] mx-1" />
}
