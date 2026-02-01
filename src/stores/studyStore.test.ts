/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Unit tests for studyStore
 *
 * Critical business logic tests:
 * - Navigation bounds (first/last instance)
 * - Cross-study series lookup (complex nested loop)
 * - State cascading on setStudies/setCurrentStudy/setCurrentSeries
 * - Index clamping edge cases
 *
 * Target: ~50 assertions, 95%+ coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useStudyStore } from './studyStore'
import {
  createMockStudy,
  _createMockSeries,
  _createMockInstance,
  _createMockMultiStudyDataset,
} from '@/test/fixtures/dicomData'

describe('studyStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useStudyStore.getState().reset()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStudyStore.getState()
      expect(state.studies).toEqual([])
      expect(state.currentStudy).toBeNull()
      expect(state.currentSeries).toBeNull()
      expect(state.currentInstance).toBeNull()
      expect(state.currentInstanceIndex).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setStudies', () => {
    it('should set studies', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)

      const state = useStudyStore.getState()
      expect(state.studies).toEqual(studies)
    })

    it('should automatically set current study when studies added', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)

      const state = useStudyStore.getState()
      expect(state.currentStudy).toEqual(studies[0])
    })

    it('should cascade to setCurrentSeries when studies added', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)

      const state = useStudyStore.getState()
      expect(state.currentSeries).toEqual(studies[0].series[0])
    })

    it('should set first instance when studies added', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)

      const state = useStudyStore.getState()
      expect(state.currentInstance).toEqual(studies[0].series[0].instances[0])
      expect(state.currentInstanceIndex).toBe(0)
    })

    it('should handle empty studies array', () => {
      useStudyStore.getState().setStudies([])

      const state = useStudyStore.getState()
      expect(state.studies).toEqual([])
      expect(state.currentStudy).toBeNull()
    })

    it('should replace existing studies', () => {
      const studies1 = [createMockStudy(1, 2)]
      const studies2 = [createMockStudy(2, 3)]

      useStudyStore.getState().setStudies(studies1)
      useStudyStore.getState().setStudies(studies2)

      const state = useStudyStore.getState()
      expect(state.studies).toEqual(studies2)
      expect(state.currentStudy).toEqual(studies2[0])
    })
  })

  describe('addStudy', () => {
    it('should add study to existing studies', () => {
      const study1 = createMockStudy(1, 2, {
        studyInstanceUID: 'study-1',
      })
      const study2 = createMockStudy(1, 2, {
        studyInstanceUID: 'study-2',
      })

      useStudyStore.getState().setStudies([study1])
      useStudyStore.getState().addStudy(study2)

      const state = useStudyStore.getState()
      expect(state.studies).toHaveLength(2)
      expect(state.studies[0]).toEqual(study1)
      expect(state.studies[1]).toEqual(study2)
    })

    it('should not automatically change current study when adding', () => {
      const study1 = createMockStudy(1, 2, {
        studyInstanceUID: 'study-1',
      })
      const study2 = createMockStudy(1, 2, {
        studyInstanceUID: 'study-2',
      })

      useStudyStore.getState().setStudies([study1])
      const initialCurrentStudy = useStudyStore.getState().currentStudy

      useStudyStore.getState().addStudy(study2)

      const state = useStudyStore.getState()
      expect(state.currentStudy).toEqual(initialCurrentStudy)
      expect(state.currentStudy?.studyInstanceUID).toBe('study-1')
    })
  })

  describe('setCurrentStudy', () => {
    it('should set current study by UID', () => {
      const study1 = createMockStudy(2, 3, {
        studyInstanceUID: 'study-uid-1',
        studyDescription: 'Study 1',
      })
      const study2 = createMockStudy(2, 3, {
        studyInstanceUID: 'study-uid-2',
        studyDescription: 'Study 2',
      })
      // Ensure unique series UIDs to avoid collision
      study1.series[0].seriesInstanceUID = 'series-study1-1'
      study1.series[1].seriesInstanceUID = 'series-study1-2'
      study2.series[0].seriesInstanceUID = 'series-study2-1'
      study2.series[1].seriesInstanceUID = 'series-study2-2'

      useStudyStore.getState().setStudies([study1, study2])

      // Should initially be on study1
      expect(useStudyStore.getState().currentStudy?.studyInstanceUID).toBe('study-uid-1')

      // Switch to study2
      useStudyStore.getState().setCurrentStudy('study-uid-2')

      const state = useStudyStore.getState()
      expect(state.currentStudy?.studyInstanceUID).toBe('study-uid-2')
      expect(state.currentStudy?.studyDescription).toBe('Study 2')
    })

    it('should cascade to setCurrentSeries', () => {
      const study1 = createMockStudy(2, 3, {
        studyInstanceUID: 'study-uid-1',
      })
      const study2 = createMockStudy(2, 3, {
        studyInstanceUID: 'study-uid-2',
      })
      // Ensure unique series UIDs
      study1.series[0].seriesInstanceUID = 'series-study1-1'
      study1.series[1].seriesInstanceUID = 'series-study1-2'
      study2.series[0].seriesInstanceUID = 'series-study2-1'
      study2.series[1].seriesInstanceUID = 'series-study2-2'

      useStudyStore.getState().setStudies([study1, study2])
      useStudyStore.getState().setCurrentStudy('study-uid-2')

      const state = useStudyStore.getState()
      expect(state.currentSeries?.seriesInstanceUID).toBe('series-study2-1')
      expect(state.currentSeries?.seriesDescription).toBe(study2.series[0].seriesDescription)
    })

    it('should handle non-existent study UID gracefully', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)
      const initialCurrentStudy = useStudyStore.getState().currentStudy

      useStudyStore.getState().setCurrentStudy('non-existent-uid')

      const state = useStudyStore.getState()
      expect(state.currentStudy).toEqual(initialCurrentStudy)
    })
  })

  describe('setCurrentSeries - Cross-Study Lookup', () => {
    it('should find series in current study', () => {
      const studies = [createMockStudy(3, 5)]
      useStudyStore.getState().setStudies(studies)

      const _targetSeries = studies[0].series[1]
      useStudyStore.getState().setCurrentSeries(targetSeries.seriesInstanceUID)

      const state = useStudyStore.getState()
      expect(state.currentSeries).toEqual(targetSeries)
      expect(state.currentStudy).toEqual(studies[0])
    })

    it('should find series in different study (cross-study lookup)', () => {
      const study1 = createMockStudy(2, 3, {
        studyInstanceUID: 'study-uid-1',
      })
      // Manually set unique series UIDs for study2 to avoid collision
      study1.series[0].seriesInstanceUID = 'series-study1-1'
      study1.series[1].seriesInstanceUID = 'series-study1-2'

      const study2 = createMockStudy(1, 3, {
        studyInstanceUID: 'study-uid-2',
      })
      study2.series[0].seriesInstanceUID = 'series-study2-1'

      useStudyStore.getState().setStudies([study1, study2])

      // Should initially be on study1
      expect(useStudyStore.getState().currentStudy?.studyInstanceUID).toBe('study-uid-1')

      // Switch to series in study2 (cross-study lookup)
      const _targetSeries = study2.series[0]
      useStudyStore.getState().setCurrentSeries('series-study2-1')

      const state = useStudyStore.getState()
      expect(state.currentSeries?.seriesInstanceUID).toBe('series-study2-1')
      expect(state.currentStudy?.studyInstanceUID).toBe('study-uid-2')
    })

    it('should reset instance index to 0 when changing series', () => {
      const studies = [createMockStudy(2, 5)]
      useStudyStore.getState().setStudies(studies)

      // Navigate to instance 3
      useStudyStore.getState().setCurrentInstance(3)
      expect(useStudyStore.getState().currentInstanceIndex).toBe(3)

      // Switch series - should reset to index 0
      useStudyStore.getState().setCurrentSeries(
        studies[0].series[1].seriesInstanceUID
      )

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(0)
    })

    it('should set first instance of new series', () => {
      const studies = [createMockStudy(2, 5)]
      useStudyStore.getState().setStudies(studies)

      const _targetSeries = studies[0].series[1]
      useStudyStore.getState().setCurrentSeries(targetSeries.seriesInstanceUID)

      const state = useStudyStore.getState()
      expect(state.currentInstance).toEqual(targetSeries.instances[0])
    })

    it('should handle non-existent series UID gracefully', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)
      const initialState = useStudyStore.getState()

      useStudyStore.getState().setCurrentSeries('non-existent-uid')

      const state = useStudyStore.getState()
      expect(state.currentSeries).toEqual(initialState.currentSeries)
      expect(state.currentStudy).toEqual(initialState.currentStudy)
    })
  })

  describe('setCurrentInstance - Index Clamping', () => {
    it('should set instance by index', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(2)

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(2)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[2]
      )
    })

    it('should clamp negative index to 0', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(-5)

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(0)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[0]
      )
    })

    it('should clamp index beyond length to last instance', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(999)

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(4) // length - 1
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[4]
      )
    })

    it('should handle exactly last valid index', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(4) // last index

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(4)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[4]
      )
    })

    it('should handle no current series gracefully', () => {
      useStudyStore.getState().setCurrentInstance(5)

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(0) // initial state
      expect(state.currentInstance).toBeNull()
    })
  })

  describe('nextInstance - Navigation Bounds', () => {
    it('should navigate to next instance', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().nextInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(1)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[1]
      )
    })

    it('should not go beyond last instance', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      // Navigate to last instance
      useStudyStore.getState().setCurrentInstance(4)
      expect(useStudyStore.getState().currentInstanceIndex).toBe(4)

      // Try to go next - should stay at 4
      useStudyStore.getState().nextInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(4)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[4]
      )
    })

    it('should handle multiple next calls', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().nextInstance()
      useStudyStore.getState().nextInstance()
      useStudyStore.getState().nextInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(3)
    })

    it('should handle no current series gracefully', () => {
      useStudyStore.getState().nextInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(0)
      expect(state.currentInstance).toBeNull()
    })
  })

  describe('previousInstance - Navigation Bounds', () => {
    it('should navigate to previous instance', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(2)
      useStudyStore.getState().previousInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(1)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[1]
      )
    })

    it('should not go below 0', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      // Already at index 0
      expect(useStudyStore.getState().currentInstanceIndex).toBe(0)

      // Try to go previous - should stay at 0
      useStudyStore.getState().previousInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(0)
      expect(state.currentInstance).toEqual(
        studies[0].series[0].instances[0]
      )
    })

    it('should handle multiple previous calls', () => {
      const studies = [createMockStudy(1, 5)]
      useStudyStore.getState().setStudies(studies)

      useStudyStore.getState().setCurrentInstance(4)
      useStudyStore.getState().previousInstance()
      useStudyStore.getState().previousInstance()
      useStudyStore.getState().previousInstance()

      const state = useStudyStore.getState()
      expect(state.currentInstanceIndex).toBe(1)
    })
  })

  describe('Loading and Error State', () => {
    it('should set loading state', () => {
      useStudyStore.getState().setLoading(true)
      expect(useStudyStore.getState().isLoading).toBe(true)

      useStudyStore.getState().setLoading(false)
      expect(useStudyStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      useStudyStore.getState().setError('Test error')
      expect(useStudyStore.getState().error).toBe('Test error')

      useStudyStore.getState().setError(null)
      expect(useStudyStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const studies = [createMockStudy(2, 3)]
      useStudyStore.getState().setStudies(studies)
      useStudyStore.getState().setLoading(true)
      useStudyStore.getState().setError('Test error')
      useStudyStore.getState().nextInstance()

      // Verify state has changed
      expect(useStudyStore.getState().studies).not.toEqual([])

      // Reset
      useStudyStore.getState().reset()

      // Verify back to initial state
      const state = useStudyStore.getState()
      expect(state.studies).toEqual([])
      expect(state.currentStudy).toBeNull()
      expect(state.currentSeries).toBeNull()
      expect(state.currentInstance).toBeNull()
      expect(state.currentInstanceIndex).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
