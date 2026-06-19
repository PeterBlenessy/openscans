import { useEffect, useRef } from 'react'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { nextCineIndex } from '@/lib/cine/cineAdvance'

interface UseCinePlaybackReturn {
  /** Whether cine playback is currently running */
  isPlaying: boolean
  /** Active playback speed in frames per second */
  currentFps: number
}

/**
 * Drives automatic cine playback through the current series.
 *
 * Reads cine state (enabled, frame rate, direction, loop mode) from the viewport
 * store and the current instance index / count from the study store. While
 * enabled it advances the displayed instance on a `setInterval` of
 * `1000 / frameRate` ms using the pure {@link nextCineIndex} helper.
 *
 * Auto-pause: playback stops automatically when
 * - the user manually navigates (the index changes to one the loop didn't set),
 * - the active series changes,
 * - the component unmounts,
 * - 'once' mode reaches the end of the series.
 *
 * @returns `{ isPlaying, currentFps }` for UI display
 */
export function useCinePlayback(): UseCinePlaybackReturn {
  const cineEnabled = useViewportStore((s) => s.cineEnabled)
  const frameRate = useViewportStore((s) => s.cineFrameRate)
  const direction = useViewportStore((s) => s.cineDirection)
  const loopMode = useViewportStore((s) => s.cineLoopMode)

  const currentSeries = useStudyStore((s) => s.currentSeries)
  const currentInstanceIndex = useStudyStore((s) => s.currentInstanceIndex)

  // Mutable direction for bounce mode (so a re-render isn't needed each flip).
  const directionRef = useRef(direction)
  // The index the cine loop most recently committed; lets us distinguish loop
  // advances from manual navigation for auto-pause.
  const lastSetIndexRef = useRef<number | null>(null)

  const seriesUID = currentSeries?.seriesInstanceUID ?? null
  const total = currentSeries?.instances.length ?? 0

  // Reset the bounce direction whenever the user picks a new explicit direction.
  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  // Auto-pause when the series changes.
  useEffect(() => {
    if (cineEnabled) {
      useViewportStore.getState().setCineEnabled(false)
    }
    lastSetIndexRef.current = null
    // We intentionally only depend on the series UID — switching series stops cine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesUID])

  // Auto-pause on manual navigation: if the index changed to a value the loop
  // did not set while cine is running, the user moved it — stop playback.
  useEffect(() => {
    if (!cineEnabled) return
    if (lastSetIndexRef.current !== null && currentInstanceIndex !== lastSetIndexRef.current) {
      useViewportStore.getState().setCineEnabled(false)
    }
  }, [currentInstanceIndex, cineEnabled])

  // The playback interval.
  useEffect(() => {
    if (!cineEnabled || total <= 1) return

    directionRef.current = direction
    lastSetIndexRef.current = useStudyStore.getState().currentInstanceIndex

    const intervalMs = 1000 / frameRate
    const interval = window.setInterval(() => {
      const studyState = useStudyStore.getState()
      const step = nextCineIndex({
        index: studyState.currentInstanceIndex,
        total,
        direction: directionRef.current,
        loopMode,
      })

      if (step.stopped) {
        useViewportStore.getState().setCineEnabled(false)
        return
      }

      directionRef.current = step.direction
      lastSetIndexRef.current = step.index
      studyState.setCurrentInstance(step.index)
    }, intervalMs)

    return () => window.clearInterval(interval)
    // total/seriesUID changes are handled by their own effects above.
  }, [cineEnabled, frameRate, direction, loopMode, total])

  return { isPlaying: cineEnabled, currentFps: frameRate }
}
