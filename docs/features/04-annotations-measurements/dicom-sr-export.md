# DICOM SR Export/Import

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Export annotations and measurements as DICOM Structured Reports (SR) and import SR objects to display previously saved annotations. DICOM SR is a standardized format for encoding clinical observations, measurements, and annotations alongside the imaging data.

## Benefits

- **Standards-based persistence** — Annotations stored as DICOM SR can be archived in PACS alongside the images and retrieved by any DICOM SR-compatible viewer
- **Interoperability** — Measurements created in OpenScans could be viewed in OHIF, Weasis, or any other SR-compatible system
- **Clinical workflow integration** — SR is the standard way to store radiology measurements in clinical PACS systems
- **Audit trail** — DICOM SR includes metadata about who created the annotation and when

## Why It Matters for OpenScans

DICOM SR support is primarily valuable in institutional settings where annotations need to be shared between systems. For OpenScans' current standalone use case, localStorage persistence is sufficient. This becomes important if DICOMweb/PACS integration is added.

## Implementation Considerations

- DICOM SR encoding/decoding (TID 1500 for measurements)
- `dcmjs` has SR encoding capabilities
- Map internal annotation types to DICOM SR content items
- SCOORD/SCOORD3D spatial coordinate encoding
- Complex specification — consider starting with import-only
