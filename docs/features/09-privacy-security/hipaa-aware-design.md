# HIPAA-Aware Design

**Status**: ✅ Implemented
**Category**: Privacy & Security
**Priority**: Essential

## Description

The application is designed with HIPAA (Health Insurance Portability and Accountability Act) principles throughout. This includes privacy-first defaults, minimal data exposure, secure handling of patient information, and careful consideration of protected health information (PHI) in all features.

## Benefits

- **Regulatory readiness** — While not formally certified, the architecture supports HIPAA compliance
- **Privacy defaults** — Patient data is hidden or excluded by default; users must explicitly opt in to display or export PII
- **Safe logging** — Console logs never contain patient names, IDs, or dates
- **Export controls** — Privacy-first filenames and optional metadata inclusion on exports
- **Institutional confidence** — Healthcare organizations can evaluate the application knowing HIPAA was a design consideration

## Current Implementation

- Privacy-first export filenames (PII excluded by default)
- Patient privacy toggle in settings (hide personal information from display)
- HIPAA-aware console logging (no PHI in log output)
- AI consent management (explicit opt-in for data transmission)
- No server-side data storage

## Key Files

- `src/stores/settingsStore.ts`
- `src/lib/export/fileNaming.ts`
