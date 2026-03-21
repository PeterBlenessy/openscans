# Task: Implement Full-Screen Mode

**Feature**: [Full-Screen Mode](../../features/03-advanced-viewing/fullscreen-mode.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: Low (0.5-1 day)
**Dependencies**: None

## Overview

Expand the viewport to fill the entire screen using the Browser Fullscreen API. Auto-hide UI elements and show them on mouse hover.

## Implementation Steps

### Step 1: Add Fullscreen State and Logic

**File**: `src/hooks/useFullscreen.ts`

1. Create a custom hook `useFullscreen(elementRef: RefObject<HTMLElement>)`:
   ```typescript
   export function useFullscreen(elementRef: RefObject<HTMLElement>) {
     const [isFullscreen, setIsFullscreen] = useState(false)

     const toggleFullscreen = useCallback(async () => {
       if (!document.fullscreenElement) {
         await elementRef.current?.requestFullscreen()
       } else {
         await document.exitFullscreen()
       }
     }, [elementRef])

     useEffect(() => {
       const handler = () => setIsFullscreen(!!document.fullscreenElement)
       document.addEventListener('fullscreenchange', handler)
       return () => document.removeEventListener('fullscreenchange', handler)
     }, [])

     return { isFullscreen, toggleFullscreen }
   }
   ```
2. Handle vendor prefixes (`webkitRequestFullscreen` for Safari)

### Step 2: Add Fullscreen Button to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add a fullscreen toggle button using `Maximize2` / `Minimize2` Lucide icons
2. Place it at the end of the toolbar (rightmost position)
3. Switch icon based on `isFullscreen` state

### Step 3: Auto-Hide UI in Fullscreen

**File**: `src/components/viewer/DicomViewport.tsx`

1. When in fullscreen mode, add CSS classes to hide the toolbar and sidebars
2. Show toolbar on mouse hover (top area) with a CSS transition:
   ```css
   .fullscreen-toolbar {
     opacity: 0;
     transition: opacity 0.3s;
   }
   .fullscreen-toolbar:hover,
   .fullscreen-container:hover .fullscreen-toolbar {
     opacity: 1;
   }
   ```
3. Hide the left drawer and metadata panel in fullscreen

### Step 4: Add Keyboard Shortcut

**File**: `src/hooks/useViewportKeyboard.ts`

1. Add `F11` or `Shift+F` to toggle fullscreen
2. Note: `Escape` exits fullscreen by browser default (no code needed)
3. Update keyboard shortcuts help dialog

### Step 5: Add Tests

1. Test fullscreen state tracking
2. Test toggle function calls the correct API
3. Test cleanup on unmount

## Acceptance Criteria

- [ ] Fullscreen button in the toolbar
- [ ] Clicking toggles fullscreen mode
- [ ] UI elements auto-hide in fullscreen
- [ ] Toolbar appears on mouse hover
- [ ] Escape exits fullscreen
- [ ] Keyboard shortcut works
- [ ] Works in Chrome, Firefox, Safari
