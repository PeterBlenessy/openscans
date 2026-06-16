# Task: Implement 3D Annotations (SCOORD3D)

**Feature**: [3D Annotations](../../features/04-annotations-measurements/3d-annotations.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: High (5-7 days)
**Dependencies**: MPR (provides 3D viewing context), DICOM SR (for SCOORD3D encoding)

## Overview

Create and display annotations with 3D spatial coordinates that exist in volumetric patient space rather than being bound to a specific 2D image plane.

## Implementation Steps

### Step 1: Extend Annotation Types for 3D

**File**: `src/types/annotation.ts`

1. Add 3D point type:
   ```typescript
   interface Point3D {
     x: number
     y: number
     z: number
   }
   ```
2. Add 3D annotation variants:
   ```typescript
   interface Marker3DAnnotation extends BaseAnnotation {
     type: 'marker'
     position3D: Point3D
     frameOfReferenceUID: string
   }

   interface Measurement3DAnnotation extends BaseAnnotation {
     type: 'measurement'
     points3D: Point3D[]
     frameOfReferenceUID: string
     measurementType: 'length' | 'angle' | 'area'
     value: number
     unit: string
   }
   ```

### Step 2: Implement 3D-to-2D Projection

**File**: `src/lib/dicom/coordinateTransform.ts`

1. Project 3D patient coordinates onto a 2D viewport plane:
   ```typescript
   function projectTo2D(
     point3D: Point3D,
     imagePosition: [number, number, number],
     imageOrientation: [number, number, number, number, number, number],
     pixelSpacing: { row: number, col: number }
   ): Point2D | null  // null if point is not on this plane
   ```
2. Handle projection for arbitrary view orientations (axial, sagittal, coronal, oblique)

### Step 3: Render 3D Annotations in MPR Viewports

**File**: `src/components/viewer/AnnotationOverlay.tsx`

1. For each 3D annotation, project onto the current viewport plane
2. Only render annotations that are within a threshold distance from the current plane
3. Vary opacity/size based on distance from the current plane
4. Render the annotation using existing 2D overlay components

### Step 4: Create 3D Annotation Placement

**File**: `src/hooks/use3DAnnotationTool.ts`

1. In MPR mode, clicking on any viewport creates a 3D annotation
2. Convert the 2D click position to 3D patient coordinates
3. Use the viewport's image orientation and position for the transform

### Step 5: Encode as SCOORD3D in DICOM SR

**File**: `src/lib/dicom/srEncoder.ts`

1. Extend SR encoder to support SCOORD3D coordinate type
2. Include Frame of Reference UID in the SR

### Step 6: Add Tests

1. Test 3D-to-2D projection for all standard orientations
2. Test round-trip: 2D click → 3D coordinate → 2D projection
3. Test projection returns null for off-plane points

## Acceptance Criteria

- [ ] 3D annotations can be placed from any MPR viewport
- [ ] Annotations visible in all three MPR planes when near the current slice
- [ ] 3D coordinates correctly project onto 2D viewports
- [ ] Frame of Reference UID tracked for spatial consistency
- [ ] Compatible with DICOM SR SCOORD3D encoding
