# Task: Implement Segmentation Overlays

**Feature**: [Segmentation Overlays](../../features/05-segmentation/segmentation-overlays.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: None (foundational for all segmentation features)

## Overview

Render segmentation masks as semi-transparent colored overlays on the image. This is the visual foundation required by manual segmentation, DICOM-SEG, and RT Structure Set features.

## Implementation Steps

### Step 1: Create Overlay Canvas Component

**File**: `src/components/viewer/SegmentationOverlay.tsx`

1. Create a Canvas element positioned absolutely over the Cornerstone viewport
2. Match the canvas dimensions to the viewport
3. Clear and re-render on navigation, zoom, pan, and W/L changes
4. Handle coordinate transform to match Cornerstone viewport transforms

### Step 2: Implement Labelmap Rendering

**File**: `src/lib/segmentation/labelmapRenderer.ts`

1. Render a labelmap (Uint8Array) as colored pixels on the overlay canvas:
   ```typescript
   function renderLabelmap(
     ctx: CanvasRenderingContext2D,
     labelmap: Uint8Array,
     width: number, height: number,
     colorTable: Map<number, [number, number, number]>,
     opacity: number,
     viewport: ViewportTransform
   ): void
   ```
2. Skip index 0 (background — no overlay)
3. Apply viewport transforms (zoom, pan, rotation) to align with the image

### Step 3: Add Opacity and Visibility Controls

**File**: `src/components/viewer/SegmentationControls.tsx`

1. Global opacity slider (0-100%)
2. Per-segment visibility checkboxes
3. Color indicator for each segment
4. Collapse/expand segment list

### Step 4: Synchronize with Viewport Transforms

**File**: `src/components/viewer/SegmentationOverlay.tsx`

1. Listen for viewport change events (zoom, pan, rotation)
2. Apply the same transforms to the overlay canvas
3. Re-render overlay when the viewport updates
4. Handle viewport reset

### Step 5: Add Tests

1. Test labelmap rendering with known data
2. Test viewport transform synchronization
3. Test per-segment visibility toggling
4. Test opacity adjustment

## Acceptance Criteria

- [ ] Colored overlay renders on top of the image
- [ ] Overlay aligns with the image during zoom, pan, and rotation
- [ ] Adjustable opacity
- [ ] Per-segment visibility toggle
- [ ] Background (index 0) is transparent
- [ ] No flickering during viewport interactions
