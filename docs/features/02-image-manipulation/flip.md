# Image Flip (Horizontal/Vertical)

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Medium

## Description

Mirror the displayed image horizontally or vertically. Commonly used to correct laterality or to match a conventional display orientation.

## Benefits

- **Laterality correction** — Ensures images are displayed with correct left-right orientation, which is critical for surgical planning
- **Conventional display** — Some imaging protocols expect specific orientations (e.g., chest X-rays displayed as if facing the patient)
- **Quick toggle** — Flip on/off with a single click or keyboard shortcut

## Current Implementation

- Horizontal flip toggle
- Vertical flip toggle
- Toolbar buttons and keyboard shortcut (F)
- State persists during session, resets with "Reset View"

## Key Files

- `src/stores/viewportStore.ts`
- `src/components/viewer/ViewportToolbar.tsx`
