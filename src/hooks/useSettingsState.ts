import { useSettingsStore } from '../stores/settingsStore'

/**
 * Custom hook to access all settings state and actions from the settings store.
 * Eliminates the need for 28+ individual useSettingsStore selector calls.
 *
 * @returns Object containing all settings values and setter functions
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const settings = useSettingsState()
 *
 *   return (
 *     <select value={settings.theme} onChange={(e) => settings.setTheme(e.target.value)}>
 *       <option value="dark">Dark</option>
 *       <option value="light">Light</option>
 *     </select>
 *   )
 * }
 * ```
 */
export function useSettingsState() {
  // Extract all state values
  const theme = useSettingsStore((state) => state.theme)
  const themePreference = useSettingsStore((state) => state.themePreference)
  const scrollDirection = useSettingsStore((state) => state.scrollDirection)
  const windowLevelSensitivity = useSettingsStore((state) => state.windowLevelSensitivity)
  const zoomSensitivity = useSettingsStore((state) => state.zoomSensitivity)
  const toolColor = useSettingsStore((state) => state.toolColor)
  const hidePersonalInfo = useSettingsStore((state) => state.hidePersonalInfo)
  const persistStudies = useSettingsStore((state) => state.persistStudies)
  const aiEnabled = useSettingsStore((state) => state.aiEnabled)
  const aiProvider = useSettingsStore((state) => state.aiProvider)
  const aiApiKey = useSettingsStore((state) => state.aiApiKey)
  const geminiApiKey = useSettingsStore((state) => state.geminiApiKey)
  const openaiApiKey = useSettingsStore((state) => state.openaiApiKey)
  const aiConsentGiven = useSettingsStore((state) => state.aiConsentGiven)
  const aiResponseLanguage = useSettingsStore((state) => state.aiResponseLanguage)
  const localModel = useSettingsStore((state) => state.localModel)
  const localPort = useSettingsStore((state) => state.localPort)

  // Extract all setter functions
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setThemePreference = useSettingsStore((state) => state.setThemePreference)
  const setScrollDirection = useSettingsStore((state) => state.setScrollDirection)
  const setWindowLevelSensitivity = useSettingsStore((state) => state.setWindowLevelSensitivity)
  const setZoomSensitivity = useSettingsStore((state) => state.setZoomSensitivity)
  const setToolColor = useSettingsStore((state) => state.setToolColor)
  const setHidePersonalInfo = useSettingsStore((state) => state.setHidePersonalInfo)
  const setPersistStudies = useSettingsStore((state) => state.setPersistStudies)
  const setAiEnabled = useSettingsStore((state) => state.setAiEnabled)
  const setAiProvider = useSettingsStore((state) => state.setAiProvider)
  const setAiApiKey = useSettingsStore((state) => state.setAiApiKey)
  const setGeminiApiKey = useSettingsStore((state) => state.setGeminiApiKey)
  const setOpenaiApiKey = useSettingsStore((state) => state.setOpenaiApiKey)
  const setAiConsentGiven = useSettingsStore((state) => state.setAiConsentGiven)
  const setAiResponseLanguage = useSettingsStore((state) => state.setAiResponseLanguage)
  const setLocalModel = useSettingsStore((state) => state.setLocalModel)
  const setLocalPort = useSettingsStore((state) => state.setLocalPort)
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults)

  // Return all settings as a single object for convenient destructuring
  return {
    // State values
    theme,
    themePreference,
    scrollDirection,
    windowLevelSensitivity,
    zoomSensitivity,
    toolColor,
    hidePersonalInfo,
    persistStudies,
    aiEnabled,
    aiProvider,
    aiApiKey,
    geminiApiKey,
    openaiApiKey,
    aiConsentGiven,
    aiResponseLanguage,
    localModel,
    localPort,

    // Setter functions
    setTheme,
    setThemePreference,
    setScrollDirection,
    setWindowLevelSensitivity,
    setZoomSensitivity,
    setToolColor,
    setHidePersonalInfo,
    setPersistStudies,
    setAiEnabled,
    setAiProvider,
    setAiApiKey,
    setGeminiApiKey,
    setOpenaiApiKey,
    setAiConsentGiven,
    setAiResponseLanguage,
    setLocalModel,
    setLocalPort,
    resetToDefaults,
  }
}
