import { create } from 'zustand'
import { storeKey, getKey, deleteKey } from '../lib/utils/credentials'

/** Resolved UI theme applied to the document root. */
export type Theme = 'dark' | 'light'
/** User-facing theme preference; 'system' follows the OS appearance. */
export type ThemePreference = 'system' | 'light' | 'dark'
export type ScrollDirection = 'natural' | 'inverted'
export type AIProvider = 'claude' | 'gemini' | 'openai' | 'local' | 'none'

/**
 * Default model id for the bundled local LLM (llama-server). Preconfigured but
 * user-overridable in Settings. MedGemma 4B is a medical-tuned Gemma-3
 * multimodal model available as GGUF for llama.cpp. The user may type any other
 * model id (no model search/browse UI).
 */
export const DEFAULT_LOCAL_MODEL = 'medgemma-4b-it'

/** Default loopback port the bundled llama-server listens on. */
export const DEFAULT_LOCAL_PORT = 8080

/**
 * Settings store state interface.
 *
 * Manages all user preferences including appearance, viewport behavior,
 * privacy controls, and AI integration settings.
 *
 * Settings are automatically saved to localStorage and restored on page load.
 *
 * SECURITY NOTE: API keys are NEVER persisted to localStorage. On desktop
 * (Tauri) they are stored in the OS keychain via `src/lib/utils/credentials.ts`
 * and hydrated into the in-memory store at startup. On web they live only in
 * memory for the current session. The `aiApiKey` / `geminiApiKey` /
 * `openaiApiKey` fields below remain on the store for synchronous reads, but
 * are stripped from anything written to localStorage.
 */
export interface SettingsState {
  // Appearance
  /** Resolved UI theme (dark or light) applied to document root. Derived from
   *  themePreference + the OS appearance; NOT persisted directly. */
  theme: Theme
  /** Persisted theme preference; 'system' tracks the OS light/dark setting. */
  themePreference: ThemePreference

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
  /** Claude API key (in-memory only; persisted to OS keychain on desktop) */
  aiApiKey: string
  /** Google Gemini API key (in-memory only; persisted to OS keychain on desktop) */
  geminiApiKey: string
  /** OpenAI API key (in-memory only; persisted to OS keychain on desktop) */
  openaiApiKey: string
  /** User has consented to sending images to external API */
  aiConsentGiven: boolean
  /** Language for AI analysis responses (e.g., 'English', 'Swedish', 'German') */
  aiResponseLanguage: string
  /**
   * Model id for the bundled local LLM (llama-server). Preconfigured to
   * DEFAULT_LOCAL_MODEL but freely editable. No API key or egress involved.
   */
  localModel: string
  /** Loopback port the bundled llama-server listens on. */
  localPort: number

  // Actions
  /** Set the theme preference ('system' follows the OS); applies the resolved theme. */
  setThemePreference: (preference: ThemePreference) => void
  /** Set an explicit UI theme (back-compat shim for setThemePreference). */
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
  /** Set the local LLM model id (empty falls back to the default at use time) */
  setLocalModel: (model: string) => void
  /** Set the local llama-server port */
  setLocalPort: (port: number) => void
  /** Reset all settings to defaults */
  resetToDefaults: () => void
}

const STORAGE_KEY = 'openscans-settings'

/**
 * API-key fields that must NEVER be written to localStorage. They are kept in
 * the in-memory store only and (on desktop) mirrored to the OS keychain.
 */
const SENSITIVE_KEYS = ['aiApiKey', 'geminiApiKey', 'openaiApiKey'] as const

/**
 * Fields derived at runtime that must NOT be persisted — they are recomputed on
 * load. `theme` is resolved from `themePreference` + the OS appearance.
 */
const DERIVED_KEYS = ['theme'] as const

/** Map of in-memory key field -> keychain credential name. */
const KEYCHAIN_NAMES = {
  aiApiKey: 'claude',
  geminiApiKey: 'gemini',
  openaiApiKey: 'openai',
} as const

