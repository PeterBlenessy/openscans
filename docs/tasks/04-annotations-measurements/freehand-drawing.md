# Task: Implement Freehand Drawing

**Feature**: [Freehand Drawing](../../features/04-annotations-measurements/freehand-drawing.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (2-3 days)
**Dependencies**: ROI tools (shares overlay infrastructure)

## Overview

Draw freeform shapes on the image by clicking and dragging. Supports both closed contours (for area measurement) and open paths (for highlighting).

## Implementation Steps

### Step 1: Register Cornerstone Freehand Tool

**File**: `src/lib/cornerstone/initCornerstone.ts`

1. Register `FreehandRoiTool`:
   ```typescript
   import { FreehandRoiTool } from 'cornerstone-tools'
   cornerstoneTools.addTool(FreehandRoiTool)
   ```

### Step 2: Add Freehand Tool to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add `{ name: 'FreehandRoi', mode: 'passive' }` to tools

### Step 3: Implement Path Smoothing

**File**: `src/lib/annotations/pathSmoothing.ts`

1. Apply Catmull-Rom or Chaikin smoothing to raw mouse points
2. Reduce point count while preserving shape (Douglas-Peucker simplification)
3. This prevents jagged paths from rapid mouse movement

### Step 4: Create Freehand Overlay

**File**: `src/components/viewer/MeasurementOverlay.tsx`

1. Extend existing overlay to render freehand paths
2. Render the path as a polyline/polygon on SVG or Canvas
3. Close the path automatically when the endpoint is near the start point
4. Display area measurement for closed contours

### Step 5: Persist as RegionAnnotation

1. Store the freehand path as a `RegionAnnotation`:
   ```typescript
   {
     type: 'region',
     points: smoothedPoints,
     closed: isClosedContour,
   }
   ```

### Step 6: Add Toolbar Button and Shortcut

1. Add freehand draw button to the measurement tools dropdown
2. Use `Pencil` or `PenTool` Lucide icon
3. Add keyboard shortcut (e.g., `D` for draw)

### Step 7: Add Tests

1. Test path smoothing algorithm
2. Test point reduction
3. Test closed contour detection

## Acceptance Criteria

- [ ] User can draw freehand shapes by clicking and dragging
- [ ] Path is smoothed to remove jitter
- [ ] Closed contours display area measurement
- [ ] Open paths render as highlighting marks
- [ ] Drawings persist in the annotation store
- [ ] Toolbar button available
