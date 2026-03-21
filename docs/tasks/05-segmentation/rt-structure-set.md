# Task: Implement RT Structure Set Display

**Feature**: [RT Structure Set](../../features/05-segmentation/rt-structure-set.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: High (5-7 days)
**Dependencies**: Segmentation Overlays

## Overview

Display DICOM RT Structure Set contour data used in radiation therapy planning.

## Implementation Steps

### Step 1: Detect RTSS Files

**File**: `src/lib/dicom/parser.ts`

1. Check for SOP Class UID = "1.2.840.10008.5.1.4.1.1.481.3" (RT Structure Set)
2. Parse RTSS files separately from image files

### Step 2: Create RTSS Parser

**File**: `src/lib/dicom/rtssParser.ts`

1. Extract Structure Set ROI Sequence (3006,0020)
2. Extract ROI Contour Sequence (3006,0039)
3. For each structure:
   - ROI Name (3006,0026)
   - ROI Display Color (3006,002A)
   - Contour data per slice (3006,0050)
4. Parse contour points as 3D coordinates (x,y,z triplets)

### Step 3: Project Contours onto Image Slices

**File**: `src/lib/dicom/rtssParser.ts`

1. Match contour z-coordinates to image slice positions
2. Convert 3D contour points to 2D image coordinates
3. Handle contours that don't align exactly with slice positions

### Step 4: Render Contour Overlays

**File**: `src/components/viewer/ContourOverlay.tsx`

1. Render closed contour polygons as colored outlines on each slice
2. Use ROI Display Color from DICOM metadata
3. Optional filled contours with adjustable opacity
4. Per-structure visibility toggle

### Step 5: Create Structure List Panel

**File**: `src/components/viewer/StructureListPanel.tsx`

1. List all structures with name, color, and visibility toggle
2. Click structure to navigate to a slice where it's visible
3. Show structure type (PTV, CTV, OAR, etc.)

### Step 6: Add Tests

1. Test RTSS detection and parsing
2. Test contour-to-slice mapping
3. Test 3D-to-2D coordinate projection

## Acceptance Criteria

- [ ] RTSS files detected and parsed during loading
- [ ] Contours displayed as colored outlines on image slices
- [ ] Structure list panel with visibility toggles
- [ ] Correct color mapping from DICOM metadata
- [ ] Contours align with corresponding image slices
