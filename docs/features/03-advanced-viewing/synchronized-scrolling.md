# Synchronized Scrolling

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Link the scroll position of two or more viewports so that scrolling through one series automatically advances the corresponding position in another. Synchronization can be based on slice position, frame of reference, or image number.

## Benefits

- **Anatomical correspondence** — When comparing two series of the same anatomy, synchronized scrolling ensures both viewports show the same anatomical level
- **Efficient comparison** — Users scroll once to navigate both viewports simultaneously, halving the interaction effort
- **Prior comparison** — Essential for comparing current and prior studies — scroll through both at once to detect changes
- **Multi-sequence correlation** — In MRI, correlate findings across T1, T2, and contrast-enhanced sequences at the same anatomical location

## Why It Matters for OpenScans

Synchronized scrolling is the natural companion to split view. Without it, side-by-side comparison requires manual coordination of scroll positions, which is tedious and error-prone. This feature transforms split view from a layout convenience into a powerful diagnostic tool.

## Implementation Considerations

- Requires split/comparison view to be implemented first
- Synchronization by DICOM frame of reference UID (ideal) or slice position
- Fallback to image index ratio for studies with different slice counts
- Toggle sync on/off per viewport pair
- Handle series with different slice thicknesses or coverage areas
