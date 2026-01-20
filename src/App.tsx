import { useState, useEffect } from 'react'
import { FileDropzone } from './components/viewer/FileDropzone'
import { DicomViewport } from './components/viewer/DicomViewport'
import { StudySeriesBrowser } from './components/viewer/StudySeriesBrowser'
import { ThumbnailStrip } from './components/viewer/ThumbnailStrip'
import { KeyboardShortcutsHelp } from './components/viewer/KeyboardShortcutsHelp'
import { ImagePresets } from './components/viewer/ImagePresets'
import { LeftDrawer } from './components/layout/LeftDrawer'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useStudyStore } from './stores/studyStore'
import { useRecentStudiesStore } from './stores/recentStudiesStore'
import { useSettingsStore } from './stores/settingsStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  // Force HMR update
  const [showDropzone, setShowDropzone] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const addRecentStudy = useRecentStudiesStore((state) => state.addRecentStudy)

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
      presetsOpen: false,
      metadataOpen: true
    }
  })

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarSections', JSON.stringify(sectionState))
  }, [sectionState])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp(!showHelp) })

  const handleFilesLoaded = () => {
    setShowDropzone(false)
  }

  // Track studies in recent history when they're loaded
  useEffect(() => {
    if (currentStudy) {
      const imageCount = currentStudy.series.reduce(
        (total, series) => total + series.instances.length,
        0
      )
      addRecentStudy({
        studyInstanceUID: currentStudy.studyInstanceUID,
        patientName: currentStudy.patientName || 'Unknown',
        patientID: currentStudy.patientID || '',
        studyDate: currentStudy.studyDate || '',
        studyDescription: currentStudy.studyDescription || '',
        seriesCount: currentStudy.series.length,
        imageCount,
      })
    }
  }, [currentStudy?.studyInstanceUID])

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Left Drawer */}
      <LeftDrawer
        onLoadNewFiles={() => setShowDropzone(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Settings Panel */}
      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp show={showHelp} onClose={() => setShowHelp(false)} />

      {/* Header */}
      <header className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div>
          <h1 className="text-2xl font-bold">MR DICOM Viewer</h1>
          {currentSeries && (
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentSeries.seriesDescription || `Series ${currentSeries.seriesNumber}`} -
              Image {currentInstanceIndex + 1} of {currentSeries.instances.length}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#0f0f0f] hover:bg-[#1a1a1a]' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Keyboard shortcuts"
        >
          <span>?</span>
          <span>Help</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {showDropzone ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <FileDropzone
              className="w-full max-w-2xl"
              onFilesLoaded={handleFilesLoaded}
            />
          </div>
        ) : (
          <>
            {/* Viewer */}
            <div className="flex-1 flex flex-col min-w-0">
              <DicomViewport className="flex-1" />

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
              <ThumbnailStrip />
            </div>

            {/* Sidebar */}
            <aside className={`w-80 flex flex-col overflow-hidden border-l ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
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

              {/* Image Presets - Collapsible, Persistent */}
              <div className={`border-b ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setSectionState((prev: typeof sectionState) => ({ ...prev, presetsOpen: !prev.presetsOpen }))}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${theme === 'dark' ? 'hover:bg-[#0f0f0f]' : 'hover:bg-gray-50'}`}
                >
                  <h2 className="text-lg font-semibold">Image Presets</h2>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{sectionState.presetsOpen ? '▼' : '▶'}</span>
                </button>
                {sectionState.presetsOpen && (
                  <div className="px-4 pb-4">
                    <ImagePresets />
                  </div>
                )}
              </div>

              {/* Current Metadata - Collapsible, Persistent */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <button
                  onClick={() => setSectionState((prev: typeof sectionState) => ({ ...prev, metadataOpen: !prev.metadataOpen }))}
                  className={`w-full p-4 flex items-center justify-between transition-colors flex-shrink-0 ${theme === 'dark' ? 'hover:bg-[#0f0f0f]' : 'hover:bg-gray-50'}`}
                >
                  <h2 className="text-lg font-semibold">Current Image</h2>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{sectionState.metadataOpen ? '▼' : '▶'}</span>
                </button>
                {sectionState.metadataOpen && (
                  <div className="px-4 pb-4 flex-1 overflow-y-auto">
                    {currentInstance?.metadata && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Patient Name:</span>
                          <p>{currentInstance.metadata.patientName}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Patient ID:</span>
                          <p>{currentInstance.metadata.patientID}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Study Date:</span>
                          <p>{currentInstance.metadata.studyDate}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Series:</span>
                          <p>{currentInstance.metadata.seriesDescription}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Instance:</span>
                          <p>{currentInstance.instanceNumber}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Brightness:</span>
                          <p>{currentInstance.metadata.windowCenter}</p>
                        </div>
                        <div>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Contrast:</span>
                          <p>{currentInstance.metadata.windowWidth}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Load New Files Button */}
              <div className={`p-4 border-t flex-shrink-0 ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowDropzone(true)}
                  className={`w-full px-4 py-2 rounded transition-colors ${theme === 'dark' ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a]' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Load New Files
                </button>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  )
}

export default App
