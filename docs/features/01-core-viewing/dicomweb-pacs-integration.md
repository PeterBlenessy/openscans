# DICOMweb / PACS Integration

**Status**: ❌ Not Implemented
**Category**: Core Viewing
**Priority**: Tier 3 — Long-term
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Connect directly to hospital PACS (Picture Archiving and Communication System) servers using the DICOMweb standard protocol. This enables querying, retrieving, and displaying studies from centralized imaging archives without manually downloading files.

## Benefits

- **Seamless clinical workflow** — Radiologists and clinicians can access patient imaging directly from the hospital archive without file transfers
- **Enterprise deployment** — Enables OpenScans to be used as a lightweight clinical viewer alongside existing hospital infrastructure
- **Standards-based** — DICOMweb (WADO-RS, STOW-RS, QIDO-RS) is the modern industry standard for web-based DICOM access
- **Reduced friction** — Eliminates the manual export-download-import cycle currently required

## Why It Matters for OpenScans

OpenScans currently serves standalone use cases well (reviewing imaging on a personal device, research, education). Adding DICOMweb support would open the door to institutional deployment — a much larger market — while preserving the privacy-first architecture by keeping rendering client-side.

## Implementation Considerations

- Would require a DICOMweb client library (e.g., `dicomweb-client`)
- Authentication via OAuth2/OpenID Connect for secure PACS access
- Study list browser UI for querying and selecting studies
- Must maintain the option to work fully offline/local
- HIPAA considerations for network-transmitted data
