import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type ScrollDirection = 'natural' | 'inverted'
export type AIProvider = 'claude' | 'openai' | 'none'

export interface SettingsState {
  // Appearance
  theme: Theme

  // Viewport behavior
  scrollDirection: ScrollDirection
  windowLevelSensitivity: number // 0.5 to 3.0, default 1.5
  zoomSensitivity: number // 0.01 to 0.2, default 0.05

  // Privacy
  hidePersonalInfo: boolean // Hide patient names, IDs, and dates

  // Data persistence
  persistStudies: boolean // Whether to persist studies across sessions

  // AI Detection
  aiEnabled: boolean // Enable AI vertebrae detection
  aiProvider: AIProvider // Which API to use
  aiApiKey: string // API key (stored in localStorage - not secure for production)
  aiConsentGiven: boolean // User has consented to sending images to external API

  // Actions
  setTheme: (theme: Theme) => void
  setScrollDirection: (direction: ScrollDirection) => void
  setWindowLevelSensitivity: (sensitivity: number) => void
  setZoomSensitivity: (sensitivity: number) => void
  setHidePersonalInfo: (hide: boolean) => void
  setPersistStudies: (persist: boolean) => void
  setAiEnabled: (enabled: boolean) => void
  setAiProvider: (provider: AIProvider) => void
  setAiApiKey: (key: string) => void
  setAiConsentGiven: (consent: boolean) => void
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
  aiConsentGiven: false,
}

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

function saveSettings(settings: Partial<typeof defaultSettings>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}

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

    setAiConsentGiven: (aiConsentGiven) => {
      set({ aiConsentGiven })
      saveSettings({ ...get(), aiConsentGiven })
    },

    resetToDefaults: () => {
      applyTheme(defaultSettings.theme)
      set(defaultSettings)
      saveSettings(defaultSettings)
    },
  }
})