const defaultSettings = {
  theme: 'dark' as Theme,
  themePreference: 'system' as ThemePreference,
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
  localModel: DEFAULT_LOCAL_MODEL,
  localPort: DEFAULT_LOCAL_PORT,
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
      const parsed = JSON.parse(saved) as Record<string, unknown>

      // Migration: purge any legacy plaintext API keys persisted at rest by
      // older builds. We never want these to live in localStorage again.
      const hadSensitive = SENSITIVE_KEYS.some((k) => k in parsed)
      if (hadSensitive) {
        for (const k of SENSITIVE_KEYS) {
          delete parsed[k]
        }
        saveSettings(parsed as Partial<typeof defaultSettings>)
      }

      return parsed as Partial<typeof defaultSettings>
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
    // Strip API keys (never hit localStorage) and derived fields (recomputed
    // on load) before persisting.
    const sanitized: Record<string, unknown> = { ...settings }
    for (const k of [...SENSITIVE_KEYS, ...DERIVED_KEYS]) {
      delete sanitized[k]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

/**
 * Persist an API key to the OS keychain (desktop only — no-op on web).
 *
 * An empty value deletes the keychain entry rather than storing a blank
 * secret, so clearing a key in Settings removes it at rest.
 *
 * @param name - Keychain credential name ('claude' | 'gemini' | 'openai')
 * @param value - Secret value, or '' to delete
 */
async function persistKey(name: string, value: string): Promise<void> {
  if (value === '') {
    await deleteKey(name)
  } else {
    await storeKey(name, value)
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

/** Whether the OS currently prefers dark mode (guarded for non-browser/test envs). */
function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/** Resolve a preference to a concrete light/dark theme. */
function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') return prefersDark() ? 'dark' : 'light'
  return preference
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
  // `theme` is derived; the persisted source of truth is `themePreference`.
  // Pre-existing installs only stored `theme`, so they migrate to 'system'.
  const themePreference = savedSettings.themePreference ?? defaultSettings.themePreference
  const theme = resolveTheme(themePreference)
  const initialSettings = { ...defaultSettings, ...savedSettings, themePreference, theme }

  // Apply initial theme
  applyTheme(theme)

  // Keep the resolved theme in sync with the OS while the preference is 'system'.
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (get().themePreference !== 'system') return
      const resolved = resolveTheme('system')
      applyTheme(resolved)
      set({ theme: resolved })
    })
  }

  // Hydrate in-memory API keys from the OS keychain (desktop only). Runs
  // asynchronously so store creation stays synchronous; getKey() is a no-op
  // returning null on web, so this is harmless there. Each key is only set if
  // the keychain actually holds a value, so we don't clobber the defaults.
  void (async () => {
    const [claude, gemini, openai] = await Promise.all([
      getKey(KEYCHAIN_NAMES.aiApiKey),
      getKey(KEYCHAIN_NAMES.geminiApiKey),
      getKey(KEYCHAIN_NAMES.openaiApiKey),
    ])
    const hydrated: Partial<SettingsState> = {}
    if (claude) hydrated.aiApiKey = claude
    if (gemini) hydrated.geminiApiKey = gemini
    if (openai) hydrated.openaiApiKey = openai
    if (Object.keys(hydrated).length > 0) {
      set(hydrated)
    }
  })()

  return {
    ...initialSettings,

    setThemePreference: (themePreference) => {
      const theme = resolveTheme(themePreference)
      applyTheme(theme)
      set({ themePreference, theme })
      saveSettings({ ...get(), themePreference, theme })
    },

    // Back-compat: an explicit theme is just a non-'system' preference.
    setTheme: (theme) => {
      get().setThemePreference(theme)
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
      // Key is never persisted to localStorage; mirror to keychain on desktop.
      saveSettings({ ...get(), aiApiKey })
      void persistKey(KEYCHAIN_NAMES.aiApiKey, aiApiKey)
    },

    setGeminiApiKey: (geminiApiKey) => {
      set({ geminiApiKey })
      saveSettings({ ...get(), geminiApiKey })
      void persistKey(KEYCHAIN_NAMES.geminiApiKey, geminiApiKey)
    },

    setOpenaiApiKey: (openaiApiKey) => {
      set({ openaiApiKey })
      saveSettings({ ...get(), openaiApiKey })
      void persistKey(KEYCHAIN_NAMES.openaiApiKey, openaiApiKey)
    },

    setAiConsentGiven: (aiConsentGiven) => {
      set({ aiConsentGiven })
      saveSettings({ ...get(), aiConsentGiven })
    },

    setAiResponseLanguage: (aiResponseLanguage) => {
      set({ aiResponseLanguage })
      saveSettings({ ...get(), aiResponseLanguage })
    },

    setLocalModel: (localModel) => {
      set({ localModel })
      saveSettings({ ...get(), localModel })
    },

    setLocalPort: (localPort) => {
      set({ localPort })
      saveSettings({ ...get(), localPort })
    },

    resetToDefaults: () => {
      const theme = resolveTheme(defaultSettings.themePreference)
      applyTheme(theme)
      set({ ...defaultSettings, theme })
      saveSettings({ ...defaultSettings, theme })
      // Clear any keychain-stored keys too (defaults are empty strings).
      void persistKey(KEYCHAIN_NAMES.aiApiKey, defaultSettings.aiApiKey)
      void persistKey(KEYCHAIN_NAMES.geminiApiKey, defaultSettings.geminiApiKey)
      void persistKey(KEYCHAIN_NAMES.openaiApiKey, defaultSettings.openaiApiKey)
    },
  }
})
