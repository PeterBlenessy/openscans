# DICOM Overlay / Contextual Information Display

**Status**: ❌ Not Implemented
**Category**: UX & Accessibility
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis

## Description

Display key DICOM metadata directly on the viewport corners as a semi-transparent overlay. Typical information includes patient name, study date, series description, instance number, window/level values, zoom level, and image dimensions. This provides at-a-glance context without opening a separate metadata panel.

## Benefits

- **Always-visible context** — Essential metadata is visible at all times without opening sidebars or panels
- **Clinical standard** — Every clinical PACS viewer displays patient information and technical parameters on the viewport corners
- **Configurable** — Users can choose which tags to display in which corner
- **Non-intrusive** — Semi-transparent text overlays don't obscure the medical image

## Why It Matters for OpenScans

Viewport overlay information is a standard feature that clinicians expect. While OpenScans has a metadata sidebar, the convention in medical imaging is to show key information directly on the image. This is relatively low effort and high value for clinical users.

## Implementation Considerations

- Four corner overlay positions (top-left, top-right, bottom-left, bottom-right)
- Default layout: patient info (TL), study info (TR), series/instance (BL), technical (BR)
- Semi-transparent background for readability over any image
- Configurable tag selection per corner
- Toggle overlay visibility (show/hide)
- Respect privacy settings (hide patient data when privacy mode is on)
