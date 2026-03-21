# Task: Implement Pseudo-Color / LUT Mapping

**Feature**: [Pseudo-Color / LUT Mapping](../../features/02-image-manipulation/pseudo-color-lut.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: None

## Overview

Apply color lookup tables (LUTs) to grayscale DICOM images, mapping pixel intensity values to colors for enhanced visualization of functional imaging data (PET, SPECT).

## Implementation Steps

### Step 1: Define Standard LUT Tables

**File**: `src/lib/lut/colorMaps.ts`

1. Define LUT data structures:
   ```typescript
   interface ColorMap {
     name: string
     displayName: string
     colors: [number, number, number][]  // 256 RGB entries
   }
   ```
2. Implement standard color maps:
   - `grayscale` — default (identity mapping)
   - `hotMetal` — black → red → yellow → white
   - `rainbow` — full spectrum ROYGBIV
   - `jet` — blue → cyan → green → yellow → red
   - `coolWarm` — blue → white → red (diverging)
   - `pet` — standard PET colormap
3. Generate each LUT as a 256-entry RGB array

### Step 2: Create LUT Rendering Function

**File**: `src/lib/lut/applyLut.ts`

1. Create `applyColorMap(imageData: ImageData, colorMap: ColorMap): ImageData`
2. For each pixel, use the grayscale value as an index into the LUT
3. Replace R, G, B channels with LUT values
4. Handle window/level interaction (apply W/L first, then LUT)

### Step 3: Add LUT State to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add: `activeColorMap: string | null` (null = grayscale default)
2. Add action: `setColorMap(name: string | null)`

### Step 4: Create LUT Selector UI

**File**: `src/components/viewer/ColorMapSelector.tsx`

1. Dropdown with visual color bar preview for each LUT option
2. "Grayscale" as the default option
3. Color bar rendered as a small gradient strip showing the LUT
4. Add to toolbar, near the image presets button

### Step 5: Integrate with Rendering Pipeline

**File**: `src/hooks/useViewportSetup.ts`

1. After W/L adjustment, apply the active color map to the canvas
2. Re-apply on W/L changes, navigation, and color map changes

### Step 6: Add Tests

1. Unit tests for LUT generation (verify 256 entries)
2. Test color map application to synthetic image data
3. Test grayscale (null) passthrough

## Acceptance Criteria

- [ ] At least 5 color maps available (hot metal, rainbow, jet, cool-warm, PET)
- [ ] Color map selector with visual previews
- [ ] Color maps interact correctly with W/L adjustment
- [ ] Grayscale is the default and always available
- [ ] Color map updates when navigating between images
- [ ] No visible performance impact
