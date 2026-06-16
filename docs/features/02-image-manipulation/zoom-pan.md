# Zoom and Pan

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Essential

## Description

Magnify regions of interest with mouse wheel zoom and reposition the image within the viewport by click-and-drag panning. Essential for examining fine anatomical details.

## Benefits

- **Detail inspection** — Zoom into small structures (fracture lines, lesion margins, vertebral endplates) that are not visible at overview magnification
- **Context navigation** — Pan to move around a zoomed image without losing the current zoom level
- **Configurable** — Zoom sensitivity can be adjusted in settings to match user preference
- **Familiar controls** — Mouse wheel zoom and drag-to-pan are standard interactions users already know

## Current Implementation

- Mouse wheel zoom with configurable sensitivity
- Click-and-drag panning
- Fit-to-screen button to reset zoom and position
- Zoom in/out buttons in the toolbar for precise control

## Key Files

- `src/hooks/useViewportPanAndZoom.ts`
- `src/stores/viewportStore.ts`
- `src/components/viewer/ViewportToolbar.tsx`
