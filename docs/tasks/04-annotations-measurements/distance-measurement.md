# Task: Implement Distance Measurement (Ruler)

**Feature**: [Distance Measurement](../../features/04-annotations-measurements/distance-measurement.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: None (annotation store and types already exist)

## Overview

Draw a line between two points to measure real-world distance in mm. Uses existing `MeasurementAnnotation` type with `measurementType: 'length'`.

## Implementation Steps

### Step 1: Register Cornerstone Length Tool

**File**: `src/lib/cornerstone/initCornerstone.ts`

1. Import Cornerstone Tools `LengthTool` (or implement a custom tool)
2. Register the tool with the tool group
3. Note: current codebase uses `cornerstone-tools` v6.0.10 which includes `LengthTool`
   ```typescript
   import { LengthTool } from 'cornerstone-tools'
   cornerstoneTools.addTool(LengthTool)
   ```

### Step 2: Add Ruler Tool to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add `'Length'` to the available tools list
2. Add action to activate the length tool:
   ```typescript
   // In defaultTools array, add:
   { name: 'Length', mode: 'passive' }
   ```

### Step 3: Create Measurement Overlay Component

**File**: `src/components/viewer/MeasurementOverlay.tsx`

1. If Cornerstone Tools handles rendering natively, skip this step
2. Otherwise, create an SVG overlay that renders:
   - Line between two points
   - Endpoint handles (small circles)
   - Distance label positioned at the midpoint
   - Unit display (mm)
3. Read pixel spacing from DICOM metadata for calibration:
   - Tag (0028,0030) — Pixel Spacing
   - Tag (0018,1164) — Imager Pixel Spacing (fallback)

### Step 4: Implement Pixel-to-MM Conversion

**File**: `src/lib/dicom/pixelSpacing.ts`

1. Create utility function:
   ```typescript
   function getPixelSpacing(metadata: DicomMetadata): { row: number, col: number } | null {
     // Try Pixel Spacing (0028,0030) first
     // Fall back to Imager Pixel Spacing (0018,1164)
     // Return null if neither is available
   }

   function pixelDistanceToMm(
     p1: Point2D, p2: Point2D,
     pixelSpacing: { row: number, col: number }
   ): number {
     const dx = (p2.x - p1.x) * pixelSpacing.col
     const dy = (p2.y - p1.y) * pixelSpacing.row
     return Math.sqrt(dx * dx + dy * dy)
   }
   ```
2. Handle images without pixel spacing (show "px" instead of "mm" with a warning)

### Step 5: Persist Measurements in Annotation Store

**File**: `src/stores/annotationStore.ts`

1. When a measurement is completed, create a `MeasurementAnnotation`:
   ```typescript
   const annotation: MeasurementAnnotation = {
     id: generateId(),
     type: 'measurement',
     seriesInstanceUID,
     sopInstanceUID,
     instanceNumber,
     severity: 'normal',
     description: `Length: ${value.toFixed(1)} mm`,
     createdAt: new Date().toISOString(),
     createdBy: 'user',
     points: [p1, p2],
     measurementType: 'length',
     value: distanceMm,
     unit: 'mm',
   }
   ```
2. Use existing `addAnnotation()` action

### Step 6: Add Ruler Button to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add a ruler button using `Ruler` Lucide icon
2. Clicking activates the Length tool via `setActiveTool('Length')`
3. Highlight button when the Length tool is active
4. Add to the tools section of the toolbar

### Step 7: Add Keyboard Shortcut

**File**: `src/hooks/useViewportKeyboard.ts`

1. Add `L` key to activate the ruler/length tool
2. Update keyboard shortcuts help dialog

### Step 8: Add Tests

**File**: `src/lib/dicom/__tests__/pixelSpacing.test.ts`

1. Test pixel spacing extraction from metadata
2. Test pixel-to-mm conversion with known values
3. Test fallback when pixel spacing is missing
4. Test distance calculation between two points

## Acceptance Criteria

- [ ] User can draw a line between two points on the image
- [ ] Distance is displayed in mm using DICOM pixel spacing
- [ ] Fallback to pixels when pixel spacing is unavailable (with warning)
- [ ] Measurement is persisted in the annotation store
- [ ] Ruler button in toolbar activates the tool
- [ ] Keyboard shortcut (L) activates the tool
- [ ] Measurement is visible when navigating back to the same instance
- [ ] Unit tests pass for pixel spacing and distance calculations
