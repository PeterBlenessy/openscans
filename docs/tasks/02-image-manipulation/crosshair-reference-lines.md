# Task: Implement Crosshair / Reference Lines

**Feature**: [Crosshair / Reference Lines](../../features/02-image-manipulation/crosshair-reference-lines.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: High (5-7 days)
**Dependencies**: Split/Comparison View (required first)

## Overview

Display reference lines on one viewport showing the current slice position from another viewport. This requires the split view feature to be implemented first as reference lines only make sense when two viewports are visible simultaneously.

## Implementation Steps

### Step 1: Calculate Slice Position Geometry

**File**: `src/lib/dicom/sliceGeometry.ts`

1. Create utility functions to extract slice position and orientation from DICOM metadata:
   - `getImagePosition(metadata): [number, number, number]` — tag (0020,0032)
   - `getImageOrientation(metadata): [number, number, number, number, number, number]` — tag (0020,0037)
   - `getSliceThickness(metadata): number` — tag (0018,0050)
2. Create `calculateIntersectionLine(plane1, plane2): Line2D | null`
   - Compute the intersection of two image planes in 3D space
   - Project the intersection line onto the target viewport's 2D coordinate system
   - Return null if planes are parallel (no intersection)

### Step 2: Create Reference Line Overlay Component

**File**: `src/components/viewer/ReferenceLineOverlay.tsx`

1. Create an SVG or Canvas overlay component that renders reference lines
2. Accept props: `intersectionLine: Line2D | null`, `color: string`
3. Render a dashed line across the viewport at the intersection position
4. Update dynamically as either viewport scrolls

### Step 3: Integrate with Split View Viewports

**File**: `src/components/viewer/SplitViewport.tsx` (depends on split view implementation)

1. When two viewports are visible, compute intersection lines between their current slices
2. Pass intersection data to `ReferenceLineOverlay` in each viewport
3. Update on scroll events from either viewport
4. Only show reference lines when both series have valid spatial metadata

### Step 4: Add Toggle Control

**File**: `src/stores/viewportStore.ts`

1. Add `showReferenceLines: boolean` to viewport state
2. Add `toggleReferenceLines()` action
3. Add toggle button to viewport toolbar (visible only in split view mode)

### Step 5: Add Tests

1. Unit tests for slice geometry calculations
2. Unit tests for intersection line computation
3. Test edge cases: parallel planes, oblique acquisitions, missing metadata

## Acceptance Criteria

- [ ] Reference lines display on each viewport showing the other viewport's slice position
- [ ] Lines update dynamically as user scrolls in either viewport
- [ ] No reference lines shown for parallel image planes
- [ ] Toggle to show/hide reference lines
- [ ] Graceful handling of missing spatial metadata
- [ ] Only visible in split view mode
