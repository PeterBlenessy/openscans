# AI Consent Management

**Status**: ✅ Implemented
**Category**: AI & Intelligence
**Priority**: Essential for AI features

## Description

Require explicit user consent before sending any image data to external AI APIs. Users are clearly informed that their images will be transmitted to third-party services and must actively opt in. Consent status is tracked and persisted.

## Benefits

- **Informed consent** — Users understand exactly what happens with their data before any transmission occurs
- **Regulatory compliance** — Supports HIPAA and GDPR requirements for informed consent before processing personal health information
- **Trust building** — Transparent disclosure of data handling builds user confidence in the application
- **User control** — Consent can be revoked at any time, stopping all future AI API calls
- **Unique feature** — No competitor implements AI consent management

## Current Implementation

- Consent dialog before first AI operation
- Clear disclosure that images will be sent to external APIs
- Consent state persisted in localStorage
- Consent can be toggled in settings panel
- AI features disabled when consent is not granted

## Key Files

- `src/stores/settingsStore.ts`
- `src/components/settings/SettingsPanel.tsx`
