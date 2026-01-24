import { useEffect } from 'react'
import { useSettingsStore, Theme, ScrollDirection } from '@/stores/settingsStore'

interface SettingsPanelProps {
  show: boolean
  onClose: () => void
}

export function SettingsPanel({ show, onClose }: SettingsPanelProps) {
  const theme = useSettingsStore((state) => state.theme)
  const scrollDirection = useSettingsStore((state) => state.scrollDirection)
  const windowLevelSensitivity = useSettingsStore((state) => state.windowLevelSensitivity)
  const zoomSensitivity = useSettingsStore((state) => state.zoomSensitivity)
  const showMetadataOverlay = useSettingsStore((state) => state.showMetadataOverlay)
  const persistStudies = useSettingsStore((state) => state.persistStudies)

  const setTheme = useSettingsStore((state) => state.setTheme)
  const setScrollDirection = useSettingsStore((state) => state.setScrollDirection)
  const setWindowLevelSensitivity = useSettingsStore((state) => state.setWindowLevelSensitivity)
  const setZoomSensitivity = useSettingsStore((state) => state.setZoomSensitivity)
  const setShowMetadataOverlay = useSettingsStore((state) => state.setShowMetadataOverlay)
  const setPersistStudies = useSettingsStore((state) => state.setPersistStudies)
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults)

  // Close on Escape key
  useEffect(() => {
    if (!show) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [show, onClose])

  if (!show) return null

  const isDark = theme === 'dark'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
          {/* Appearance Section */}
          <SettingsSection title="Appearance" isDark={isDark}>
            <SettingsRow label="Theme" description="Choose between dark and light mode" isDark={isDark}>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </SettingsRow>
          </SettingsSection>

          {/* Viewport Behavior Section */}
          <SettingsSection title="Viewport Behavior" isDark={isDark}>
            <SettingsRow label="Scroll Direction" description="Mouse wheel scroll behavior for image navigation" isDark={isDark}>
              <select
                value={scrollDirection}
                onChange={(e) => setScrollDirection(e.target.value as ScrollDirection)}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
              >
                <option value="natural">Natural (scroll up = next)</option>
                <option value="inverted">Inverted (scroll up = previous)</option>
              </select>
            </SettingsRow>

            <SettingsRow label="Window/Level Sensitivity" description={`Current: ${windowLevelSensitivity.toFixed(1)}x`} isDark={isDark}>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={windowLevelSensitivity}
                onChange={(e) => setWindowLevelSensitivity(parseFloat(e.target.value))}
                className={`w-32 h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-200'}`}
              />
            </SettingsRow>

            <SettingsRow label="Zoom Sensitivity" description={`Current: ${(zoomSensitivity * 100).toFixed(0)}%`} isDark={isDark}>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.01"
                value={zoomSensitivity}
                onChange={(e) => setZoomSensitivity(parseFloat(e.target.value))}
                className={`w-32 h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-200'}`}
              />
            </SettingsRow>
          </SettingsSection>

          {/* Display Section */}
          <SettingsSection title="Display" isDark={isDark}>
            <SettingsRow label="Metadata Overlay" description="Show DICOM metadata on viewport corners" isDark={isDark}>
              <ToggleSwitch
                checked={showMetadataOverlay}
                onChange={setShowMetadataOverlay}
                isDark={isDark}
              />
            </SettingsRow>
          </SettingsSection>

          {/* Data Section */}
          <SettingsSection title="Data" isDark={isDark}>
            <SettingsRow label="Persist Studies" description="Remember recently opened studies and reload them after refresh" isDark={isDark}>
              <ToggleSwitch
                checked={persistStudies}
                onChange={setPersistStudies}
                isDark={isDark}
              />
            </SettingsRow>
          </SettingsSection>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <button
            onClick={resetToDefaults}
            className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  isDark: boolean
}

function SettingsSection({ title, children, isDark }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
  isDark: boolean
}

function SettingsRow({ label, description, children, isDark }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  isDark: boolean
}

function ToggleSwitch({ checked, onChange, isDark }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
