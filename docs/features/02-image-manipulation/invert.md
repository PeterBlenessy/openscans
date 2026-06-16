# Image Inversion (Negative)

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Medium

## Description

Toggle the image between positive and negative display (invert grayscale values). What was white becomes black and vice versa.

## Benefits

- **Diagnostic aid** — Some pathologies are easier to spot in inverted mode; for example, subtle pneumothorax lines on chest X-rays can become more visible
- **Viewing preference** — Some radiologists prefer inverted display for certain modalities (e.g., mammography, dental X-rays)
- **Quick toggle** — One-click or keyboard shortcut (I) to switch between normal and inverted

## Current Implementation

- Toggle inversion via toolbar button or keyboard shortcut (I)
- Applied as a rendering transform, not modifying pixel data
- Resets with "Reset View"

## Key Files

- `src/stores/viewportStore.ts`
- `src/components/viewer/ViewportToolbar.tsx`
