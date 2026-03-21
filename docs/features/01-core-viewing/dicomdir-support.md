# DICOMDIR Support

**Status**: ❌ Not Implemented
**Category**: Core Viewing
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis, DWV, Stone Web Viewer

## Description

Parse and navigate DICOMDIR index files, which are commonly found on imaging CDs/DVDs provided to patients by hospitals. A DICOMDIR file acts as a directory listing that organizes all DICOM files on the media into a hierarchical structure of patients, studies, series, and images.

## Benefits

- **Patient-friendly** — Patients frequently receive imaging CDs from hospitals; DICOMDIR is the standard index format on these discs
- **Faster loading** — Instead of scanning every file to build the study hierarchy, the DICOMDIR provides the structure immediately
- **Complete navigation** — DICOMDIR contains metadata that helps organize and display studies without parsing every individual file first
- **Standards compliance** — DICOMDIR is part of the DICOM standard (PS3.10) and widely used for media interchange

## Why It Matters for OpenScans

A significant use case for standalone DICOM viewers is patients wanting to view their own imaging CDs. These CDs almost always include a DICOMDIR file. Without DICOMDIR support, OpenScans can still load the files individually but loses the organizational metadata and requires the user to navigate raw file structures.

## Implementation Considerations

- Parse the DICOMDIR file to extract the patient/study/series/instance hierarchy
- Map DICOMDIR references to actual file paths on the media
- Fall back to file-by-file parsing when DICOMDIR is missing or malformed
- `dcmjs` or `dicom-parser` can handle DICOMDIR parsing
