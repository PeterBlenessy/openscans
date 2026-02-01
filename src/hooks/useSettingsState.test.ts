/**
 * Unit tests for useSettingsState hook
 *
 * Tests settings state accessor including:
 * - Theme state access
 * - AI settings access
 * - Sensitivity settings access
 * - All state update functions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettingsState } from './useSettingsState'
import { useSettingsStore } from '@/stores/settingsStore'

describe('useSettingsState', () => {
  beforeEach(() => {
    // Reset settings store to defaults
    useSettingsStore.getState().resetToDefaults()
  })

  describe('initial state', () => {
    it('should return current theme from store', () => {
      const { result } = renderHook(() => useSettingsState())
      expect(result.current.theme).toBe('dark')
    })

    it('should return current scroll direction', () => {
      const { result } = renderHook(() => useSettingsState())
      expect(result.current.scrollDirection).toBe('natural')
    })

    it('should return current sensitivity settings', () => {
      const { result } = renderHook(() => useSettingsState())
      expect(result.current.windowLevelSensitivity).toBe(1.5)
      expect(result.current.zoomSensitivity).toBe(0.05)
    })

    it('should return current privacy settings', () => {
      const { result } = renderHook(() => useSettingsState())
      expect(result.current.hidePersonalInfo).toBe(true)
    })

    it('should return current AI settings', () => {
      const { result } = renderHook(() => useSettingsState())
      expect(result.current.aiEnabled).toBe(false)
      expect(result.current.aiProvider).toBe('claude')
      expect(result.current.aiConsentGiven).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should update theme to light', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
      expect(useSettingsStore.getState().theme).toBe('light')
    })

    it('should update theme to dark', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setTheme('light')
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })
  })

  describe('setSensitivity', () => {
    it('should update window level sensitivity', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setWindowLevelSensitivity(2.0)
      })

      expect(result.current.windowLevelSensitivity).toBe(2.0)
    })

    it('should update zoom sensitivity', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setZoomSensitivity(0.1)
      })

      expect(result.current.zoomSensitivity).toBe(0.1)
    })
  })

  describe('setAiSettings', () => {
    it('should update AI enabled state', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setAiEnabled(true)
      })

      expect(result.current.aiEnabled).toBe(true)
    })

    it('should update AI provider', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setAiProvider('gemini')
      })

      expect(result.current.aiProvider).toBe('gemini')
    })

    it('should update AI consent', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setAiConsentGiven(true)
      })

      expect(result.current.aiConsentGiven).toBe(true)
    })
  })

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useSettingsState())
      const firstSetTheme = result.current.setTheme
      const firstSetAiEnabled = result.current.setAiEnabled
      const firstResetToDefaults = result.current.resetToDefaults

      rerender()

      expect(result.current.setTheme).toBe(firstSetTheme)
      expect(result.current.setAiEnabled).toBe(firstSetAiEnabled)
      expect(result.current.resetToDefaults).toBe(firstResetToDefaults)
    })
  })

  describe('reactive updates', () => {
    it('should reflect store changes', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        useSettingsStore.getState().setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })

    it('should reflect multiple store changes', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        useSettingsStore.getState().setTheme('light')
        useSettingsStore.getState().setAiEnabled(true)
        useSettingsStore.getState().setHidePersonalInfo(false)
      })

      expect(result.current.theme).toBe('light')
      expect(result.current.aiEnabled).toBe(true)
      expect(result.current.hidePersonalInfo).toBe(false)
    })
  })

  describe('multiple hook instances', () => {
    it('should share state across multiple instances', () => {
      const { result: result1 } = renderHook(() => useSettingsState())
      const { result: result2 } = renderHook(() => useSettingsState())

      act(() => {
        result1.current.setTheme('light')
      })

      expect(result1.current.theme).toBe('light')
      expect(result2.current.theme).toBe('light')
    })

    it('should sync updates across instances', () => {
      const { result: result1 } = renderHook(() => useSettingsState())
      const { result: result2 } = renderHook(() => useSettingsState())

      act(() => {
        result1.current.setAiProvider('gemini')
        result2.current.setZoomSensitivity(0.1)
      })

      expect(result1.current.aiProvider).toBe('gemini')
      expect(result1.current.zoomSensitivity).toBe(0.1)
      expect(result2.current.aiProvider).toBe('gemini')
      expect(result2.current.zoomSensitivity).toBe(0.1)
    })
  })

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useSettingsState())

      act(() => {
        result.current.setTheme('light')
        result.current.setAiEnabled(true)
        result.current.setZoomSensitivity(0.15)
        result.current.resetToDefaults()
      })

      expect(result.current.theme).toBe('dark')
      expect(result.current.aiEnabled).toBe(false)
      expect(result.current.zoomSensitivity).toBe(0.05)
    })
  })
})
