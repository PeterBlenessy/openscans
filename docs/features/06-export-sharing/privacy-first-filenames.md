# Privacy-First Filenames

**Status**: ✅ Implemented
**Category**: Export & Sharing
**Priority**: High

## Description

Automatically generate export filenames that exclude patient personally identifiable information (PII) by default. Filenames use study metadata (modality, series description, instance number) without patient names or IDs, preventing accidental PII exposure through shared files.

## Benefits

- **Prevent accidental PII exposure** — Shared files don't reveal patient identity through the filename
- **HIPAA alignment** — Supports HIPAA minimum necessary principle by excluding PII from file metadata
- **Safe sharing** — Files can be shared via email, messaging, or cloud storage without de-identification concerns
- **Optional inclusion** — Users can explicitly opt to include patient data when needed (e.g., for clinical filing)
- **Unique feature** — No competitor implements privacy-first filename generation

## Current Implementation

- PII excluded from filenames by default
- Optional toggle to include patient name/ID
- Readable DICOM abbreviation expansion in filenames
- Series description and instance number included for identification

## Key Files

- `src/lib/export/fileNaming.ts`
