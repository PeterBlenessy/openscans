# Privacy-First Exports

**Status**: ✅ Implemented
**Category**: Privacy & Security
**Priority**: High — Unique Feature

## Description

All export operations (PNG, JPEG, PDF) exclude patient personally identifiable information by default. Filenames are generated without patient names or IDs, and PDF metadata pages require explicit opt-in to include patient data. This prevents accidental PII exposure through shared files.

## Benefits

- **Prevent accidental disclosure** — The most common way patient data leaks is through file sharing; privacy-first exports eliminate this risk by default
- **Safe sharing** — Exported files can be shared via email, cloud storage, or messaging without de-identification concerns
- **HIPAA minimum necessary** — Implements the HIPAA minimum necessary standard by excluding PII unless explicitly needed
- **User awareness** — When users do opt to include patient data, the explicit action reinforces awareness of PII handling
- **Unique feature** — No competitor implements privacy-first export behavior

## Current Implementation

- Privacy-first filename generation across all export formats
- Optional patient data inclusion toggle per export
- PDF metadata cover page is opt-in for PII
- Resolution scaling and quality controls independent of privacy settings

## Key Files

- `src/lib/export/fileNaming.ts`
- `src/lib/export/pdfExport.ts`
- `src/lib/export/imageExport.ts`
