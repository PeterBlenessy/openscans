import { useRecentStudiesStore, RecentStudyEntry } from '@/stores/recentStudiesStore'
import { useStudyStore } from '@/stores/studyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getCachedStudies } from '@/lib/storage/studyCache'
import { useLoadStudy } from '@/hooks/useLoadStudy'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { LeftDrawerIconBar } from './LeftDrawerIconBar'
import { themeClasses } from '@/lib/utils'

export type LeftDrawerState = 'expanded' | 'minimized' | 'hidden'

interface LeftDrawerProps {
  state: LeftDrawerState
  onLoadNewFiles: () => void
  onOpenSettings: () => void
  onOpenKeyboardShortcuts: () => void
  onOpenHelp: () => void
}

export function LeftDrawer({ state, onLoadNewFiles, onOpenSettings, onOpenKeyboardShortcuts, onOpenHelp }: LeftDrawerProps) {

  const recentStudies = useRecentStudiesStore((state) => state.recentStudies)
  const clearRecentStudies = useRecentStudiesStore((state) => state.clearRecentStudies)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const setCurrentStudy = useStudyStore((state) => state.setCurrentStudy)
  const setStudies = useStudyStore((state) => state.setStudies)
  const studies = useStudyStore((state) => state.studies)

  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const hidePersonalInfo = useSettingsStore((state) => state.hidePersonalInfo)

  const { loadStudy, isLoading } = useLoadStudy()
  const { handleError } = useErrorHandler()

  const handleStudyClick = async (entry: RecentStudyEntry) => {
    console.log(
      `[LeftDrawer] Clicked study: ${entry.studyInstanceUID}, current studies in store: ${studies.length}`
    )

    // Check if this study is already loaded
    const study = studies.find((s) => s.studyInstanceUID === entry.studyInstanceUID)
    if (study) {
      console.log(`[LeftDrawer] ⚡ Study already in store, switching instantly!`)
      setCurrentStudy(study.studyInstanceUID)
      return
    }

    console.log(`[LeftDrawer] Study not in store, need to reload`)

    // Check cache for instant load
    const cacheKey = entry.folderPath || entry.directoryHandleId
    if (cacheKey) {
      const cachedStudies = getCachedStudies(cacheKey)
      if (cachedStudies) {
        console.log(
          `[LeftDrawer] ⚡ Loading ${cachedStudies.length} studies from cache (instant!)`
        )
        setStudies(cachedStudies)

        // Find and set the current study
        const targetStudy = cachedStudies.find(
          (s) => s.studyInstanceUID === entry.studyInstanceUID
        )
        if (targetStudy) {
          setCurrentStudy(targetStudy.studyInstanceUID)
        } else {
          setCurrentStudy(cachedStudies[0].studyInstanceUID)
        }
        return
      }
    }

    // Not in cache - reload from disk/handle using hook
    await loadStudy(entry, {
      targetStudyUID: entry.studyInstanceUID,
      requestPermission: true,
      onError: (error) => {
        handleError(error, 'Study Loader', 'error')
      },
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Hidden state - render nothing
  if (state === 'hidden') {
    return <aside className="w-0" />
  }

  // Minimized state - render icon bar
  if (state === 'minimized') {
    return (
      <LeftDrawerIconBar
        onLoadNewFiles={onLoadNewFiles}
        onOpenSettings={onOpenSettings}
        onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
        onOpenHelp={onOpenHelp}
      />
    )
  }

  // Expanded state - render full drawer
  return (
    <aside className={`w-64 border-r flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'} ${themeClasses.border(theme)}`}>
      <>
        {/* Recent Studies */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium uppercase tracking-wider ${themeClasses.textSecondary(theme)}`}>
                Recent Studies
              </h3>
              {recentStudies.length > 0 && (
                <button
                  onClick={clearRecentStudies}
                  className={`text-xs transition-colors ${themeClasses.textTertiary(theme)} ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}
                  title="Clear all"
                >
                  Clear
                </button>
              )}
            </div>

            {recentStudies.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No recent studies</p>
            ) : (
              <ul className="space-y-2">
                {recentStudies.map((entry) => {
                  const isActive = currentStudy?.studyInstanceUID === entry.studyInstanceUID
                  const isLoaded = studies.some((s) => s.studyInstanceUID === entry.studyInstanceUID)
                  const canReload = !!entry.directoryHandleId || !!entry.folderPath
                  const isClickable = isLoaded || canReload

                  return (
                    <li key={entry.id}>
                      <button
                        onClick={() => handleStudyClick(entry)}
                        disabled={!isClickable || isLoading}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-[#2a2a2a] border border-[#3a3a3a]'
                              : 'bg-gray-200 border border-gray-300'
                            : isClickable
                            ? theme === 'dark'
                              ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-transparent'
                              : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            : theme === 'dark'
                            ? 'bg-[#1a1a1a]/50 border border-transparent opacity-50 cursor-not-allowed'
                            : 'bg-gray-50/50 border border-transparent opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {!hidePersonalInfo && (
                              <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {entry.patientName || 'Unknown Patient'}
                              </p>
                            )}
                            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {entry.studyDescription || 'No description'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.seriesCount} series, {entry.imageCount} images
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(entry.loadedAt)}
                            </span>
                            {!isLoaded && canReload && (
                              <span className="text-xs text-white">Click to reload</span>
                            )}
                            {!isLoaded && !canReload && (
                              <span className="text-xs text-yellow-500">Unavailable</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Section - Settings & Actions */}
        <div className={`border-t p-4 space-y-2 ${themeClasses.border(theme)}`}>
          {/* Load New Files */}
          <button
            onClick={onLoadNewFiles}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${themeClasses.bg(theme)} ${theme === 'dark' ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Load New Files</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${themeClasses.hoverBg(theme)}`}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${themeClasses.hoverBg(theme)}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Settings</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenKeyboardShortcuts}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${themeClasses.hoverBg(theme)}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <path d="M7 3.5C7 2.67 7.67 2 8.5 2h1C10.33 2 11 2.67 11 3.5v1c0 .83-.67 1.5-1.5 1.5h-1C7.67 6 7 5.33 7 4.5v-1zm6 0C13 2.67 13.67 2 14.5 2h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-1C13.67 6 13 5.33 13 4.5v-1zM7 9.5C7 8.67 7.67 8 8.5 8h1C10.33 8 11 8.67 11 9.5v1c0 .83-.67 1.5-1.5 1.5h-1C7.67 12 7 11.33 7 10.5v-1zm6 0C13 8.67 13.67 8 14.5 8h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-1zM2 15.5C2 14.67 2.67 14 3.5 14h17c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-17C2.67 18 2 17.33 2 16.5v-1zm5-6C7 8.67 7.67 8 8.5 8h7c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-7C7.67 12 7 11.33 7 10.5v-1z"/>
            </svg>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Keyboard Shortcuts</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${themeClasses.hoverBg(theme)}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Help & Documentation</span>
          </button>
        </div>
      </>
    </aside>
  )
}
