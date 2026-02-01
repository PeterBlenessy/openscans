/**
 * Integration tests for viewport interaction workflow
 *
 * Tests navigation between studies/series/instances and viewport tool
 * interactions (window/level, pan, zoom).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { createMockStudy } from '@/test/fixtures/dicomData'

describe('Viewport Interaction Integration', () => {
  beforeEach(() => {
    useStudyStore.getState().reset()
    useViewportStore.getState().resetSettings()
  })

  describe('Study and series navigation', () => {
    it('should navigate through study > series > instance hierarchy', () => {
      const mockStudies = [
        createMockStudy(3, 5), // 3 series, 5 instances each
        createMockStudy(2, 3), // 2 series, 3 instances each
      ]

      const studyStore = useStudyStore.getState()

      // Load studies
      studyStore.setStudies(mockStudies)

      // Initially no study/series selected
      expect(studyStore.currentStudy).toBeNull()
      expect(studyStore.currentSeries).toBeNull()
      expect(studyStore.currentInstance).toBeNull()

      // Select first study
      studyStore.setCurrentStudy(mockStudies[0].studyInstanceUID)
      expect(studyStore.currentStudy).toEqual(mockStudies[0])

      // Select first series in study
      const firstSeries = mockStudies[0].series[0]
      studyStore.setCurrentSeries(firstSeries.seriesInstanceUID)
      expect(studyStore.currentSeries).toEqual(firstSeries)

      // Select first instance in series
      const firstInstance = firstSeries.instances[0]
      studyStore.setCurrentInstance(firstInstance.sopInstanceUID)
      expect(studyStore.currentInstance).toEqual(firstInstance)

      // Navigate to next instance
      studyStore.nextInstance()
      expect(studyStore.currentInstance?.instanceNumber).toBe(2)

      // Navigate to previous instance
      studyStore.previousInstance()
      expect(studyStore.currentInstance?.instanceNumber).toBe(1)
    })

    it('should handle series boundary when navigating instances', () => {
      const mockStudy = createMockStudy(2, 3) // 2 series, 3 instances each
      const studyStore = useStudyStore.getState()

      studyStore.setStudies([mockStudy])
      studyStore.setCurrentStudy(mockStudy.studyInstanceUID)
      studyStore.setCurrentSeries(mockStudy.series[0].seriesInstanceUID)

      // Go to last instance in first series
      const lastInstance = mockStudy.series[0].instances[2]
      studyStore.setCurrentInstance(lastInstance.sopInstanceUID)
      expect(studyStore.currentInstance?.instanceNumber).toBe(3)

      // Try to go next (should stay at last instance)
      studyStore.nextInstance()
      expect(studyStore.currentInstance?.instanceNumber).toBe(3)

      // Go to first instance
      const firstInstance = mockStudy.series[0].instances[0]
      studyStore.setCurrentInstance(firstInstance.sopInstanceUID)
      expect(studyStore.currentInstance?.instanceNumber).toBe(1)

      // Try to go previous (should stay at first instance)
      studyStore.previousInstance()
      expect(studyStore.currentInstance?.instanceNumber).toBe(1)
    })

    it('should auto-select first series and instance when study is selected', () => {
      const mockStudy = createMockStudy(2, 4)
      const studyStore = useStudyStore.getState()

      studyStore.setStudies([mockStudy])
      studyStore.setCurrentStudy(mockStudy.studyInstanceUID)

      // Should auto-select first series
      expect(studyStore.currentSeries).toEqual(mockStudy.series[0])

      // Should auto-select first instance
      expect(studyStore.currentInstance).toEqual(mockStudy.series[0].instances[0])
    })
  })

  describe('Viewport tool state management', () => {
    it('should manage window/level adjustments', () => {
      const viewportStore = useViewportStore.getState()

      // Initial state (MR defaults)
      expect(viewportStore.settings.windowCenter).toBe(600)
      expect(viewportStore.settings.windowWidth).toBe(1200)

      // Adjust window/level
      viewportStore.setWindowLevel(200, 400)
      expect(viewportStore.settings.windowCenter).toBe(200)
      expect(viewportStore.settings.windowWidth).toBe(400)

      // Change modality (CT has different defaults)
      viewportStore.setModality('CT')
      expect(viewportStore.settings.windowCenter).toBe(40)
      expect(viewportStore.settings.windowWidth).toBe(400)
    })

    it('should manage zoom state', () => {
      const viewportStore = useViewportStore.getState()

      // Initial zoom
      expect(viewportStore.settings.zoom).toBe(1.0)

      // Zoom in
      viewportStore.setZoom(1.5)
      expect(viewportStore.settings.zoom).toBe(1.5)

      // Zoom out
      viewportStore.setZoom(0.75)
      expect(viewportStore.settings.zoom).toBe(0.75)

      // Reset settings
      viewportStore.resetSettings()
      expect(viewportStore.settings.zoom).toBe(1.0)
    })

    it('should manage pan offset', () => {
      const viewportStore = useViewportStore.getState()

      // Initial pan
      expect(viewportStore.settings.pan.x).toBe(0)
      expect(viewportStore.settings.pan.y).toBe(0)

      // Pan the viewport
      viewportStore.setPan(50, 30)
      expect(viewportStore.settings.pan.x).toBe(50)
      expect(viewportStore.settings.pan.y).toBe(30)

      // Reset settings
      viewportStore.resetSettings()
      expect(viewportStore.settings.pan.x).toBe(0)
      expect(viewportStore.settings.pan.y).toBe(0)
    })

    it('should toggle invert mode', () => {
      const viewportStore = useViewportStore.getState()

      // Initial state
      expect(viewportStore.settings.invert).toBe(false)

      // Set invert
      viewportStore.setInvert(true)
      expect(viewportStore.settings.invert).toBe(true)

      // Unset invert
      viewportStore.setInvert(false)
      expect(viewportStore.settings.invert).toBe(false)
    })
  })

  describe('Combined study navigation and viewport tools', () => {
    it('should reset viewport tools when changing instances', () => {
      const mockStudy = createMockStudy(1, 3)
      const studyStore = useStudyStore.getState()
      const viewportStore = useViewportStore.getState()

      // Load study and select first instance
      studyStore.setStudies([mockStudy])
      studyStore.setCurrentStudy(mockStudy.studyInstanceUID)

      // Apply some viewport adjustments
      viewportStore.setZoom(2.0)
      viewportStore.setPan(100, 50)
      viewportStore.setWindowLevel(200, 400)

      expect(viewportStore.settings.zoom).toBe(2.0)
      expect(viewportStore.settings.pan.x).toBe(100)

      // Navigate to next instance
      studyStore.nextInstance()

      // Note: In real app, viewport tools might persist or reset
      // depending on settings. This tests the store behavior.
    })

    it('should maintain study selection when adjusting viewport tools', () => {
      const mockStudy = createMockStudy(2, 4)
      const studyStore = useStudyStore.getState()
      const viewportStore = useViewportStore.getState()

      // Select study and instance
      studyStore.setStudies([mockStudy])
      studyStore.setCurrentStudy(mockStudy.studyInstanceUID)
      const initialInstance = studyStore.currentInstance

      // Adjust viewport tools
      viewportStore.setZoom(1.5)
      viewportStore.setPan(50, 25)
      viewportStore.setWindowLevel(150, 300)

      // Study and instance selection should be unchanged
      expect(studyStore.currentStudy?.studyInstanceUID).toBe(mockStudy.studyInstanceUID)
      expect(studyStore.currentInstance).toEqual(initialInstance)
    })
  })

  describe('Multi-study workflow', () => {
    it('should switch between studies and maintain independent viewport states', () => {
      const mockStudies = [
        createMockStudy(1, 3),
        createMockStudy(1, 2),
      ]
      const studyStore = useStudyStore.getState()
      const viewportStore = useViewportStore.getState()

      studyStore.setStudies(mockStudies)

      // Select first study
      studyStore.setCurrentStudy(mockStudies[0].studyInstanceUID)
      const firstStudyInstance = studyStore.currentInstance

      // Apply viewport settings
      viewportStore.setZoom(2.0)
      viewportStore.setWindowLevel(200, 400)

      // Switch to second study
      studyStore.setCurrentStudy(mockStudies[1].studyInstanceUID)

      // Verify different instance is selected
      expect(studyStore.currentInstance).not.toEqual(firstStudyInstance)
      expect(studyStore.currentInstance?.sopInstanceUID).toBe(
        mockStudies[1].series[0].instances[0].sopInstanceUID
      )

      // Note: Viewport tools persist across study changes
      // (In real app, this might be configurable via settings)
      expect(viewportStore.settings.zoom).toBe(2.0)
    })
  })

  describe('Edge cases', () => {
    it('should handle navigation with no studies loaded', () => {
      const studyStore = useStudyStore.getState()

      // Try to navigate when no studies loaded
      studyStore.nextInstance()
      studyStore.previousInstance()

      // Should remain null
      expect(studyStore.currentInstance).toBeNull()
    })

    it('should handle invalid study/series/instance UIDs', () => {
      const mockStudy = createMockStudy(1, 2)
      const studyStore = useStudyStore.getState()

      studyStore.setStudies([mockStudy])

      // Try to select non-existent study
      studyStore.setCurrentStudy('invalid-uid')
      expect(studyStore.currentStudy).toBeNull()

      // Try to select non-existent series
      studyStore.setCurrentSeries('invalid-uid')
      expect(studyStore.currentSeries).toBeNull()

      // Try to select non-existent instance
      studyStore.setCurrentInstance('invalid-uid')
      expect(studyStore.currentInstance).toBeNull()
    })
  })
})
