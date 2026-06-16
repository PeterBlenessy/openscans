# Segmentation Overlays

**Status**: ❌ Not Implemented
**Category**: Segmentation
**Priority**: Tier 3 — Long-term
**Present In**: OHIF, Weasis

## Description

Render segmentation masks as semi-transparent colored overlays on top of the original image. Each segmented structure is displayed in a distinct color with adjustable opacity, allowing users to see both the original anatomy and the segmentation simultaneously.

## Benefits

- **Visual verification** — Immediately see which pixels belong to which segment by color
- **Adjustable visibility** — Opacity controls let users balance between segmentation visibility and underlying anatomy
- **Multi-structure display** — Different colors for different structures (e.g., red for tumor, blue for kidney, green for liver)
- **Toggle per structure** — Show or hide individual segments to focus on specific anatomy

## Why It Matters for OpenScans

Segmentation overlays are the visual component of segmentation support. This becomes relevant if/when DICOM-SEG support or AI segmentation is implemented. The overlay rendering itself is technically straightforward once segmentation data is available.

## Implementation Considerations

- Render colored masks on a separate canvas layer above the image
- Per-segment opacity and visibility controls
- Color picker or predefined color palette for segments
- Performance optimization for large masks
- Cornerstone3D segmentation rendering handles overlays natively
