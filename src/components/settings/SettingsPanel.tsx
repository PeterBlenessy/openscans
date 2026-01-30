import { useEffect, useState } from 'react'
import { useSettingsStore, Theme, ScrollDirection, AIProvider } from '@/stores/settingsStore'

interface SettingsPanelProps {
  show: boolean
  onClose: () => void
}

export function SettingsPanel({ show, onClose }: SettingsPanelProps) {
  const theme = useSettingsStore((state) => state.theme)
  const scrollDirection = useSettingsStore((state) => state.scrollDirection)
  const windowLevelSensitivity = useSettingsStore((state) => state.windowLevelSensitivity)
  const zoomSensitivity = useSettingsStore((state) => state.zoomSensitivity)
  const hidePersonalInfo = useSettingsStore((state) => state.hidePersonalInfo)
  const persistStudies = useSettingsStore((state) => state.persistStudies)
  const aiEnabled = useSettingsStore((state) => state.aiEnabled)
  const aiProvider = useSettingsStore((state) => state.aiProvider)
  const aiApiKey = useSettingsStore((state) => state.aiApiKey)
  const geminiApiKey = useSettingsStore((state) => state.geminiApiKey)
  const aiConsentGiven = useSettingsStore((state) => state.aiConsentGiven)

  const setTheme = useSettingsStore((state) => state.setTheme)
  const setScrollDirection = useSettingsStore((state) => state.setScrollDirection)
  const setWindowLevelSensitivity = useSettingsStore((state) => state.setWindowLevelSensitivity)
  const setZoomSensitivity = useSettingsStore((state) => state.setZoomSensitivity)
  const setHidePersonalInfo = useSettingsStore((state) => state.setHidePersonalInfo)
  const setPersistStudies = useSettingsStore((state) => state.setPersistStudies)
  const setAiEnabled = useSettingsStore((state) => state.setAiEnabled)
  const setAiProvider = useSettingsStore((state) => state.setAiProvider)
  const setAiApiKey = useSettingsStore((state) => state.setAiApiKey)
  const setGeminiApiKey = useSettingsStore((state) => state.setGeminiApiKey)
  const setAiConsentGiven = useSettingsStore((state) => state.setAiConsentGiven)
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults)

  const [showApiKey, setShowApiKey] = useState(false)

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
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white focus:ring-[#3a3a3a]' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-gray-400'}`}
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
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white focus:ring-[#3a3a3a]' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-gray-400'}`}
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

          {/* Privacy Section */}
          <SettingsSection title="Privacy" isDark={isDark}>
            <SettingsRow label="Hide Personal Information" description="Hide patient names and IDs throughout the app" isDark={isDark}>
              <ToggleSwitch
                checked={hidePersonalInfo}
                onChange={setHidePersonalInfo}
                isDark={isDark}
              />
            </SettingsRow>

            {/* Privacy Information */}
            <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-[#0f0f0f] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
              <p className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                HIPAA-Compliant Privacy
              </p>
              <ul className="space-y-1 text-gray-500">
                <li>• All processing happens locally in your browser</li>
                <li>• No patient data is sent to external servers</li>
                <li>• Console logs contain zero patient information</li>
                <li>• Exported files exclude patient data by default</li>
              </ul>
            </div>
          </SettingsSection>

          {/* AI Detection Section */}
          <SettingsSection title="AI Detection" isDark={isDark}>
            <SettingsRow label="Enable AI Detection" description="Use AI vision models for vertebrae detection" isDark={isDark}>
              <ToggleSwitch
                checked={aiEnabled}
                onChange={(enabled) => {
                  if (enabled && !aiConsentGiven) {
                    // Show consent prompt
                    const consent = confirm(
                      'AI Detection Privacy Notice:\n\n' +
                      'When enabled, DICOM images will be sent to external AI services (Claude or Gemini API) for analysis. ' +
                      'Images are sent without patient metadata, but the pixel data itself leaves your device.\n\n' +
                      'This is NOT HIPAA-compliant by default. Only use with de-identified images or in non-clinical settings.\n\n' +
                      'Do you consent to sending image data to external AI services?'
                    )
                    if (consent) {
                      setAiConsentGiven(true)
                      setAiEnabled(true)
                    }
                  } else {
                    setAiEnabled(enabled)
                  }
                }}
                isDark={isDark}
              />
            </SettingsRow>

            {aiEnabled && (
              <>
                <SettingsRow label="AI Provider" description="Which AI service to use" isDark={isDark}>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white focus:ring-[#3a3a3a]' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-gray-400'}`}
                  >
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini (Google)</option>
                    <option value="openai">OpenAI (Coming Soon)</option>
                    <option value="none">None (Mock Only)</option>
                  </select>
                </SettingsRow>

                {aiProvider === 'claude' && (
                  <SettingsRow label="API Key" description="Your Anthropic API key" isDark={isDark}>
                    <div className="flex gap-2 items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white focus:ring-[#3a3a3a] placeholder-gray-600' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-gray-400 placeholder-gray-400'}`}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          {showApiKey ? (
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          ) : (
                            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </SettingsRow>
                )}

                {aiProvider === 'gemini' && (
                  <SettingsRow label="API Key" description="Your Google AI API key" isDark={isDark}>
                    <div className="flex gap-2 items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIza..."
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white focus:ring-[#3a3a3a] placeholder-gray-600' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-gray-400 placeholder-gray-400'}`}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          {showApiKey ? (
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          ) : (
                            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </SettingsRow>
                )}

                {/* AI Information */}
                <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-[#0f0f0f] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    ⚠️ Privacy & Security Notice
                  </p>
                  <ul className="space-y-1 text-gray-500">
                    <li>• Image pixel data is sent to external AI services</li>
                    <li>• Patient metadata (names, IDs) is stripped before sending</li>
                    <li>• Cost: ~$0.004-0.01 per image analyzed</li>
                    <li>• API keys are stored locally (not encrypted)</li>
                    <li>• For production use, implement secure backend proxy</li>
                  </ul>
                </div>
              </>
            )}
          </SettingsSection>

          {/* Data Section */}
          <SettingsSection title="Data Management" isDark={isDark}>
            <SettingsRow label="Persist Studies" description="Remember recently opened studies and reload them after refresh" isDark={isDark}>
              <ToggleSwitch
                checked={persistStudies}
                onChange={setPersistStudies}
                isDark={isDark}
              />
            </SettingsRow>

            {/* Clear AI Data Button */}
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Clear AI Data
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Remove all stored AI analyses and annotations from localStorage
              </p>
              <button
                onClick={() => {
                  if (confirm('Clear all stored AI analyses and annotations? This cannot be undone.')) {
                    localStorage.removeItem('openscans-ai-analyses')
                    localStorage.removeItem('openscans-annotations')
                    // Reload page to clear in-memory state
                    window.location.reload()
                  }
                }}
                className={`px-3 py-2 text-sm rounded transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                Clear All AI Data
              </button>
            </div>
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
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a]' : 'bg-gray-700 hover:bg-gray-800'}`}
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
        checked
          ? isDark ? 'bg-[#4a4a4a]' : 'bg-gray-600'
          : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'
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
