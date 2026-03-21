# Image Fusion / Overlay

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Weasis

## Description

Overlay one image series on top of another with adjustable opacity, typically used to fuse functional imaging (PET, SPECT) with anatomical imaging (CT, MRI). The functional data is displayed in color (using a LUT) over the grayscale anatomical image.

## Benefits

- **PET/CT correlation** — The primary clinical use case: overlay metabolic PET data onto anatomical CT to precisely localize areas of increased tracer uptake
- **Treatment planning** — Radiation therapy planning relies on fusing planning CT with diagnostic MRI or PET
- **Research** — Functional MRI (fMRI) activation maps overlaid on structural MRI for neuroscience research
- **Before/after comparison** — Overlay pre- and post-treatment images to visualize changes

## Why It Matters for OpenScans

Image fusion is a specialized feature primarily needed for nuclear medicine and radiation oncology workflows. While impressive, it requires both pseudo-color LUT support and split view/overlay rendering. This is a long-term differentiator rather than a near-term priority.

## Implementation Considerations

- Requires pseudo-color LUT mapping to be implemented first
- Image registration (alignment) between two series
- Adjustable overlay opacity slider
- Cornerstone3D supports viewport overlays and fusion rendering
- Significant complexity in handling misregistration and different voxel sizes
