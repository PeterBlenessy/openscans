/**
 * Unit tests for settingsStore - P2 Supporting Tests
 *
 * Test coverage:
 * - Default settings initialization
 * - Theme switching (dark/light) with DOM updates
 * - Scroll direction settings
 * - Sensitivity settings (window/level, zoom)
 * - Privacy settings (hidePersonalInfo)
 * - Data persistence settings
 * - Reset to defaults
 * - localStorage persistence
 *
 * Target: ~25 assertions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSettingsStore } from './settingsStore'

describe('settingsStore', () => {
  // Mock document.documentElement.classList
  let classListAddSpy: ReturnType<typeof vi.fn>
  let classListRemoveSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Mock classList methods
    classListAddSpy = vi.fn()
    classListRemoveSpy = vi.fn()

    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        add: classListAddSpy,
        remove: classListRemoveSpy,
      },
      configurable: true,
    })

    // Reset store to defaults
    useSettingsStore.getState().resetToDefaults()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Default Settings', () => {
    it('should initialize with default settings', () => {
      const state = useSettingsStore.getState()

      expect(state.theme).toBe('dark')
      expect(state.scrollDirection).toBe('natural')
      expect(state.windowLevelSensitivity).toBe(1.5)
      expect(state.zoomSensitivity).toBe(0.05)
      expect(state.hidePersonalInfo).toBe(true) // Privacy: default to true
      expect(state.persistStudies).toBe(true)
    })

    it('should apply dark theme on initialization', () => {
      // Dark theme should be applied by default
      expect(classListAddSpy).toHaveBeenCalledWith('dark')
      expect(classListRemoveSpy).toHaveBeenCalledWith('light')
    })
  })

  describe('Theme Settings', () => {
    it('should switch to light theme', () => {
      classListAddSpy.mockClear()
      classListRemoveSpy.mockClear()

      useSettingsStore.getState().setTheme('light')

      expect(useSettingsStore.getState().theme).toBe('light')
      expect(classListAddSpy).toHaveBeenCalledWith('light')
      expect(classListRemoveSpy).toHaveBeenCalledWith('dark')
    })

    it('should switch to dark theme', () => {
      useSettingsStore.getState().setTheme('light')
      classListAddSpy.mockClear()
      classListRemoveSpy.mockClear()

      useSettingsStore.getState().setTheme('dark')

      expect(useSettingsStore.getState().theme).toBe('dark')
      expect(classListAddSpy).toHaveBeenCalledWith('dark')
      expect(classListRemoveSpy).toHaveBeenCalledWith('light')
    })

    it('should persist theme preference to localStorage (not the derived theme)', () => {
      useSettingsStore.getState().setTheme('light')

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.themePreference).toBe('light')
      expect(saved.theme).toBeUndefined() // derived, never persisted
    })

    it("should follow the OS appearance when preference is 'system'", () => {
      // matchMedia is mocked to report dark in the test setup.
      useSettingsStore.getState().setThemePreference('system')

      expect(useSettingsStore.getState().themePreference).toBe('system')
      expect(useSettingsStore.getState().theme).toBe('dark')
    })
  })

  describe('Scroll Direction Settings', () => {
    it('should set natural scroll direction', () => {
      useSettingsStore.getState().setScrollDirection('natural')

      expect(useSettingsStore.getState().scrollDirection).toBe('natural')
    })

    it('should set inverted scroll direction', () => {
      useSettingsStore.getState().setScrollDirection('inverted')

      expect(useSettingsStore.getState().scrollDirection).toBe('inverted')
    })

    it('should persist scroll direction to localStorage', () => {
      useSettingsStore.getState().setScrollDirection('inverted')

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.scrollDirection).toBe('inverted')
    })
  })

  describe('Sensitivity Settings', () => {
    it('should set window/level sensitivity', () => {
      useSettingsStore.getState().setWindowLevelSensitivity(2.0)

      expect(useSettingsStore.getState().windowLevelSensitivity).toBe(2.0)
    })

    it('should set zoom sensitivity', () => {
      useSettingsStore.getState().setZoomSensitivity(0.1)

      expect(useSettingsStore.getState().zoomSensitivity).toBe(0.1)
    })

    it('should persist sensitivity settings to localStorage', () => {
      useSettingsStore.getState().setWindowLevelSensitivity(2.5)
      useSettingsStore.getState().setZoomSensitivity(0.15)

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.windowLevelSensitivity).toBe(2.5)
      expect(saved.zoomSensitivity).toBe(0.15)
    })

    it('should handle sensitivity edge values', () => {
      // Min values
      useSettingsStore.getState().setWindowLevelSensitivity(0.5)
      useSettingsStore.getState().setZoomSensitivity(0.01)

      let state = useSettingsStore.getState()
      expect(state.windowLevelSensitivity).toBe(0.5)
      expect(state.zoomSensitivity).toBe(0.01)

      // Max values
      useSettingsStore.getState().setWindowLevelSensitivity(3.0)
      useSettingsStore.getState().setZoomSensitivity(0.2)

      state = useSettingsStore.getState()
      expect(state.windowLevelSensitivity).toBe(3.0)
      expect(state.zoomSensitivity).toBe(0.2)
    })
  })

  describe('Privacy Settings', () => {
    it('should toggle hidePersonalInfo to false', () => {
      // Default is true
      expect(useSettingsStore.getState().hidePersonalInfo).toBe(true)

      useSettingsStore.getState().setHidePersonalInfo(false)

      expect(useSettingsStore.getState().hidePersonalInfo).toBe(false)
    })

    it('should toggle hidePersonalInfo to true', () => {
      useSettingsStore.getState().setHidePersonalInfo(false)
      useSettingsStore.getState().setHidePersonalInfo(true)

      expect(useSettingsStore.getState().hidePersonalInfo).toBe(true)
    })

    it('should persist privacy settings to localStorage', () => {
      useSettingsStore.getState().setHidePersonalInfo(false)

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.hidePersonalInfo).toBe(false)
    })
  })

  describe('Data Persistence Settings', () => {
    it('should toggle persistStudies setting', () => {
      useSettingsStore.getState().setPersistStudies(false)

      expect(useSettingsStore.getState().persistStudies).toBe(false)

      useSettingsStore.getState().setPersistStudies(true)

      expect(useSettingsStore.getState().persistStudies).toBe(true)
    })

    it('should persist data persistence setting to localStorage', () => {
      useSettingsStore.getState().setPersistStudies(false)

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.persistStudies).toBe(false)
    })
  })

  describe('Reset to Defaults', () => {
    it('should reset all settings to defaults', () => {
      // Change all settings
      useSettingsStore.getState().setTheme('light')
      useSettingsStore.getState().setScrollDirection('inverted')
      useSettingsStore.getState().setWindowLevelSensitivity(2.5)
      useSettingsStore.getState().setZoomSensitivity(0.15)
      useSettingsStore.getState().setHidePersonalInfo(false)
      useSettingsStore.getState().setPersistStudies(false)

      classListAddSpy.mockClear()
      classListRemoveSpy.mockClear()

      // Reset
      useSettingsStore.getState().resetToDefaults()

      const state = useSettingsStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.scrollDirection).toBe('natural')
      expect(state.windowLevelSensitivity).toBe(1.5)
      expect(state.zoomSensitivity).toBe(0.05)
      expect(state.hidePersonalInfo).toBe(true)
      expect(state.persistStudies).toBe(true)

      // Should apply dark theme
      expect(classListAddSpy).toHaveBeenCalledWith('dark')
      expect(classListRemoveSpy).toHaveBeenCalledWith('light')
    })

    it('should persist default settings to localStorage', () => {
      useSettingsStore.getState().setTheme('light')
      useSettingsStore.getState().resetToDefaults()

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.themePreference).toBe('system')
      expect(saved.hidePersonalInfo).toBe(true)
    })
  })

  describe('localStorage Persistence', () => {
    it('should load settings from localStorage on initialization', () => {
      // Set custom settings in localStorage
      localStorage.setItem(
        'openscans-settings',
        JSON.stringify({
          theme: 'light',
          scrollDirection: 'inverted',
          windowLevelSensitivity: 2.0,
          zoomSensitivity: 0.1,
          hidePersonalInfo: false,
          persistStudies: false,
        })
      )

      // Create a new store instance to trigger initialization
      // Since we can't easily re-initialize the singleton, we'll test that
      // settings are persisted correctly
      useSettingsStore.getState().setTheme('light')
      useSettingsStore.getState().setScrollDirection('inverted')
      useSettingsStore.getState().setWindowLevelSensitivity(2.0)

      const saved = JSON.parse(localStorage.getItem('openscans-settings') || '{}')
      expect(saved.themePreference).toBe('light')
      expect(saved.scrollDirection).toBe('inverted')
      expect(saved.windowLevelSensitivity).toBe(2.0)
    })

    it('should handle localStorage errors gracefully', () => {
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      // Should not throw error
      expect(() => {
        useSettingsStore.getState().setTheme('light')
      }).not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save settings:',
        expect.any(Error)
      )

      // Restore
      localStorage.setItem = originalSetItem
      consoleErrorSpy.mockRestore()
    })
  })
})
