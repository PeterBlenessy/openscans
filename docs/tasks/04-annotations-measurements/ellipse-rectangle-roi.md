# Task: Implement Ellipse / Rectangle ROI

**Feature**: [Ellipse / Rectangle ROI](../../features/04-annotations-measurements/ellipse-rectangle-roi.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Distance Measurement (shares pixel spacing infrastructure)

## Overview

Draw elliptical or rectangular regions of interest and compute pixel statistics within the region. Uses existing `RegionAnnotation` type.

## Implementation Steps

### Step 1: Register Cornerstone ROI Tools

**File**: `src/lib/cornerstone/initCornerstone.ts`

1. Register `EllipticalRoiTool` and `RectangleRoiTool`:
   ```typescript
   import { EllipticalRoiTool, RectangleRoiTool } from 'cornerstone-tools'
   cornerstoneTools.addTool(EllipticalRoiTool)
   cornerstoneTools.addTool(RectangleRoiTool)
   ```

### Step 2: Add ROI Tools to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add to available tools:
   ```typescript
   { name: 'EllipticalRoi', mode: 'passive' },
   { name: 'RectangleRoi', mode: 'passive' },
   ```

### Step 3: Implement ROI Statistics Calculation

**File**: `src/lib/dicom/roiStatistics.ts`

1. Create statistics calculation:
   ```typescript
   interface RoiStats {
     mean: number
     stdDev: number
     min: number
     max: number
     area: number      // in mm²
     pixelCount: number
     unit: string      // 'HU' for CT, 'AU' for others
   }

   function calculateRoiStats(
     pixelData: number[],
     rescaleSlope: number,
     rescaleIntercept: number,
     pixelSpacing: { row: number, col: number } | null
   ): RoiStats
   ```
2. Apply DICOM rescale slope/intercept for correct physical values
3. Use Hounsfield Units for CT modality, arbitrary units otherwise

### Step 4: Create ROI Overlay Rendering

**File**: `src/components/viewer/RoiOverlay.tsx`

1. Render the ellipse/rectangle shape on the overlay canvas
2. Display statistics box near the ROI:
   ```
   Mean: 42.3 HU
   SD: 12.1
   Area: 156.2 mm²
   ```
3. Allow resizing by dragging handles
4. Allow repositioning by dragging the shape

### Step 5: Persist ROI in Annotation Store

1. Create `RegionAnnotation` with the ROI boundary points:
   ```typescript
   {
     type: 'region',
     points: [topLeft, topRight, bottomRight, bottomLeft],  // rectangle
     // or center + radii for ellipse
     closed: true,
   }
   ```

### Step 6: Add ROI Buttons to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add ellipse and rectangle ROI buttons
2. Group them in a measurement tools dropdown alongside ruler and angle
3. Use `Circle` and `Square` Lucide icons

### Step 7: Add Tests

1. Test ROI statistics calculation with known pixel values
2. Test rescale slope/intercept application
3. Test area calculation with pixel spacing
4. Test with and without pixel spacing metadata

## Acceptance Criteria

- [ ] User can draw elliptical and rectangular ROIs
- [ ] Statistics (mean, std dev, min, max, area) are displayed
- [ ] Values in HU for CT, arbitrary units for other modalities
- [ ] ROIs can be resized and repositioned
- [ ] ROIs persist in the annotation store
- [ ] Toolbar buttons for both ROI types
- [ ] Handles missing pixel spacing gracefully
