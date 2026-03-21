# Crosshair / Reference Lines

**Status**: ❌ Not Implemented
**Category**: Image Manipulation
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis

## Description

Display reference lines on one viewport that show the current slice position from another viewport. When viewing a sagittal MRI, for example, a reference line on the axial view shows exactly which sagittal slice is being displayed. Crosshairs show the intersection point across multiple planes.

## Benefits

- **Spatial orientation** — Helps users understand exactly where in 3D space the current slice is located relative to other orientations
- **Cross-referencing** — Essential when comparing axial, sagittal, and coronal views of the same anatomy
- **Clinical standard** — Radiologists rely on reference lines for accurate localization of findings across planes
- **Requires split view** — This feature naturally pairs with comparison/split view functionality

## Why It Matters for OpenScans

Reference lines are particularly important for MRI and CT studies where multiple series in different orientations are acquired. This feature would pair well with the planned split/comparison view to create a powerful multi-plane viewing experience.

## Implementation Considerations

- Requires split view to be implemented first
- Calculate slice position intersection geometry between two viewports
- Render reference lines as overlays on the viewport canvas
- Update lines dynamically as the user scrolls through either viewport
- Cornerstone3D has built-in reference line tools that could be leveraged
