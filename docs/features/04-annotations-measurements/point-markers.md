# Point Markers

**Status**: ✅ Implemented
**Category**: Annotations & Measurements
**Priority**: Essential

## Description

Place labeled point markers on specific locations in a DICOM image. Markers are associated with specific instances and can include text labels, color coding, and severity indicators. AI-generated markers (e.g., vertebral labels) can be manually adjusted by dragging.

## Benefits

- **Precise localization** — Mark exact anatomical landmarks or findings for reference, teaching, or communication
- **AI integration** — AI-detected structures (vertebrae) are displayed as labeled markers that users can verify and adjust
- **Persistent** — Markers are saved in localStorage and persist across sessions
- **Severity coding** — Color-coded markers (green/yellow/red) communicate clinical significance at a glance

## Current Implementation

- AI-generated markers for detected vertebrae (L1-L5, etc.)
- Drag-to-adjust markers for manual correction of AI positions
- Color coding by severity (normal, warning, critical)
- Per-instance annotation storage
- Original position tracking for comparison with adjusted position
- localStorage persistence

## Key Files

- `src/stores/annotationStore.ts`
- `src/types/annotation.ts`
