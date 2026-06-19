import { describe, it, expect } from 'vitest'
import { nextCineIndex } from './cineAdvance'

describe('nextCineIndex', () => {
  describe('forward direction', () => {
    it('advances by one frame mid-series', () => {
      const step = nextCineIndex({ index: 2, total: 10, direction: 'forward', loopMode: 'loop' })
      expect(step).toEqual({ index: 3, direction: 'forward', stopped: false })
    })

    it('wraps to the first frame in loop mode at the end', () => {
      const step = nextCineIndex({ index: 9, total: 10, direction: 'forward', loopMode: 'loop' })
      expect(step).toEqual({ index: 0, direction: 'forward', stopped: false })
    })

    it('stops at the last frame in once mode', () => {
      const step = nextCineIndex({ index: 9, total: 10, direction: 'forward', loopMode: 'once' })
      expect(step).toEqual({ index: 9, direction: 'forward', stopped: true })
    })

    it('bounces (reverses) at the last frame', () => {
      const step = nextCineIndex({ index: 9, total: 10, direction: 'forward', loopMode: 'bounce' })
      expect(step).toEqual({ index: 8, direction: 'reverse', stopped: false })
    })
  })

  describe('reverse direction', () => {
    it('advances backward by one frame mid-series', () => {
      const step = nextCineIndex({ index: 5, total: 10, direction: 'reverse', loopMode: 'loop' })
      expect(step).toEqual({ index: 4, direction: 'reverse', stopped: false })
    })

    it('wraps to the last frame in loop mode at the start', () => {
      const step = nextCineIndex({ index: 0, total: 10, direction: 'reverse', loopMode: 'loop' })
      expect(step).toEqual({ index: 9, direction: 'reverse', stopped: false })
    })

    it('stops at the first frame in once mode', () => {
      const step = nextCineIndex({ index: 0, total: 10, direction: 'reverse', loopMode: 'once' })
      expect(step).toEqual({ index: 0, direction: 'reverse', stopped: true })
    })

    it('bounces (reverses to forward) at the first frame', () => {
      const step = nextCineIndex({ index: 0, total: 10, direction: 'reverse', loopMode: 'bounce' })
      expect(step).toEqual({ index: 1, direction: 'forward', stopped: false })
    })
  })

  describe('edge cases', () => {
    it('is a no-op for a single-frame series (loop)', () => {
      const step = nextCineIndex({ index: 0, total: 1, direction: 'forward', loopMode: 'loop' })
      expect(step).toEqual({ index: 0, direction: 'forward', stopped: false })
    })

    it('stops immediately for a single-frame series in once mode', () => {
      const step = nextCineIndex({ index: 0, total: 1, direction: 'forward', loopMode: 'once' })
      expect(step).toEqual({ index: 0, direction: 'forward', stopped: true })
    })

    it('clamps a stale out-of-range index back in bounds', () => {
      const step = nextCineIndex({ index: 99, total: 5, direction: 'forward', loopMode: 'loop' })
      // index clamped to 4 (last), forward at end loops to 0
      expect(step.index).toBe(0)
    })

    it('handles an empty series without throwing', () => {
      const step = nextCineIndex({ index: 0, total: 0, direction: 'forward', loopMode: 'loop' })
      expect(step.index).toBe(0)
      expect(step.stopped).toBe(false)
    })

    it('ping-pongs across a full bounce cycle on a 3-frame series', () => {
      // 0 ->(fwd) 1 ->(fwd) 2 (boundary -> reverse) -> 1 ->(rev) 0 (boundary -> forward) -> 1
      let state = { index: 0, direction: 'forward' as const, total: 3 }
      const seq: number[] = []
      for (let i = 0; i < 6; i++) {
        const step = nextCineIndex({
          index: state.index,
          total: state.total,
          direction: state.direction,
          loopMode: 'bounce',
        })
        seq.push(step.index)
        state = { index: step.index, direction: step.direction, total: state.total }
      }
      expect(seq).toEqual([1, 2, 1, 0, 1, 2])
    })
  })
})
