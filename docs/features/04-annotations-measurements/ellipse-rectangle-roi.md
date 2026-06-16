# Ellipse / Rectangle ROI

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, DWV

## Description

Draw elliptical or rectangular regions of interest (ROI) on an image and compute pixel statistics within the region, including mean value, standard deviation, minimum, maximum, and area. This provides quantitative information about tissue characteristics within a defined region.

## Benefits

- **Tissue characterization** — Mean pixel values within an ROI help characterize tissue density (CT Hounsfield units) or signal intensity (MRI)
- **Diagnostic support** — Distinguish solid from cystic lesions, characterize adrenal masses, or assess fat content based on ROI statistics
- **Research** — Quantitative region analysis is fundamental for imaging research and clinical trials
- **Standardized reporting** — ROI measurements are frequently included in radiology reports (e.g., "mean attenuation 35 HU, consistent with simple fluid")

## Why It Matters for OpenScans

ROI statistics provide the quantitative dimension that complements visual assessment. For a DICOM viewer with AI analysis capabilities, adding ROI measurements creates a more complete quantitative toolkit. The type system already defines `RegionAnnotation`.

## Implementation Considerations

- Ellipse and rectangle drawing tools with click-drag interaction
- Calculate mean, std dev, min, max, area within the region
- Display in appropriate units (HU for CT, arbitrary units for MR)
- Use DICOM rescale slope/intercept for correct HU values
- Cornerstone3D provides built-in ROI tools
- Persist in annotation store as `RegionAnnotation`
