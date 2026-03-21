# Task: Implement ROI Statistics

**Feature**: [ROI Statistics](../../features/04-annotations-measurements/roi-statistics.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (2-3 days)
**Dependencies**: Ellipse/Rectangle ROI (provides the ROI regions to analyze)

## Overview

Calculate and display pixel value statistics (mean, std dev, min, max, area) within ROI regions. This is largely implemented as part of the Ellipse/Rectangle ROI task — this task covers the statistics engine and display components.

## Implementation Steps

### Step 1: Create Statistics Calculation Engine

**File**: `src/lib/dicom/roiStatistics.ts`

1. Implement pixel extraction for different ROI shapes:
   ```typescript
   function getPixelsInEllipse(
     imageData: Float32Array,
     width: number, height: number,
     center: Point2D, radiusX: number, radiusY: number
   ): number[]

   function getPixelsInRectangle(
     imageData: Float32Array,
     width: number, height: number,
     topLeft: Point2D, bottomRight: Point2D
   ): number[]

   function getPixelsInPolygon(
     imageData: Float32Array,
     width: number, height: number,
     points: Point2D[]
   ): number[]
   ```

2. Apply DICOM rescale values:
   ```typescript
   function applyRescale(rawValue: number, slope: number, intercept: number): number {
     return rawValue * slope + intercept
   }
   ```

3. Compute statistics:
   ```typescript
   function computeStats(values: number[]): {
     mean: number, stdDev: number, min: number, max: number, count: number
   }
   ```

### Step 2: Calculate Physical Area

**File**: `src/lib/dicom/roiStatistics.ts`

1. Compute area in mm² using pixel spacing:
   ```typescript
   function calculateArea(pixelCount: number, pixelSpacing: { row: number, col: number }): number {
     return pixelCount * pixelSpacing.row * pixelSpacing.col
   }
   ```
2. Display in mm² or cm² depending on size

### Step 3: Create Statistics Display Component

**File**: `src/components/viewer/RoiStatsDisplay.tsx`

1. Floating panel near the ROI showing:
   ```
   ┌──────────────────┐
   │ Mean:  42.3 HU   │
   │ SD:    12.1       │
   │ Min:   -15        │
   │ Max:   89         │
   │ Area:  1.56 cm²   │
   │ Count: 1234 px    │
   └──────────────────┘
   ```
2. Positioned relative to the ROI, avoiding overlap
3. Semi-transparent background for readability

### Step 4: Determine Display Units

**File**: `src/lib/dicom/roiStatistics.ts`

1. Use modality to determine units:
   - CT → Hounsfield Units (HU)
   - PET → SUV (if calibration data available)
   - All others → Arbitrary Units (AU)
2. Include unit label in the statistics display

### Step 5: Add Tests

1. Test pixel extraction for ellipse, rectangle, polygon shapes
2. Test statistics computation with known values
3. Test rescale slope/intercept application
4. Test area calculation with pixel spacing

## Acceptance Criteria

- [ ] Statistics displayed for ellipse, rectangle, and freehand ROIs
- [ ] Mean, std dev, min, max, area, pixel count shown
- [ ] Correct units (HU for CT, AU for others)
- [ ] Rescale slope/intercept correctly applied
- [ ] Area in mm² or cm² using pixel spacing
- [ ] Statistics update when ROI is resized
