import { useState, useEffect, useRef } from 'react'
import { PanelLeft, PanelRight, PanelBottom, ShieldCheck, ShieldOff } from 'lucide-react'
import { FileDropzone } from './components/viewer/FileDropzone'
import { DicomViewport } from './components/viewer/DicomViewport'
import { StudySeriesBrowser } from './components/viewer/StudySeriesBrowser'
import { ThumbnailStrip } from './components/viewer/ThumbnailStrip'
import { KeyboardShortcutsHelp } from './components/viewer/KeyboardShortcutsHelp'
import { HelpDialog } from './components/help/HelpDialog'
import { FavoritesPanel } from './components/favorites/FavoritesPanel'
import { LeftDrawer, LeftDrawerState } from './components/layout/LeftDrawer'
import { ResizeHandle } from './components/layout/ResizeHandle'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { ErrorToast } from './components/ErrorToast'
import { useStudyStore } from './stores/studyStore'
import { useRecentStudiesStore } from './stores/recentStudiesStore'
import { useSettingsStore } from './stores/settingsStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useLoadStudy } from './hooks/useLoadStudy'
import { formatSeriesDescription } from './lib/utils/formatSeriesDescription'
import { getCachedStudies } from './lib/storage/studyCache'

function App() {
  // Force HMR update
  const [showDropzone, setShowDropzone] = useState(false) // Start false, will show after auto-load check
  const [isAutoLoading, setIsAutoLoading] = useState(true) // Show loading state initially
  const [showHelp, setShowHelp] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [hasProcessedStudies, setHasProcessedStudies] = useState(false)
  const hasAttemptedAutoLoadRef = useRef(false)

  // Panel visibility state
  const [leftDrawerState, setLeftDrawerState] = useState<LeftDrawerState>(() => {
    const saved = localStorage.getItem('leftDrawerState')
    return (saved as LeftDrawerState) || 'minimized'
  })
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [showThumbnailStrip, setShowThumbnailStrip] = useState(true)

  // Right sidebar width state
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('rightSidebarWidth')
    return saved ? parseInt(saved) : 256 // Default 256px (w-64)
  })

  const theme = useSettingsStore((state) => state.theme)
  const hidePersonalInfo = useSettingsStore((state) => state.hidePersonalInfo)
  const setHidePersonalInfo = useSettingsStore((state) => state.setHidePersonalInfo)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const studies = useStudyStore((state) => state.studies)
  const setStudies = useStudyStore((state) => state.setStudies)
  const setCurrentStudy = useStudyStore((state) => state.setCurrentStudy)
  const addRecentStudy = useRecentStudiesStore((state) => state.addRecentStudy)
  const recentStudies = useRecentStudiesStore((state) => state.recentStudies)

  const { loadStudy } = useLoadStudy()

  // Collapsible section state with localStorage persistence
  const [sectionState, setSectionState] = useState(() => {
    // Initialize from localStorage on first render
    const saved = localStorage.getItem('sidebarSections')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved sidebar state:', e)
      }
    }
    // Default values if nothing in localStorage
    return {
      studiesOpen: true,
      favoritesOpen: true
    }
  })

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarSections', JSON.stringify(sectionState))
  }, [sectionState])

  // Save left drawer state to localStorage
  useEffect(() => {
    localStorage.setItem('leftDrawerState', leftDrawerState)
  }, [leftDrawerState])

  // Save right sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString())
  }, [rightSidebarWidth])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onToggleHelp: () => setShowKeyboardShortcuts(!showKeyboardShortcuts),
    onToggleLeftDrawer: () => {
      // Cycle: expanded → minimized → hidden → expanded
      setLeftDrawerState((prev) => {
        if (prev === 'expanded') return 'minimized'
        if (prev === 'minimized') return 'hidden'
        return 'expanded'
      })
    }
  })

  const handleFilesLoaded = () => {
    setHasProcessedStudies(false) // Reset so we process the new studies
    setIsAutoLoading(false)
    setShowDropzone(false)
  }

  // Handle right sidebar resize
  const handleRightSidebarResize = (deltaX: number) => {
    setRightSidebarWidth((prev) => {
      const newWidth = prev + deltaX
      // Clamp to min (192px) and max (512px)
      return Math.max(192, Math.min(512, newWidth))
    })
  }

  // Auto-hide dropzone when studies are loaded (e.g., from recent studies reload)
  useEffect(() => {
    if (currentStudy) {
      setIsAutoLoading(false)
      setShowDropzone(false)
    }
  }, [currentStudy])

  // Track ALL studies in recent history when they're loaded
  useEffect(() => {
    // Only process studies once per load, and only if we have studies
    if (studies.length > 0 && !hasProcessedStudies) {
      // Add ALL studies to recent history with their own directoryHandleId or folderPath
      studies.forEach((study) => {
        const imageCount = study.series.reduce(
          (total, series) => total + series.instances.length,
          0
        )
        addRecentStudy({
          studyInstanceUID: study.studyInstanceUID,
          patientName: study.patientName || 'Unknown',
          patientID: study.patientID || '',
          studyDate: study.studyDate || '',
          studyDescription: study.studyDescription || '',
          seriesCount: study.series.length,
          imageCount,
          directoryHandleId: study.directoryHandleId, // Use the study's own directory handle (web mode)
          folderPath: study.folderPath, // Use the folder path (desktop mode)
        })
      })

      // Mark as processed so we don't add them again
      setHasProcessedStudies(true)
    }
  }, [studies, hasProcessedStudies, addRecentStudy])

  // Auto-load the most recent study on app startup
  useEffect(() => {
    // Only run once on mount (use ref to prevent double-execution in React Strict Mode)
    if (hasAttemptedAutoLoadRef.current) return
    hasAttemptedAutoLoadRef.current = true

    // If there's already a current study loaded, we're done
    if (currentStudy) {
      setIsAutoLoading(false)
      setShowDropzone(false)
      return
    }

    // Check if there are recent studies
    if (recentStudies.length === 0) {
      setIsAutoLoading(false)
      setShowDropzone(true)
      return
    }

    // Get the most recent study (first in the list)
    const mostRecent = recentStudies[0]
    const startTime = performance.now()

    // Load the study
    const loadMostRecentStudy = async () => {
      try {
        // Check cache first for fast initial load
        const cacheKey = mostRecent.folderPath || mostRecent.directoryHandleId
        if (cacheKey) {
          const cachedStudies = getCachedStudies(cacheKey)

          if (cachedStudies) {
            // Load only the target study first for fast initial display
            const targetStudy = cachedStudies.find(
              (s) => s.studyInstanceUID === mostRecent.studyInstanceUID
            )

            if (targetStudy) {
              // Set only the target study initially
              setStudies([targetStudy])
              setCurrentStudy(targetStudy.studyInstanceUID)
              setIsAutoLoading(false)
              setShowDropzone(false)
              console.log(
                `[App] ⚡ Loaded target study from cache in ${(performance.now() - startTime).toFixed(0)}ms`
              )

              // Load remaining studies in the background after a short delay
              if (cachedStudies.length > 1) {
                setTimeout(() => {
                  setStudies(cachedStudies)
                  console.log(
                    `[App] 📦 Background loaded ${cachedStudies.length - 1} additional studies`
                  )
                }, 100)
              }
              return
            } else {
              // Target study not found, load all studies
              setStudies(cachedStudies)
              setCurrentStudy(cachedStudies[0].studyInstanceUID)
              setIsAutoLoading(false)
              setShowDropzone(false)
              console.log(
                `[App] ⚡ Loaded all studies from cache in ${(performance.now() - startTime).toFixed(0)}ms`
              )
              return
            }
          }
        }

        // Not in cache - use hook to load from disk/handle
        const loadedStudies = await loadStudy(mostRecent, {
          targetStudyUID: mostRecent.studyInstanceUID,
          requestPermission: false, // Don't request permission on startup
          onSuccess: (studies) => {
            setIsAutoLoading(false)
            setShowDropzone(false)
            console.log(
              `[App] Loaded ${studies.length} studies in ${(performance.now() - startTime).toFixed(0)}ms`
            )
          },
          onError: (error) => {
            console.log(`[App] ${error.message}, showing dropzone`)
            setIsAutoLoading(false)
            setShowDropzone(true)
          },
        })

        if (!loadedStudies) {
          // Load failed (error already handled by onError callback)
          setIsAutoLoading(false)
          setShowDropzone(true)
        }
      } catch (error) {
        console.error('[App] Failed to auto-load most recent study:', error)
        setIsAutoLoading(false)
        setShowDropzone(true)
      }
    }

    loadMostRecentStudy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Settings Panel */}
      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp show={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />

      {/* Help Dialog */}
      <HelpDialog show={showHelp} onClose={() => setShowHelp(false)} />

      {/* Header */}
      <header className={`px-6 py-2.5 flex items-center justify-between border-b flex-shrink-0 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div>
          <h1 className="text-xl font-bold">OpenScans</h1>
          <p className={`text-xs mt-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Privacy-first DICOM viewer
          </p>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded ${theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
          {/* Left Panel Toggle */}
          <button
            onClick={() => {
              // Cycle: expanded → minimized → expanded (skip hidden for header toggle)
              setLeftDrawerState((prev) => prev === 'expanded' ? 'minimized' : 'expanded')
            }}
            className={`p-2 rounded transition-colors ${leftDrawerState === 'expanded' ? (theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-gray-300 text-gray-900') : (theme === 'dark' ? 'hover:bg-[#1a1a1a] text-gray-500' : 'hover:bg-gray-200 text-gray-400')}`}
            title="Toggle Left Panel"
          >
            <PanelLeft size={18} />
          </button>

          {/* Right Panel Toggle */}
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-2 rounded transition-colors ${showRightSidebar ? (theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-gray-300 text-gray-900') : (theme === 'dark' ? 'hover:bg-[#1a1a1a] text-gray-500' : 'hover:bg-gray-200 text-gray-400')}`}
            title="Toggle Right Panel"
          >
            <PanelRight size={18} />
          </button>

          {/* Bottom Panel Toggle */}
          <button
            onClick={() => setShowThumbnailStrip(!showThumbnailStrip)}
            className={`p-2 rounded transition-colors ${showThumbnailStrip ? (theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-gray-300 text-gray-900') : (theme === 'dark' ? 'hover:bg-[#1a1a1a] text-gray-500' : 'hover:bg-gray-200 text-gray-400')}`}
            title="Toggle Thumbnail Strip"
          >
            <PanelBottom size={18} />
          </button>

          {/* Divider */}
          <div className={`w-px h-6 ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}></div>

          {/* Privacy Toggle */}
          <button
            onClick={() => setHidePersonalInfo(!hidePersonalInfo)}
            className={`p-2 rounded transition-colors ${hidePersonalInfo ? (theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-gray-300 text-gray-900') : (theme === 'dark' ? 'hover:bg-[#1a1a1a] text-gray-500' : 'hover:bg-gray-200 text-gray-400')}`}
            title={hidePersonalInfo ? 'Show Personal Information' : 'Hide Personal Information'}
            data-testid="privacy-toggle"
          >
            {hidePersonalInfo ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
          </button>
        </div>
      </header>

      {/* Main Container - Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Drawer */}
        <LeftDrawer
          state={leftDrawerState}
          onLoadNewFiles={() => setShowDropzone(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
          onOpenHelp={() => setShowHelp(true)}
        />

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative">
          {isAutoLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-gray-400">Loading most recent study...</p>
              </div>
            </div>
          ) : showDropzone ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <FileDropzone
                className="w-full max-w-2xl"
                onFilesLoaded={handleFilesLoaded}
              />
            </div>
          ) : (
            <>
            {/* Viewer */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <DicomViewport className="flex-1 min-h-0" />

              {/* Image Slider */}
              {currentSeries && currentSeries.instances.length > 1 && (
                <div className={`px-6 py-3 border-t ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm min-w-fit ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {currentInstanceIndex + 1} / {currentSeries.instances.length}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={currentSeries.instances.length - 1}
                      value={currentInstanceIndex}
                      onChange={(e) => {
                        const newIndex = parseInt(e.target.value)
                        useStudyStore.getState().setCurrentInstance(newIndex)
                      }}
                      className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer slider ${theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-200'}`}
                      data-testid="instance-slider"
                      style={{
                        background: theme === 'dark'
                          ? `linear-gradient(to right, #4a4a4a 0%, #4a4a4a ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #0f0f0f ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #0f0f0f 100%)`
                          : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #e5e7eb ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Thumbnail Navigation */}
              {showThumbnailStrip && <ThumbnailStrip />}
            </div>

            {/* Sidebar */}
            <aside
              className={`flex overflow-hidden border-l transition-all duration-300 ease-in-out flex-shrink-0 ${
                showRightSidebar ? '' : 'w-0 border-l-0'
              } ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
              style={showRightSidebar ? { width: `${rightSidebarWidth}px` } : undefined}
            >
              {showRightSidebar && (
                <>
                {/* Resize Handle */}
                <ResizeHandle
                  onResize={handleRightSidebarResize}
                  side="right"
                  theme={theme}
                />

                {/* Sidebar Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
              {/* Study/Series Browser - Collapsible, Persistent */}
              <div className={`border-b ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setSectionState((prev: typeof sectionState) => ({ ...prev, studiesOpen: !prev.studiesOpen }))}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${theme === 'dark' ? 'hover:bg-[#0f0f0f]' : 'hover:bg-gray-50'}`}
                >
                  <h2 className="text-lg font-semibold">Studies & Series</h2>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{sectionState.studiesOpen ? '▼' : '▶'}</span>
                </button>
                {sectionState.studiesOpen && (
                  <div className="px-4 pb-4">
                    <div className="max-h-64 overflow-y-auto">
                      <StudySeriesBrowser />
                    </div>
                  </div>
                )}
              </div>

              {/* Key Images - Collapsible, Persistent (includes favorites and AI-analyzed images) */}
              {/* Suggested names: "Key Images" (medical standard), "Marked Images", "Selections", "Important Images" */}
              <div className={`border-b ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setSectionState((prev: typeof sectionState) => ({ ...prev, favoritesOpen: !prev.favoritesOpen }))}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${theme === 'dark' ? 'hover:bg-[#0f0f0f]' : 'hover:bg-gray-50'}`}
                >
                  <h2 className="text-lg font-semibold">Key Images</h2>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{sectionState.favoritesOpen ? '▼' : '▶'}</span>
                </button>
                {sectionState.favoritesOpen && (
                  <div className="px-4 pb-4">
                    <FavoritesPanel />
                  </div>
                )}
              </div>
                </div>
                </>
              )}
            </aside>
          </>
        )}
        </main>
      </div>

      {/* Error Toast Notifications */}
      <ErrorToast />
    </div>
  )
}

export default App
