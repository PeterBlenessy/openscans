# Multi-Modality Support

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

Display DICOM images from various imaging modalities including MRI (MR), CT, Computed Radiography (CR), Digital X-ray (DX), Fluoroscopy (RF), Angiography (XA), Mammography (MG), and other (OT). Each modality receives appropriate default window/level settings.

## Benefits

- **Versatile viewer** — One application handles images from any imaging department (radiology, cardiology, orthopedics, etc.)
- **Correct display defaults** — Each modality has different optimal brightness/contrast settings; OpenScans applies appropriate defaults automatically
- **Broad compatibility** — Handles the most common DICOM modality types encountered in clinical practice
- **Unified workflow** — Users don't need different viewers for X-rays vs. MRIs vs. CT scans

## Current Implementation

- Modality detection from DICOM tag (0008,0060)
- Per-modality default window/level presets
- Modality-specific metadata display
- Support for MR, CT, CR, DX, RF, XA, MG, and OT

## Key Files

- `src/stores/viewportStore.ts`
- `src/lib/dicom/parser.ts`
