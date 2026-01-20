import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type ScrollDirection = 'natural' | 'inverted'

export interface SettingsState {
  // Appearance
  theme: Theme

  // Viewport behavior
  scrollDirection: ScrollDirection
  windowLevelSensitivity: number // 0.5 to 3.0, default 1.5
  zoomSensitivity: number // 0.01 to 0.2, default 0.05

  // Display
  showMetadataOverlay: boolean

  // Actions
  setTheme: (theme: Theme) => void
  setScrollDirection: (direction: ScrollDirection) => void
  setWindowLevelSensitivity: (sensitivity: number) => void
  setZoomSensitivity: (sensitivity: number) => void
  setShowMetadataOverlay: (show: boolean) => void
  resetToDefaults: () => void
}

const STORAGE_KEY = 'mri-viewer-settings'

const defaultSettings = {
  theme: 'dark' as Theme,
  scrollDirection: 'natural' as ScrollDirection,
  windowLevelSensitivity: 1.5,
  zoomSensitivity: 0.05,
  showMetadataOverlay: false,
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

    setShowMetadataOverlay: (showMetadataOverlay) => {
      set({ showMetadataOverlay })
      saveSettings({ ...get(), showMetadataOverlay })
    },

    resetToDefaults: () => {
      applyTheme(defaultSettings.theme)
      set(defaultSettings)
      saveSettings(defaultSettings)
    },
  }
})
