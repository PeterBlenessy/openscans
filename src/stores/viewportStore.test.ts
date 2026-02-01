/**
 * Unit tests for viewportStore
 *
 * Critical business logic tests:
 * - W/L modality switching with DICOM metadata
 * - User customization detection
 * - Reset to DICOM vs hard-coded defaults
 * - Edge cases (NaN, undefined values, unknown modalities)
 *
 * Target: ~60 assertions, 95%+ coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useViewportStore } from './viewportStore'

describe('viewportStore', () => {
  // Reset store before each test
  beforeEach(() => {
    // Reset to initial state by creating a fresh store instance
    const initialState = {
      settings: {
        windowCenter: 600,
        windowWidth: 1200,
        zoom: 1,
        pan: { x: 0, y: 0 },
        rotation: 0,
        invert: false,
        flipHorizontal: false,
        flipVertical: false,
      },
      currentModality: 'MR',
      modalitySettings: {
        'MR': { windowCenter: 600, windowWidth: 1200 },
        'CT': { windowCenter: 40, windowWidth: 400 },
        'CR': { windowCenter: 2048, windowWidth: 4096 },
        'DX': { windowCenter: 2048, windowWidth: 4096 },
        'RF': { windowCenter: 2048, windowWidth: 4096 },
        'XA': { windowCenter: 2048, windowWidth: 4096 },
        'MG': { windowCenter: 1500, windowWidth: 3000 },
        'OT': { windowCenter: 600, windowWidth: 1200 },
      },
      activeTool: 'WindowLevel',
      tools: [
        { name: 'WindowLevel', mode: 'active' },
        { name: 'Zoom', mode: 'passive' },
        { name: 'Pan', mode: 'passive' },
        { name: 'StackScroll', mode: 'active' },
      ],
      showAnnotations: true,
      showMetadata: true,
    }

    // @ts-expect-error - accessing internal state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useViewportStore.setState(initialState as any)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useViewportStore.getState()

      expect(state.currentModality).toBe('MR')
      expect(state.settings.windowCenter).toBe(600)
      expect(state.settings.windowWidth).toBe(1200)
      expect(state.settings.zoom).toBe(1)
      expect(state.settings.pan).toEqual({ x: 0, y: 0 })
      expect(state.settings.rotation).toBe(0)
      expect(state.settings.invert).toBe(false)
      expect(state.activeTool).toBe('WindowLevel')
      expect(state.showAnnotations).toBe(true)
      expect(state.showMetadata).toBe(true)
    })

    it('should have modality defaults for all modalities', () => {
      const state = useViewportStore.getState()

      expect(state.modalitySettings['MR']).toEqual({ windowCenter: 600, windowWidth: 1200 })
      expect(state.modalitySettings['CT']).toEqual({ windowCenter: 40, windowWidth: 400 })
      expect(state.modalitySettings['CR']).toEqual({ windowCenter: 2048, windowWidth: 4096 })
      expect(state.modalitySettings['DX']).toEqual({ windowCenter: 2048, windowWidth: 4096 })
      expect(state.modalitySettings['MG']).toEqual({ windowCenter: 1500, windowWidth: 3000 })
    })
  })

  describe('setWindowLevel', () => {
    it('should update window/level for current modality', () => {
      useViewportStore.getState().setWindowLevel(800, 1600)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(800)
      expect(state.settings.windowWidth).toBe(1600)
      expect(state.modalitySettings['MR'].windowCenter).toBe(800)
      expect(state.modalitySettings['MR'].windowWidth).toBe(1600)
    })

    it('should update modalitySettings for current modality only', () => {
      useViewportStore.getState().setWindowLevel(100, 200)

      const state = useViewportStore.getState()
      expect(state.modalitySettings['MR'].windowCenter).toBe(100)
      expect(state.modalitySettings['CT'].windowCenter).toBe(40) // Should not change
    })

    it('should preserve dicomDefault when updating W/L', () => {
      // Set DICOM defaults first
      useViewportStore.getState().setModality('MR', 128, 256)

      // Manually adjust W/L
      useViewportStore.getState().setWindowLevel(500, 1000)

      const state = useViewportStore.getState()
      expect(state.modalitySettings['MR'].windowCenter).toBe(500)
      expect(state.modalitySettings['MR'].dicomDefault).toEqual({
        windowCenter: 128,
        windowWidth: 256,
      })
    })

    it('should handle negative values', () => {
      useViewportStore.getState().setWindowLevel(-50, 100)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(-50)
      expect(state.settings.windowWidth).toBe(100)
    })

    it('should handle large values', () => {
      useViewportStore.getState().setWindowLevel(4096, 8192)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(4096)
      expect(state.settings.windowWidth).toBe(8192)
    })
  })

  describe('setModality - Basic Switching', () => {
    it('should switch to CT modality with default values', () => {
      useViewportStore.getState().setModality('CT')

      const state = useViewportStore.getState()
      expect(state.currentModality).toBe('CT')
      expect(state.settings.windowCenter).toBe(40)
      expect(state.settings.windowWidth).toBe(400)
    })

    it('should switch to MG modality with default values', () => {
      useViewportStore.getState().setModality('MG')

      const state = useViewportStore.getState()
      expect(state.currentModality).toBe('MG')
      expect(state.settings.windowCenter).toBe(1500)
      expect(state.settings.windowWidth).toBe(3000)
    })

    it('should fall back to OT defaults for unknown modality', () => {
      useViewportStore.getState().setModality('UNKNOWN')

      const state = useViewportStore.getState()
      expect(state.currentModality).toBe('UNKNOWN')
      expect(state.settings.windowCenter).toBe(600) // OT default
      expect(state.settings.windowWidth).toBe(1200)
    })

    it('should preserve user adjustments when switching back to modality', () => {
      // Adjust MR W/L
      useViewportStore.getState().setWindowLevel(800, 1600)

      // Switch to CT
      useViewportStore.getState().setModality('CT')
      expect(useViewportStore.getState().settings.windowCenter).toBe(40)

      // Switch back to MR - should restore user adjustments
      useViewportStore.getState().setModality('MR')

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(800)
      expect(state.settings.windowWidth).toBe(1600)
    })
  })

  describe('setModality - DICOM Metadata Handling', () => {
    it('should apply DICOM defaults for new modality', () => {
      useViewportStore.getState().setModality('MR', 128, 256)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(128)
      expect(state.settings.windowWidth).toBe(256)
      expect(state.modalitySettings['MR'].dicomDefault).toEqual({
        windowCenter: 128,
        windowWidth: 256,
      })
    })

    it('should NOT override user customization when loading new image (after DICOM set)', () => {
      // Set initial DICOM defaults
      useViewportStore.getState().setModality('MR', 100, 200)

      // User adjusts W/L (customization)
      useViewportStore.getState().setWindowLevel(500, 1000)

      // Load new image with different DICOM metadata
      useViewportStore.getState().setModality('MR', 128, 256)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(500) // User adjustment preserved
      expect(state.settings.windowWidth).toBe(1000)
      expect(state.modalitySettings['MR'].dicomDefault).toEqual({
        windowCenter: 128,
        windowWidth: 256, // DICOM default updated but not applied
      })
    })

    it('should apply new DICOM defaults if user is still at hard-coded defaults', () => {
      // User hasn't adjusted anything (still at MR default 600/1200)
      expect(useViewportStore.getState().settings.windowCenter).toBe(600)

      // Load image with DICOM metadata
      useViewportStore.getState().setModality('MR', 128, 256)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(128) // DICOM applied
      expect(state.settings.windowWidth).toBe(256)
    })

    it('should apply new DICOM defaults if user is at previous DICOM defaults', () => {
      // Set first DICOM defaults
      useViewportStore.getState().setModality('MR', 100, 200)
      expect(useViewportStore.getState().settings.windowCenter).toBe(100)

      // Load new image with different DICOM metadata (user hasn't adjusted)
      useViewportStore.getState().setModality('MR', 150, 300)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(150) // New DICOM applied
      expect(state.settings.windowWidth).toBe(300)
    })

    it('should detect user customization between DICOM images', () => {
      // Set first DICOM defaults
      useViewportStore.getState().setModality('MR', 100, 200)

      // User adjusts W/L
      useViewportStore.getState().setWindowLevel(500, 1000)

      // Load new image with different DICOM metadata
      useViewportStore.getState().setModality('MR', 150, 300)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(500) // User adjustment preserved
      expect(state.modalitySettings['MR'].dicomDefault).toEqual({
        windowCenter: 150,
        windowWidth: 300,
      })
    })

    it('should handle undefined DICOM values gracefully', () => {
      useViewportStore.getState().setModality('MR', undefined, undefined)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(600) // MR default
      expect(state.settings.windowWidth).toBe(1200)
      expect(state.modalitySettings['MR'].dicomDefault).toBeUndefined()
    })

    it('should handle partial DICOM metadata (only center)', () => {
      useViewportStore.getState().setModality('MR', 128, undefined)

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(600) // Falls back to default
      expect(state.modalitySettings['MR'].dicomDefault).toBeUndefined()
    })
  })

  describe('resetSettings', () => {
    it('should reset to DICOM defaults when available', () => {
      // Set DICOM defaults
      useViewportStore.getState().setModality('MR', 128, 256)

      // User adjusts W/L
      useViewportStore.getState().setWindowLevel(500, 1000)
      useViewportStore.getState().setZoom(2)

      // Reset
      useViewportStore.getState().resetSettings()

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(128) // DICOM default
      expect(state.settings.windowWidth).toBe(256)
      expect(state.settings.zoom).toBe(1) // Back to default
      expect(state.settings.pan).toEqual({ x: 0, y: 0 })
    })

    it('should reset to hard-coded modality defaults when no DICOM defaults', () => {
      // User adjusts W/L (no DICOM metadata set)
      useViewportStore.getState().setWindowLevel(800, 1600)
      useViewportStore.getState().setRotation(90)

      // Reset
      useViewportStore.getState().resetSettings()

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(600) // MR hard-coded default
      expect(state.settings.windowWidth).toBe(1200)
      expect(state.settings.rotation).toBe(0)
    })

    it('should reset CT modality to correct defaults', () => {
      // Switch to CT
      useViewportStore.getState().setModality('CT')
      useViewportStore.getState().setWindowLevel(100, 200)

      // Reset
      useViewportStore.getState().resetSettings()

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(40) // CT default
      expect(state.settings.windowWidth).toBe(400)
    })

    it('should preserve DICOM defaults for future resets', () => {
      // Set DICOM defaults
      useViewportStore.getState().setModality('MR', 128, 256)

      // Reset once
      useViewportStore.getState().resetSettings()

      // Adjust again
      useViewportStore.getState().setWindowLevel(500, 1000)

      // Reset again
      useViewportStore.getState().resetSettings()

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(128) // Still has DICOM defaults
      expect(state.modalitySettings['MR'].dicomDefault).toEqual({
        windowCenter: 128,
        windowWidth: 256,
      })
    })

    it('should fall back to OT defaults for unknown modality', () => {
      useViewportStore.getState().setModality('UNKNOWN')
      useViewportStore.getState().setWindowLevel(1000, 2000)

      useViewportStore.getState().resetSettings()

      const state = useViewportStore.getState()
      expect(state.settings.windowCenter).toBe(600) // OT default
      expect(state.settings.windowWidth).toBe(1200)
    })
  })

  describe('Simple Viewport Settings', () => {
    it('should set zoom', () => {
      useViewportStore.getState().setZoom(2.5)

      const state = useViewportStore.getState()
      expect(state.settings.zoom).toBe(2.5)
    })

    it('should set pan', () => {
      useViewportStore.getState().setPan(100, -50)

      const state = useViewportStore.getState()
      expect(state.settings.pan).toEqual({ x: 100, y: -50 })
    })

    it('should set rotation', () => {
      useViewportStore.getState().setRotation(90)

      const state = useViewportStore.getState()
      expect(state.settings.rotation).toBe(90)
    })

    it('should set invert', () => {
      useViewportStore.getState().setInvert(true)

      const state = useViewportStore.getState()
      expect(state.settings.invert).toBe(true)

      useViewportStore.getState().setInvert(false)
      expect(useViewportStore.getState().settings.invert).toBe(false)
    })

    it('should set flip horizontal', () => {
      useViewportStore.getState().setFlipHorizontal(true)

      const state = useViewportStore.getState()
      expect(state.settings.flipHorizontal).toBe(true)

      useViewportStore.getState().setFlipHorizontal(false)
      expect(useViewportStore.getState().settings.flipHorizontal).toBe(false)
    })

    it('should set flip vertical', () => {
      useViewportStore.getState().setFlipVertical(true)

      const state = useViewportStore.getState()
      expect(state.settings.flipVertical).toBe(true)

      useViewportStore.getState().setFlipVertical(false)
      expect(useViewportStore.getState().settings.flipVertical).toBe(false)
    })
  })

  describe('Tool Management', () => {
    it('should set active tool', () => {
      useViewportStore.getState().setActiveTool('Zoom')

      const state = useViewportStore.getState()
      expect(state.activeTool).toBe('Zoom')
    })

    it('should toggle annotations', () => {
      expect(useViewportStore.getState().showAnnotations).toBe(true)

      useViewportStore.getState().toggleAnnotations()
      expect(useViewportStore.getState().showAnnotations).toBe(false)

      useViewportStore.getState().toggleAnnotations()
      expect(useViewportStore.getState().showAnnotations).toBe(true)
    })

    it('should toggle metadata', () => {
      expect(useViewportStore.getState().showMetadata).toBe(true)

      useViewportStore.getState().toggleMetadata()
      expect(useViewportStore.getState().showMetadata).toBe(false)

      useViewportStore.getState().toggleMetadata()
      expect(useViewportStore.getState().showMetadata).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero window width', () => {
      useViewportStore.getState().setWindowLevel(100, 0)

      const state = useViewportStore.getState()
      expect(state.settings.windowWidth).toBe(0)
    })

    it('should handle negative rotation', () => {
      useViewportStore.getState().setRotation(-90)

      const state = useViewportStore.getState()
      expect(state.settings.rotation).toBe(-90)
    })

    it('should handle fractional zoom', () => {
      useViewportStore.getState().setZoom(0.5)

      const state = useViewportStore.getState()
      expect(state.settings.zoom).toBe(0.5)
    })

    it('should handle very large rotation', () => {
      useViewportStore.getState().setRotation(720)

      const state = useViewportStore.getState()
      expect(state.settings.rotation).toBe(720)
    })
  })
})
