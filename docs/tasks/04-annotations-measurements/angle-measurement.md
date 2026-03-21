# Task: Implement Angle Measurement

**Feature**: [Angle Measurement](../../features/04-annotations-measurements/angle-measurement.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: Medium (2-3 days)
**Dependencies**: Distance Measurement (shares pixel spacing infrastructure)

## Overview

Measure the angle between two lines defined by three points. Uses existing `MeasurementAnnotation` type with `measurementType: 'angle'`.

## Implementation Steps

### Step 1: Register Cornerstone Angle Tool

**File**: `src/lib/cornerstone/initCornerstone.ts`

1. Import and register `AngleTool` from `cornerstone-tools`:
   ```typescript
   import { AngleTool } from 'cornerstone-tools'
   cornerstoneTools.addTool(AngleTool)
   ```

### Step 2: Add Angle Tool to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add `'Angle'` to the available tools:
   ```typescript
   { name: 'Angle', mode: 'passive' }
   ```

### Step 3: Implement Angle Calculation Utility

**File**: `src/lib/dicom/measurements.ts`

1. Create angle calculation function:
   ```typescript
   function calculateAngle(p1: Point2D, vertex: Point2D, p2: Point2D): number {
     const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
     const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }
     const dot = v1.x * v2.x + v1.y * v2.y
     const cross = v1.x * v2.y - v1.y * v2.x
     const angle = Math.atan2(Math.abs(cross), dot)
     return angle * (180 / Math.PI)  // convert to degrees
   }
   ```

### Step 4: Create Angle Overlay Rendering

**File**: `src/components/viewer/MeasurementOverlay.tsx`

1. Render the two line segments meeting at the vertex
2. Draw an arc between the lines showing the measured angle
3. Display angle value in degrees (one decimal place)
4. Position the label near the arc

### Step 5: Persist Angle in Annotation Store

1. Create `MeasurementAnnotation` with `measurementType: 'angle'`:
   ```typescript
   {
     type: 'measurement',
     points: [p1, vertex, p2],
     measurementType: 'angle',
     value: angleDegrees,
     unit: '°',
   }
   ```

### Step 6: Add Angle Button to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add angle measurement button (could be grouped with ruler in a dropdown)
2. Use an appropriate icon or custom SVG for the angle tool

### Step 7: Add Keyboard Shortcut and Tests

1. Add `A` key shortcut (currently used for Pan — reassign if needed, or use `Shift+A`)
2. Unit tests for angle calculation with known angles (90°, 45°, 180°)
3. Test edge cases (straight line = 180°, coincident points)

## Acceptance Criteria

- [ ] User clicks three points to define two line segments
- [ ] Angle is displayed in degrees at the vertex
- [ ] Angle arc is rendered between the two lines
- [ ] Measurement persisted in annotation store
- [ ] Toolbar button and keyboard shortcut available
- [ ] Works correctly for acute, obtuse, and right angles
