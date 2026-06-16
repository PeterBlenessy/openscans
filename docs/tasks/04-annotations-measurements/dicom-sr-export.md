# Task: Implement DICOM SR Export/Import

**Feature**: [DICOM SR Export/Import](../../features/04-annotations-measurements/dicom-sr-export.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: High (5-7 days)
**Dependencies**: Distance and Angle Measurement (provides measurements to export)

## Overview

Export annotations and measurements as DICOM Structured Reports (SR) and import SR objects to restore previously saved annotations.

## Implementation Steps

### Step 1: Create DICOM SR Encoder

**File**: `src/lib/dicom/srEncoder.ts`

1. Use `dcmjs` SR encoding capabilities:
   ```typescript
   import { data as dcmjsData } from 'dcmjs'
   const { DicomMessage, DicomMetaDictionary } = dcmjsData
   ```
2. Implement TID 1500 (Measurement Report) encoding:
   - Map `MeasurementAnnotation` (length) → DICOM SR length measurement
   - Map `MeasurementAnnotation` (angle) → DICOM SR angle measurement
   - Map `MarkerAnnotation` → DICOM SR point coordinate
3. Encode SCOORD spatial coordinates for 2D positions
4. Include study/series/instance references

### Step 2: Create DICOM SR Decoder

**File**: `src/lib/dicom/srDecoder.ts`

1. Parse DICOM SR objects from loaded files
2. Detect SR modality (modality tag = "SR")
3. Extract measurement content items
4. Map DICOM SR measurements back to `MeasurementAnnotation` objects
5. Map DICOM SR spatial coordinates to `Point2D`

### Step 3: Integrate SR Detection into File Loading

**File**: `src/lib/dicom/parser.ts`

1. During file loading, detect files with modality "SR"
2. Parse SR files separately from image files
3. Extract annotations and add them to the annotation store
4. Link annotations to their referenced image instances

### Step 4: Add SR Export Action

**File**: `src/lib/export/srExport.ts`

1. Create export function:
   ```typescript
   async function exportAnnotationsAsSR(
     annotations: Annotation[],
     studyMetadata: DicomMetadata
   ): Promise<Blob>
   ```
2. Generate a DICOM SR file as a Blob
3. Trigger browser download with appropriate filename
4. Include patient and study metadata in the SR header

### Step 5: Add Export UI

**File**: `src/components/export/ExportDialog.tsx`

1. Add "DICOM SR" as an export format option
2. Show which annotations will be included
3. Option to export all annotations or only measurements

### Step 6: Add Tests

1. Test SR encoding with known measurements
2. Test SR decoding (round-trip: encode → decode → verify)
3. Test handling of SR files during loading
4. Test export file generation

## Acceptance Criteria

- [ ] Annotations can be exported as DICOM SR files
- [ ] DICOM SR files can be imported and annotations restored
- [ ] Length and angle measurements correctly encoded/decoded
- [ ] SR files include correct study/series/instance references
- [ ] Export option available in the export dialog
- [ ] SR files detected and parsed during file loading
