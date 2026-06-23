import { useSettingsStore } from '@/stores/settingsStore'
import { Tooltip } from '@/components/ui'

interface LeftDrawerIconBarProps {
  onLoadNewFiles: () => void
  onOpenSettings: () => void
  onOpenKeyboardShortcuts: () => void
  onOpenHelp: () => void
}

/**
 * Icon bar for the left drawer minimized state.
 * Shows key actions as vertical icon buttons with tooltips.
 */
export function LeftDrawerIconBar({
  onLoadNewFiles,
  onOpenSettings,
  onOpenKeyboardShortcuts,
  onOpenHelp,
}: LeftDrawerIconBarProps) {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)

  const iconButtons = [
    {
      id: 'load-files',
      label: 'Load New Files',
      onClick: onLoadNewFiles,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
      ),
    },
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      icon: theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: onOpenSettings,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      onClick: onOpenKeyboardShortcuts,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M7 3.5C7 2.67 7.67 2 8.5 2h1C10.33 2 11 2.67 11 3.5v1c0 .83-.67 1.5-1.5 1.5h-1C7.67 6 7 5.33 7 4.5v-1zm6 0C13 2.67 13.67 2 14.5 2h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-1C13.67 6 13 5.33 13 4.5v-1zM7 9.5C7 8.67 7.67 8 8.5 8h1C10.33 8 11 8.67 11 9.5v1c0 .83-.67 1.5-1.5 1.5h-1C7.67 12 7 11.33 7 10.5v-1zm6 0C13 8.67 13.67 8 14.5 8h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-1zM2 15.5C2 14.67 2.67 14 3.5 14h17c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-17C2.67 18 2 17.33 2 16.5v-1zm5-6C7 8.67 7.67 8 8.5 8h7c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5h-7C7.67 12 7 11.33 7 10.5v-1z"/>
        </svg>
      ),
    },
    {
      id: 'help',
      label: 'Help & Documentation',
      onClick: onOpenHelp,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  return (
    <aside
      className={`w-12 border-r flex flex-col flex-shrink-0 ${
        theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-gray-200'
      }`}
    >
      {/* Icon Buttons */}
      <div className="flex flex-col gap-2 p-2">
        {iconButtons.map((button) => (
          <Tooltip key={button.id} label={button.label} side="right">
            <button
              onClick={button.onClick}
              className={`w-full h-11 flex items-center justify-center rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
              aria-label={button.label}
            >
              {button.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </aside>
  )
}
