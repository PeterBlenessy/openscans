import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type ScrollDirection = 'natural' | 'inverted'
export type AIProvider = 'claude' | 'gemini' | 'openai' | 'none'

/**
 * Settings store state interface.
 *
 * Manages all user preferences including appearance, viewport behavior,
 * privacy controls, and AI integration settings.
 *
 * Settings are automatically saved to localStorage and restored on page load.
 *
 * SECURITY NOTE: API keys are stored in localStorage which is NOT secure.
 * This is acceptable for a demo/prototype but should be replaced with
 * a secure backend for production use.
 */
export interface SettingsState {
  // Appearance
  /** UI theme (dark or light) - applied to document root */
  theme: Theme

  // Viewport behavior
  /** Mouse wheel scroll direction for instance navigation */
  scrollDirection: ScrollDirection
  /** Window/level mouse drag sensitivity (0.5 to 3.0, default: 1.5) */
  windowLevelSensitivity: number
  /** Zoom scroll wheel sensitivity (0.01 to 0.2, default: 0.05) */
  zoomSensitivity: number

  // Privacy
  /** Hide patient names, IDs, and dates in UI (HIPAA compliance) */
  hidePersonalInfo: boolean

  // Data persistence
  /** Whether to persist loaded studies across browser sessions */
  persistStudies: boolean

  // AI Detection
  /** Enable AI features (vertebrae detection and radiology analysis) */
  aiEnabled: boolean
  /** Which AI API provider to use */
  aiProvider: AIProvider
  /** Claude API key (insecure localStorage storage - demo only) */
  aiApiKey: string
  /** Google Gemini API key (insecure localStorage storage - demo only) */
  geminiApiKey: string
  /** OpenAI API key (insecure localStorage storage - demo only) */
  openaiApiKey: string
  /** User has consented to sending images to external API */
  aiConsentGiven: boolean
  /** Language for AI analysis responses (e.g., 'English', 'Swedish', 'German') */
  aiResponseLanguage: string

  // Actions
  /** Set UI theme and apply to document root */
  setTheme: (theme: Theme) => void
  /** Set scroll direction for instance navigation */
  setScrollDirection: (direction: ScrollDirection) => void
  /** Set window/level drag sensitivity */
  setWindowLevelSensitivity: (sensitivity: number) => void
  /** Set zoom scroll sensitivity */
  setZoomSensitivity: (sensitivity: number) => void
  /** Set patient info visibility */
  setHidePersonalInfo: (hide: boolean) => void
  /** Set study persistence across sessions */
  setPersistStudies: (persist: boolean) => void
  /** Enable/disable AI features */
  setAiEnabled: (enabled: boolean) => void
  /** Switch AI provider */
  setAiProvider: (provider: AIProvider) => void
  /** Set Claude API key */
  setAiApiKey: (key: string) => void
  /** Set Gemini API key */
  setGeminiApiKey: (key: string) => void
  /** Set OpenAI API key */
  setOpenaiApiKey: (key: string) => void
  /** Set AI consent */
  setAiConsentGiven: (consent: boolean) => void
  /** Set AI response language */
  setAiResponseLanguage: (language: string) => void
  /** Reset all settings to defaults */
  resetToDefaults: () => void
}

const STORAGE_KEY = 'openscans-settings'

const defaultSettings = {
  theme: 'dark' as Theme,
  scrollDirection: 'natural' as ScrollDirection,
  windowLevelSensitivity: 1.5,
  zoomSensitivity: 0.05,
  hidePersonalInfo: true,
  persistStudies: true,
  aiEnabled: false,
  aiProvider: 'claude' as AIProvider,
  aiApiKey: '',
  geminiApiKey: '',
  openaiApiKey: '',
  aiConsentGiven: false,
  aiResponseLanguage: 'English',
}

/**
 * Load settings from localStorage.
 *
 * @returns Partial settings object (may be empty if no saved settings or parse error)
 */
function loadSettings(): Partial<typeof defaultSettings> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return {}
}

/**
 * Save settings to localStorage.
 *
 * @param settings - Settings object to save
 */
function saveSettings(settings: Partial<typeof defaultSettings>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

/**
 * Apply theme to document root by adding/removing CSS classes.
 *
 * @param theme - Theme to apply ('dark' or 'light')
 */
function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Zustand store for managing application settings.
 *
 * All settings are automatically persisted to localStorage under 'openscans-settings'.
 * Settings are loaded on store initialization and saved after every update.
 *
 * The theme setting has special behavior: it's applied to document.documentElement
 * immediately on load and whenever changed, allowing CSS to use dark: selectors.
 *
 * @example
 * ```tsx
 * // Select state
 * const theme = useSettingsStore((state) => state.theme)
 * const aiEnabled = useSettingsStore((state) => state.aiEnabled)
 *
 * // Call actions
 * const { setTheme, setAiEnabled } = useSettingsStore()
 * setTheme('dark')
 * setAiEnabled(true)
 * ```
 *
 * @example
 * ```tsx
 * // Use settings in viewport
 * const { windowLevelSensitivity } = useSettingsStore()
 * const delta = mouseDelta * windowLevelSensitivity
 * ```
 */
export const useSettingsStore = create<SettingsState>((set, get) => {
  const savedSettings = loadSettings()
  const initialSettings = { ...defaultSettings, ...savedSettings }

  // Apply initial theme
  applyTheme(initialSettings.theme)

  return {
    ...initialSettings,

    setTheme: (theme) => {
      applyTheme(theme)
      set({ theme })
      saveSettings({ ...get(), theme })
    },

    setScrollDirection: (scrollDirection) => {
      set({ scrollDirection })
      saveSettings({ ...get(), scrollDirection })
    },

    setWindowLevelSensitivity: (windowLevelSensitivity) => {
      set({ windowLevelSensitivity })
      saveSettings({ ...get(), windowLevelSensitivity })
    },

    setZoomSensitivity: (zoomSensitivity) => {
      set({ zoomSensitivity })
      saveSettings({ ...get(), zoomSensitivity })
    },

    setHidePersonalInfo: (hidePersonalInfo) => {
      set({ hidePersonalInfo })
      saveSettings({ ...get(), hidePersonalInfo })
      // Privacy setting only affects UI display of patient info, not AI data storage
    },

    setPersistStudies: (persistStudies) => {
      set({ persistStudies })
      saveSettings({ ...get(), persistStudies })
    },

    setAiEnabled: (aiEnabled) => {
      set({ aiEnabled })
      saveSettings({ ...get(), aiEnabled })
    },

    setAiProvider: (aiProvider) => {
      set({ aiProvider })
      saveSettings({ ...get(), aiProvider })
    },

    setAiApiKey: (aiApiKey) => {
      set({ aiApiKey })
      saveSettings({ ...get(), aiApiKey })
    },

    setGeminiApiKey: (geminiApiKey) => {
      set({ geminiApiKey })
      saveSettings({ ...get(), geminiApiKey })
    },

    setOpenaiApiKey: (openaiApiKey) => {
      set({ openaiApiKey })
      saveSettings({ ...get(), openaiApiKey })
    },

    setAiConsentGiven: (aiConsentGiven) => {
      set({ aiConsentGiven })
      saveSettings({ ...get(), aiConsentGiven })
    },

    setAiResponseLanguage: (aiResponseLanguage) => {
      set({ aiResponseLanguage })
      saveSettings({ ...get(), aiResponseLanguage })
    },

    resetToDefaults: () => {
      applyTheme(defaultSettings.theme)
      set(defaultSettings)
      saveSettings(defaultSettings)
    },
  }
})
