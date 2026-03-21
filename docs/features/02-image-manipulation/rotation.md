# Image Rotation

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Medium

## Description

Rotate the displayed image in 90-degree increments, clockwise or counter-clockwise. Useful for correcting image orientation or viewing anatomy from a different perspective.

## Benefits

- **Correct orientation** — Some DICOM images may be stored in a non-standard orientation; rotation lets users fix this
- **Comparative viewing** — Rotating to match a reference image or anatomical atlas orientation aids comparison
- **Presentation** — When exporting or presenting images, rotation ensures the correct display orientation

## Current Implementation

- 90° clockwise rotation button
- 90° counter-clockwise rotation button
- Rotation state tracked in viewport store
- Resets with the "Reset View" action

## Key Files

- `src/stores/viewportStore.ts`
- `src/components/viewer/ViewportToolbar.tsx`
