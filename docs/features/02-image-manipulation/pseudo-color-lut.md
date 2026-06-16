# Pseudo-Color / LUT Mapping

**Status**: ❌ Not Implemented
**Category**: Image Manipulation
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Weasis

## Description

Apply color lookup tables (LUTs) to grayscale DICOM images, mapping pixel intensity values to colors. Common LUTs include hot metal, rainbow, jet, and PET-specific color maps. This transforms grayscale images into color-coded visualizations.

## Benefits

- **Enhanced visualization** — Color mapping can make subtle intensity differences more perceptible than grayscale alone
- **PET/Nuclear medicine** — PET and SPECT images are conventionally displayed using color LUTs (hot metal, rainbow) to represent tracer uptake
- **Quantitative analysis** — Color mapping helps quickly identify regions of high or low intensity (e.g., areas of increased metabolic activity)
- **Fusion imaging** — Color LUTs are essential when overlaying PET onto CT (PET/CT fusion) to distinguish the two datasets

## Why It Matters for OpenScans

Color LUTs are primarily needed for nuclear medicine and functional imaging. Since OpenScans currently focuses on anatomical imaging (X-ray, CT, MRI), this is lower priority. However, adding basic LUT support would enable PET/CT viewing and broaden the application's utility.

## Implementation Considerations

- Define standard LUT tables (hot metal, rainbow, jet, etc.)
- Apply LUT as a rendering transform in Cornerstone3D
- LUT selector dropdown in the toolbar
- Preserve grayscale as the default for non-functional imaging
- Support for DICOM-embedded LUTs (Modality LUT, VOI LUT)
