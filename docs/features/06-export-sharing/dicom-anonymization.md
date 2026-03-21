# DICOM Anonymization Export

**Status**: ❌ Not Implemented
**Category**: Export & Sharing
**Priority**: Tier 3 — Evaluate Later
**Present In**: Weasis

## Description

Export DICOM files with patient-identifying information removed or replaced with anonymous values. This enables sharing imaging data for research, education, or second opinions without exposing patient identity.

## Benefits

- **Research data sharing** — Share imaging data with collaborators while maintaining patient privacy
- **Teaching collections** — Build anonymized teaching file libraries for medical education
- **Second opinions** — Send anonymized images for remote consultation without HIPAA concerns
- **Regulatory compliance** — Meet de-identification requirements for institutional review boards (IRB)

## Why It Matters for OpenScans

OpenScans' privacy-first philosophy makes DICOM anonymization a natural extension. Currently, privacy controls apply to exports (filenames, PDFs) but not to the DICOM data itself. True anonymization would strip or replace PII tags in the DICOM files before export.

## Implementation Considerations

- Identify and process all DICOM tags containing PII (DICOM PS3.15 Confidentiality Profiles)
- Replace, remove, or hash patient name, ID, date of birth, etc.
- Preserve non-identifying metadata needed for image display
- Handle burned-in annotations (text on pixel data) — flag but cannot automatically remove
- Option to shift dates (preserve time intervals without revealing actual dates)
- `dcmjs` can modify DICOM datasets for re-export
