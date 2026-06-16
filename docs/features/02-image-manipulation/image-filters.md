# Image Filters (Sharpen, Smooth, Edge Detect)

**Status**: ❌ Not Implemented
**Category**: Image Manipulation
**Priority**: Tier 3 — Evaluate Later
**Present In**: Weasis, DWV

## Description

Apply post-processing filters to the displayed image for enhanced visualization. Common filters include sharpening (enhance edges), smoothing (reduce noise), edge detection (highlight boundaries), and threshold filtering.

## Benefits

- **Noise reduction** — Smoothing filters can help visualize structures in noisy images (low-dose CT, portable X-rays)
- **Edge enhancement** — Sharpening highlights boundaries between tissues, potentially making fracture lines or lesion margins more visible
- **Research utility** — Image processing filters are useful for educational and research purposes
- **Non-destructive** — Filters are applied to the display only, not the underlying DICOM data

## Why It Matters for OpenScans

Image filters are a "nice to have" rather than essential. Most clinical workflows rely on window/level adjustment rather than post-processing filters. However, for research and educational use cases, filters can be valuable. This is lower priority compared to measurement tools and cine loop.

## Implementation Considerations

- Convolution kernels applied to pixel data before rendering
- GPU-accelerated filtering via WebGL shaders for real-time performance
- Filter strength/parameter controls
- Toggle filters on/off without affecting original data
- Cornerstone3D may provide filter infrastructure
