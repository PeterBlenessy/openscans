# Task: Implement Cine Loop / Auto-Play

**Feature**: [Cine Loop / Auto-Play](../../features/02-image-manipulation/cine-loop.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: Low (1-2 days)
**Dependencies**: None (uses existing navigation infrastructure)

## Overview

Automatically play through a series of images in sequence with configurable speed, direction, and loop mode. Leverages the existing study store's `nextInstance()`/`previousInstance()` navigation actions.

## Implementation Steps

### Step 1: Add Cine State to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add cine-related state to the store interface:
   ```typescript
   cineEnabled: boolean
   cineFrameRate: number    // frames per second (1-30, default 10)
   cineDirection: 'forward' | 'reverse'
   cineLoopMode: 'loop' | 'bounce' | 'once'
   ```
2. Add actions:
   - `toggleCine()` — start/stop cine playback
   - `setCineFrameRate(fps: number)` — set playback speed
   - `setCineDirection(dir)` — set direction
   - `setCineLoopMode(mode)` — set loop behavior
3. Store frame rate preference in localStorage

### Step 2: Create Cine Playback Hook

**File**: `src/hooks/useCinePlayback.ts`

1. Create a custom hook `useCinePlayback()` that:
   - Reads cine state from viewport store
   - Reads current instance index and total count from study store
   - Uses `setInterval` with `1000 / frameRate` interval
   - Calls `nextInstance()` or `previousInstance()` per direction
   - Handles bounce mode (reverses at first/last frame)
   - Handles once mode (stops at the end)
   - Cleans up interval on unmount or when cine is disabled
2. Return `{ isPlaying, currentFps }` for UI display

```typescript
export function useCinePlayback() {
  const cineEnabled = useViewportStore((s) => s.cineEnabled)
  const frameRate = useViewportStore((s) => s.cineFrameRate)
  const direction = useViewportStore((s) => s.cineDirection)
  const loopMode = useViewportStore((s) => s.cineLoopMode)
  const nextInstance = useStudyStore((s) => s.nextInstance)
  const previousInstance = useStudyStore((s) => s.previousInstance)

  useEffect(() => {
    if (!cineEnabled) return
    const interval = setInterval(() => {
      // advance frame based on direction, handle loop modes
    }, 1000 / frameRate)
    return () => clearInterval(interval)
  }, [cineEnabled, frameRate, direction, loopMode])
}
```

### Step 3: Add Cine Controls to Viewport Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add a play/pause button (Play icon when stopped, Pause icon when playing)
2. Add a speed control dropdown or slider (presets: 5, 10, 15, 20, 30 fps)
3. Use Lucide React icons: `Play`, `Pause`, `SkipForward`, `SkipBack`
4. Show current FPS when playing
5. Visually indicate active cine state (e.g., pulsing button)

### Step 4: Add Keyboard Shortcuts

**File**: `src/hooks/useViewportKeyboard.ts`

1. Add `Space` key to toggle cine play/pause
2. Add `+`/`-` keys to increase/decrease frame rate
3. Update keyboard shortcuts help dialog with new shortcuts

### Step 5: Auto-Pause on Manual Navigation

**File**: `src/hooks/useCinePlayback.ts`

1. Stop cine playback when user manually navigates (arrow keys, slider, thumbnail click)
2. Stop cine playback when user changes series
3. Stop cine playback when viewport is unmounted

### Step 6: Add Unit Tests

**File**: `src/hooks/__tests__/useCinePlayback.test.ts`

1. Test play/pause toggle
2. Test frame rate changes affect interval timing
3. Test bounce mode reverses at boundaries
4. Test once mode stops at end
5. Test cleanup on unmount

## Acceptance Criteria

- [ ] Play button starts automatic image advancement
- [ ] Pause button stops playback
- [ ] Frame rate is adjustable (5-30 fps)
- [ ] Loop mode cycles continuously
- [ ] Bounce mode reverses at first/last frame
- [ ] Once mode stops at the end
- [ ] Space bar toggles play/pause
- [ ] Manual navigation stops cine playback
- [ ] Frame rate preference persists across sessions
