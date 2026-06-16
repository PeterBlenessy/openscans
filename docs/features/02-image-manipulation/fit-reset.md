# Fit to Screen / Reset View

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Essential

## Description

Reset the viewport to its default state — fitting the image to the viewport dimensions and clearing all zoom, pan, rotation, flip, and inversion adjustments. Provides a quick way to return to a known-good viewing state.

## Benefits

- **Quick recovery** — If a user over-zooms or loses their place after panning, one click restores the default view
- **Consistent starting point** — Ensures every review starts from the same baseline display
- **Keyboard accessible** — Available via keyboard shortcut (R) for fast workflow

## Current Implementation

- "Fit to Window" button — resets zoom and pan only
- "Reset View" button — resets all viewport settings (W/L, zoom, pan, rotation, flip, invert)
- Keyboard shortcut (R) for full reset

## Key Files

- `src/stores/viewportStore.ts`
- `src/components/viewer/ViewportToolbar.tsx`
