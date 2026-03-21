# Task: Implement Image Fusion / Overlay

**Feature**: [Image Fusion / Overlay](../../features/03-advanced-viewing/image-fusion-overlay.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Very High (2-3 weeks)
**Dependencies**: MPR (Volume API), Pseudo-Color LUT, Split View

## Overview

Overlay functional imaging (PET, SPECT) on anatomical imaging (CT, MRI) with adjustable opacity and color mapping.

## Implementation Steps

### Step 1: Create Image Registration Utility

**File**: `src/lib/fusion/imageRegistration.ts`

1. Implement basic rigid registration using DICOM spatial metadata:
   - Frame of Reference UID matching (same coordinate space)
   - Image Position Patient and Image Orientation Patient for alignment
2. Compute the transformation matrix to map one series onto another
3. Handle different voxel sizes and matrix dimensions

### Step 2: Create Fusion Viewport Component

**File**: `src/components/viewer/FusionViewport.tsx`

1. Render two layers: base layer (CT) and overlay layer (PET)
2. Base layer in grayscale with standard W/L
3. Overlay layer with color LUT (hot metal default) and adjustable opacity
4. Both layers share the same spatial coordinates after registration

### Step 3: Add Fusion Controls

**File**: `src/components/viewer/FusionControls.tsx`

1. Opacity slider for the overlay layer (0-100%)
2. Color map selector for the overlay (hot metal, rainbow, jet)
3. Base series selector
4. Overlay series selector
5. Toggle fusion on/off

### Step 4: Integrate with Layout System

**File**: `src/stores/layoutStore.ts`

1. Add a `fusion` viewport mode
2. When fusion is active, a viewport shows both base and overlay series
3. Fusion settings (opacity, color map) stored per viewport

### Step 5: Handle Unregistered Series

1. If Frame of Reference UIDs match, use spatial coordinates directly
2. If they don't match, show a warning and attempt manual alignment
3. Provide a "Link by position" fallback using instance number ratio

### Step 6: Add Tests

1. Test registration matrix computation
2. Test opacity blending
3. Test with matched and unmatched Frame of Reference UIDs

## Acceptance Criteria

- [ ] Overlay one series on top of another with adjustable opacity
- [ ] Color LUT applied to the overlay layer
- [ ] Spatial alignment using DICOM metadata
- [ ] Opacity slider from 0% (base only) to 100% (overlay only)
- [ ] Warning when series cannot be spatially registered
- [ ] Scrolling through fused series keeps alignment
