# Task: Implement Cobb Angle Measurement

**Feature**: [Cobb Angle](../../features/04-annotations-measurements/cobb-angle.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (2-3 days)
**Dependencies**: Angle Measurement (shares angle calculation and overlay rendering)

## Overview

Specialized measurement tool for scoliosis assessment. The user draws two lines along vertebral endplates, and the tool computes the Cobb angle from the perpendiculars of these lines.

## Implementation Steps

### Step 1: Create Cobb Angle Calculation

**File**: `src/lib/dicom/measurements.ts`

1. Implement Cobb angle calculation:
   ```typescript
   function calculateCobbAngle(
     line1Start: Point2D, line1End: Point2D,
     line2Start: Point2D, line2End: Point2D
   ): number {
     // Calculate perpendiculars to each line
     const perp1 = perpendicular(line1Start, line1End)
     const perp2 = perpendicular(line2Start, line2End)
     // Angle between perpendiculars = Cobb angle
     return angleBetweenVectors(perp1, perp2)
   }

   function perpendicular(p1: Point2D, p2: Point2D): { x: number, y: number } {
     const dx = p2.x - p1.x
     const dy = p2.y - p1.y
     return { x: -dy, y: dx }  // 90° rotation
   }
   ```

### Step 2: Create Cobb Angle Tool Interaction

**File**: `src/hooks/useCobbAngleTool.ts`

1. Two-step interaction:
   - First click-drag: draw line along the upper endplate
   - Second click-drag: draw line along the lower endplate
2. After both lines are drawn, compute and display the Cobb angle
3. Show instruction text guiding the user ("Draw line 1 along upper endplate...")

### Step 3: Create Cobb Angle Overlay

**File**: `src/components/viewer/MeasurementOverlay.tsx`

1. Render both endplate lines
2. Render the perpendicular lines (dashed)
3. Render the angle arc between perpendiculars
4. Display the Cobb angle value in degrees
5. Color code by severity:
   - Green: < 10° (normal)
   - Yellow: 10-25° (mild)
   - Orange: 25-40° (moderate)
   - Red: > 40° (severe)

### Step 4: Persist as MeasurementAnnotation

1. Store with `measurementType: 'angle'` and all four points:
   ```typescript
   {
     type: 'measurement',
     points: [line1Start, line1End, line2Start, line2End],
     measurementType: 'angle',
     value: cobbAngle,
     unit: '°',
     description: `Cobb angle: ${cobbAngle.toFixed(1)}°`,
   }
   ```

### Step 5: Add Toolbar Button and Integration with AI

1. Add Cobb angle tool button in the measurement tools group
2. Future enhancement: auto-suggest endplate lines from AI-detected vertebral positions
3. Add keyboard shortcut

### Step 6: Add Tests

1. Test Cobb angle calculation with known scoliosis angles
2. Test perpendicular vector computation
3. Test severity color coding thresholds
4. Test with parallel lines (0° Cobb angle)

## Acceptance Criteria

- [ ] User draws two endplate lines
- [ ] Cobb angle computed from perpendiculars and displayed
- [ ] Severity color coding (normal/mild/moderate/severe)
- [ ] Both endplate lines and perpendiculars rendered
- [ ] Measurement persisted in annotation store
- [ ] Correct angle calculation for various scoliosis configurations
