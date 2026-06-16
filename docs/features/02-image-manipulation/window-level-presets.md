# Window/Level Presets

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: High

## Description

Predefined window/level combinations optimized for viewing specific tissue types (lung, bone, brain, abdomen, etc.). Users can switch between presets with a single click instead of manually adjusting brightness and contrast.

## Benefits

- **Instant optimization** — One click to see lung parenchyma, another click to see bone detail — no manual fiddling required
- **Consistency** — Standardized values ensure consistent viewing across sessions and users
- **Time savings** — Radiologists reviewing a CT scan typically check multiple tissue windows; presets make this a rapid workflow
- **Educational** — Helps non-radiologist users understand that different settings reveal different anatomy

## Current Implementation

- Predefined presets for common tissue types
- Quick-access buttons in the viewport toolbar via dropdown
- Modality-specific defaults applied automatically on image load

## Key Files

- `src/components/viewer/ImagePresets.tsx`
- `src/stores/viewportStore.ts`
