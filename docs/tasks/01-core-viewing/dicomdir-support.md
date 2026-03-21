# Task: Implement DICOMDIR Support

**Feature**: [DICOMDIR Support](../../features/01-core-viewing/dicomdir-support.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (3-5 days)
**Dependencies**: None (builds on existing parser infrastructure)

## Overview

Parse DICOMDIR index files to quickly load study/series/instance hierarchies from imaging CDs and structured DICOM exports.

## Implementation Steps

### Step 1: Create DICOMDIR Parser Utility

**File**: `src/lib/dicom/dicomdirParser.ts`

1. Create a new parser function `parseDicomDir(file: File): Promise<DicomdirEntry[]>`
2. Use `dicom-parser` to read the DICOMDIR file (it's a standard DICOM file with specific tags)
3. Extract the Directory Record Sequence (0004,1220)
4. Parse each record type:
   - `PATIENT` record → patient name, patient ID
   - `STUDY` record → Study Instance UID, study date, study description
   - `SERIES` record → Series Instance UID, modality, series description
   - `IMAGE` record → SOP Instance UID, referenced file path
5. Build a hierarchical tree: Patient → Study → Series → Image
6. Return the list of referenced file paths with their metadata

```typescript
interface DicomdirEntry {
  patientName: string
  patientId: string
  studies: DicomdirStudyEntry[]
}

interface DicomdirStudyEntry {
  studyInstanceUID: string
  studyDate: string
  studyDescription: string
  series: DicomdirSeriesEntry[]
}

interface DicomdirSeriesEntry {
  seriesInstanceUID: string
  modality: string
  seriesDescription: string
  images: DicomdirImageEntry[]
}

interface DicomdirImageEntry {
  sopInstanceUID: string
  referencedFilePath: string  // relative path from DICOMDIR location
}
```

### Step 2: Detect DICOMDIR Files During Loading

**File**: `src/lib/dicom/parser.ts`

1. In the file loading pipeline, check if any loaded file is named `DICOMDIR` (case-insensitive)
2. If found, parse it first to get the file manifest
3. Use the manifest to prioritize and organize subsequent file loading
4. If referenced files are available in the loaded set, use DICOMDIR metadata to pre-build the study/series hierarchy without parsing each file individually

### Step 3: Map DICOMDIR File References to Loaded Files

**File**: `src/lib/dicom/dicomdirParser.ts`

1. DICOMDIR stores relative file paths (e.g., `IMAGES/IMG0001`)
2. Create a function `resolveFilePaths(dicomdirEntries, loadedFiles: File[]): Map<string, File>`
3. Match DICOMDIR paths to loaded files by normalizing path separators and case
4. Handle common path variations (forward vs. backslash, with/without extension)

### Step 4: Integrate into Study Loading Flow

**File**: `src/hooks/useDicomLoader.ts`

1. When files are dropped or selected, check for DICOMDIR presence
2. If DICOMDIR exists, use it to organize files before parsing
3. Fall back to file-by-file parsing when DICOMDIR is missing or incomplete
4. Show a loading indicator that reflects DICOMDIR-guided loading

### Step 5: Add Unit Tests

**File**: `src/lib/dicom/__tests__/dicomdirParser.test.ts`

1. Test DICOMDIR parsing with a fixture file
2. Test file path resolution with various path formats
3. Test fallback behavior when DICOMDIR references missing files
4. Test case-insensitive DICOMDIR detection

## Acceptance Criteria

- [ ] DICOMDIR files are automatically detected when loading folders
- [ ] Study/series/instance hierarchy is built from DICOMDIR metadata
- [ ] Referenced files are correctly mapped to loaded files
- [ ] Graceful fallback when DICOMDIR is missing or malformed
- [ ] Unit tests pass for parser and path resolution
- [ ] No regression in regular (non-DICOMDIR) file loading
