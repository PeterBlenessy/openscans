# Task: Implement DICOM-SEG Support

**Feature**: [DICOM-SEG Support](../../features/05-segmentation/dicom-seg-support.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: High (5-7 days)
**Dependencies**: Segmentation Overlays (for display), Manual Segmentation (for labelmap infrastructure)

## Overview

Import and display DICOM Segmentation objects (DICOM-SEG) to view segmentations created by external tools or AI algorithms.

## Implementation Steps

### Step 1: Detect DICOM-SEG Files During Loading

**File**: `src/lib/dicom/parser.ts`

1. During file parsing, check for SOP Class UID = "1.2.840.10008.5.1.4.1.1.66.4" (Segmentation Storage)
2. Set aside SEG files from regular image files
3. Parse SEG files after image files are loaded (need the referenced images first)

### Step 2: Create DICOM-SEG Parser

**File**: `src/lib/dicom/segParser.ts`

1. Use `dcmjs` to decode DICOM-SEG:
   ```typescript
   import { adapters } from 'dcmjs'

   async function parseDicomSeg(
     segArrayBuffer: ArrayBuffer,
     imageIds: string[]
   ): Promise<Segmentation>
   ```
2. Extract segment metadata (label, color, algorithm type)
3. Extract binary frame data and map to referenced image instances
4. Convert frames to labelmap format

### Step 3: Map Segments to Image Instances

**File**: `src/lib/dicom/segParser.ts`

1. Each SEG frame references a specific image via Referenced SOP Instance UID
2. Map each frame to its corresponding image in the loaded study
3. Handle cases where not all images have segmentation data

### Step 4: Display Segmentation Overlay

**File**: `src/components/viewer/SegmentationOverlay.tsx`

1. Reuse the overlay component from manual segmentation
2. Load the imported labelmap data
3. Use segment colors from the DICOM-SEG metadata
4. Toggle segment visibility per segment

### Step 5: Add SEG Metadata to Study Browser

**File**: `src/components/viewer/StudySeriesBrowser.tsx`

1. Show DICOM-SEG series in the study browser
2. Distinguish SEG series from image series visually
3. Click on SEG series to overlay it on the referenced image series

### Step 6: Add Tests

1. Test DICOM-SEG detection by SOP Class UID
2. Test segment metadata extraction
3. Test frame-to-instance mapping
4. Test with multi-segment objects

## Acceptance Criteria

- [ ] DICOM-SEG files detected during loading
- [ ] Segments displayed as colored overlays on referenced images
- [ ] Segment labels and colors from DICOM metadata
- [ ] Per-segment visibility toggle
- [ ] SEG series visible in study browser
- [ ] Handles multi-segment objects correctly
