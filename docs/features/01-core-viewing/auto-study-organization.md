# Automatic Study/Series Organization

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

Automatically organize loaded DICOM files into a hierarchical structure of studies, series, and instances based on DICOM metadata tags (Study Instance UID, Series Instance UID). This mirrors how medical imaging is organized in clinical systems.

## Benefits

- **Clinical-grade organization** — Images are grouped exactly as they were acquired, matching what clinicians expect
- **Multi-study support** — If files from multiple patients or studies are loaded together, they are correctly separated
- **Navigable hierarchy** — Users can browse by study, then series, then individual images — not raw file lists
- **Metadata extraction** — Patient name, study date, modality, series description, and other tags are parsed and displayed

## Current Implementation

- Parses Study Instance UID and Series Instance UID from each DICOM file
- Groups instances into series, series into studies
- Extracts and displays metadata (patient info, study details, series descriptions)
- Supports all common modalities (MR, CT, CR, DX, RF, XA, MG, OT)
- Left drawer provides a hierarchical study/series browser

## Key Files

- `src/lib/dicom/parser.ts`
- `src/stores/studyStore.ts`
- `src/components/viewer/StudySeriesBrowser.tsx`
