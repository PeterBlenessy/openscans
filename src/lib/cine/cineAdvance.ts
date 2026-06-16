import type { CineDirection, CineLoopMode } from '@/stores/viewportStore'

export interface CineStep {
  /** Index to display next (0-based, always within [0, total-1]) */
  index: number
  /** Direction to use on the following tick (bounce flips at the boundaries) */
  direction: CineDirection
  /** True once the sequence has finished (only ever set in 'once' mode) */
  stopped: boolean
}

export interface CineAdvanceInput {
  /** Current 0-based instance index */
  index: number
  /** Total number of instances in the series */
  total: number
  /** Direction of travel for this tick */
  direction: CineDirection
  /** Boundary behaviour */
  loopMode: CineLoopMode
}

/**
 * Pure frame-advance for the cine loop. Given the current index, series length,
 * direction, and loop mode, returns the next index plus the direction to use on
 * the subsequent tick and whether playback should stop.
 *
 * Boundary behaviour:
 * - **loop**: wraps around (last → first when forward, first → last when reverse)
 * - **bounce**: reverses direction at the first/last frame (ping-pong)
 * - **once**: advances to the boundary then stops (`stopped: true`)
 *
 * Single-frame and empty series are no-ops (index stays clamped, stops in 'once').
 *
 * @param input - Current index, total, direction, and loop mode
 * @returns The next {@link CineStep}
 */
export function nextCineIndex(input: CineAdvanceInput): CineStep {
  const { total, direction, loopMode } = input
  // Clamp the incoming index defensively so a stale index can't escape bounds.
  const index = Math.max(0, Math.min(input.index, Math.max(0, total - 1)))

  if (total <= 1) {
    return { index, direction, stopped: loopMode === 'once' }
  }

  const lastIndex = total - 1
  const delta = direction === 'forward' ? 1 : -1
  const candidate = index + delta
  const atUpperBoundary = candidate > lastIndex
  const atLowerBoundary = candidate < 0

  if (!atUpperBoundary && !atLowerBoundary) {
    return { index: candidate, direction, stopped: false }
  }

  // Reached a boundary — behaviour depends on loop mode.
  switch (loopMode) {
    case 'loop':
      return {
        index: atUpperBoundary ? 0 : lastIndex,
        direction,
        stopped: false,
      }
    case 'bounce': {
      const flipped: CineDirection = direction === 'forward' ? 'reverse' : 'forward'
      // Step one frame back inward in the flipped direction.
      const bounced = atUpperBoundary ? lastIndex - 1 : 1
      return { index: bounced, direction: flipped, stopped: false }
    }
    case 'once':
      // Stay at the boundary frame and halt.
      return { index, direction, stopped: true }
  }
}
