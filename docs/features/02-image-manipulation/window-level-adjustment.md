# Window/Level Adjustment

**Status**: ✅ Implemented
**Category**: Image Manipulation
**Priority**: Essential

## Description

Interactively adjust the brightness (window level) and contrast (window width) of DICOM images by clicking and dragging on the viewport. This is the most fundamental image manipulation tool in medical imaging, allowing users to optimize the display for different tissue types and anatomical structures.

## Benefits

- **See what matters** — Different tissues (bone, soft tissue, lung) require different brightness/contrast settings to be visible; W/L adjustment reveals structures that are otherwise hidden
- **Interactive and intuitive** — Click-drag interaction provides real-time feedback, letting users fine-tune the display instantly
- **Clinical standard** — Every radiologist expects this tool; it is the single most-used interaction in medical image viewing
- **Configurable sensitivity** — Mouse sensitivity can be adjusted per user preference for precise or fast control

## Current Implementation

- Mouse drag interaction (horizontal = window width, vertical = window level)
- Configurable mouse sensitivity via settings
- Per-modality default values (CT Hounsfield units, MR signal intensity, etc.)
- Values persist when navigating between images in the same series
- Reset to defaults available via toolbar or keyboard shortcut

## Key Files

- `src/hooks/useViewportMouseInteraction.ts`
- `src/stores/viewportStore.ts`
