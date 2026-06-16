# Task: Implement Touch / Mobile Support

**Feature**: [Touch / Mobile Support](../../features/08-ux-accessibility/touch-mobile-support.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (4-5 days)
**Dependencies**: None

## Overview

Optimize the UI for touch-based devices (primarily tablets) with gesture support for zoom, pan, and W/L adjustment.

## Implementation Steps

### Step 1: Add Touch Gesture Handlers

**File**: `src/hooks/useViewportTouch.ts`

1. Create a hook for touch interactions:
   ```typescript
   export function useViewportTouch(elementRef: RefObject<HTMLElement>) {
     // Pinch-to-zoom: two-finger spread/pinch
     // Two-finger drag: pan
     // Single-finger drag: W/L adjustment (or configurable)
     // Swipe up/down: navigate instances
   }
   ```
2. Use touch events (`touchstart`, `touchmove`, `touchend`)
3. Calculate pinch distance for zoom
4. Calculate two-finger center movement for pan
5. Prevent default to avoid browser zoom/scroll interference

### Step 2: Increase Touch Target Sizes

**File**: Various component files

1. Increase toolbar button sizes for touch (min 44x44px per WCAG)
2. Add padding to clickable areas
3. Use Tailwind responsive classes:
   ```html
   <button className="p-2 md:p-1 min-h-[44px] md:min-h-0">
   ```

### Step 3: Create Responsive Layout

**File**: `src/components/layout/LeftDrawer.tsx`

1. Auto-collapse sidebar on small screens
2. Full-screen drawer overlay on mobile (slide-in from left)
3. Use Tailwind breakpoints: `sm:`, `md:`, `lg:`
4. Hide non-essential UI on small screens

### Step 4: Optimize Viewport for Touch

**File**: `src/components/viewer/DicomViewport.tsx`

1. Maximize viewport area on small screens
2. Move toolbar to bottom on portrait orientation
3. Floating action button for tool switching on mobile

### Step 5: Add Gesture Configuration

**File**: `src/stores/settingsStore.ts`

1. Add touch gesture configuration:
   - Single-finger action: W/L (default) or Pan
   - Swipe action: Navigate (default) or Scroll
2. Configurable in settings panel

### Step 6: Add Tests

1. Test touch gesture calculations (pinch distance, pan offset)
2. Test responsive breakpoints
3. Test on tablet viewport sizes

## Acceptance Criteria

- [ ] Pinch-to-zoom works on touch devices
- [ ] Two-finger drag pans the image
- [ ] Single-finger drag adjusts W/L (or configurable)
- [ ] Swipe up/down navigates instances
- [ ] Touch targets are at least 44x44px
- [ ] Sidebar collapses on small screens
- [ ] Usable on iPad-sized screens
