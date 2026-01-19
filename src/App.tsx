import { useState } from 'react'
import { FileDropzone } from './components/viewer/FileDropzone'
import { DicomViewport } from './components/viewer/DicomViewport'
import { StudySeriesBrowser } from './components/viewer/StudySeriesBrowser'
import { ThumbnailStrip } from './components/viewer/ThumbnailStrip'
import { KeyboardShortcutsHelp } from './components/viewer/KeyboardShortcutsHelp'
import { useStudyStore } from './stores/studyStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const [showDropzone, setShowDropzone] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const { nextInstance, previousInstance } = useStudyStore()

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp(!showHelp) })

  const handleFilesLoaded = () => {
    setShowDropzone(false)
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp show={showHelp} onClose={() => setShowHelp(false)} />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MR DICOM Viewer</h1>
          {currentSeries && (
            <p className="text-sm text-gray-400 mt-1">
              {currentSeries.seriesDescription || `Series ${currentSeries.seriesNumber}`} -
              Image {currentInstanceIndex + 1} of {currentSeries.instances.length}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
          title="Keyboard shortcuts"
        >
          <span>?</span>
          <span>Help</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
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
                <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 min-w-fit">
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
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #374151 ${(currentInstanceIndex / (currentSeries.instances.length - 1)) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Thumbnail Navigation */}
              <ThumbnailStrip />
            </div>

            {/* Sidebar */}
            <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
              {/* Study/Series Browser */}
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold mb-3">Studies & Series</h2>
                <div className="max-h-64 overflow-y-auto">
                  <StudySeriesBrowser />
                </div>
              </div>

              {/* Current Metadata */}
              <div className="p-4 flex-1 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-3">Current Image</h2>
                {currentInstance?.metadata && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Patient Name:</span>
                      <p className="text-white">{currentInstance.metadata.patientName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Patient ID:</span>
                      <p className="text-white">{currentInstance.metadata.patientID}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Study Date:</span>
                      <p className="text-white">{currentInstance.metadata.studyDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Series:</span>
                      <p className="text-white">{currentInstance.metadata.seriesDescription}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Instance:</span>
                      <p className="text-white">{currentInstance.instanceNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Window Center:</span>
                      <p className="text-white">{currentInstance.metadata.windowCenter}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Window Width:</span>
                      <p className="text-white">{currentInstance.metadata.windowWidth}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Load New Files Button */}
              <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setShowDropzone(true)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
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
