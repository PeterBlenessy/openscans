# Split / Comparison View

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Display two or more image series side by side in a split viewport layout. This enables direct visual comparison between different series (e.g., pre- and post-contrast MRI), different time points (prior vs. current study), or different orientations (axial vs. sagittal).

## Benefits

- **Clinical comparison** — Comparing current and prior studies is one of the most fundamental radiology tasks; side-by-side viewing is essential
- **Multi-series review** — Many imaging protocols produce multiple series (T1, T2, FLAIR in brain MRI); viewing them simultaneously reveals complementary information
- **Treatment monitoring** — Track disease progression or treatment response by comparing studies from different dates
- **Cross-orientation** — View axial and sagittal series of the same anatomy side by side for better spatial understanding

## Why It Matters for OpenScans

This is one of the most impactful missing features. Clinical image review almost always involves comparing studies. Without split view, users must switch back and forth between series, losing visual context. This feature unlocks several dependent features (synchronized scrolling, reference lines, linked W/L).

## Implementation Considerations

- Flexible layout system (1x1, 1x2, 2x1, 2x2)
- Independent viewport state per panel (zoom, W/L, scroll position)
- Layout selector in the toolbar
- Drag-and-drop series assignment to panels
- Foundation for synchronized scrolling and reference lines
- Cornerstone3D supports multiple viewport rendering
