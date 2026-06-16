# ROI Statistics (Mean, Std Dev, Area)

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis

## Description

Calculate and display pixel value statistics within a defined region of interest (ROI). Statistics typically include mean value, standard deviation, minimum, maximum, pixel count, and physical area. Results are displayed in clinically relevant units (Hounsfield Units for CT).

## Benefits

- **Quantitative diagnosis** — Tissue density measurements help differentiate benign from malignant lesions, characterize fluid collections, and assess bone density
- **Treatment response** — Track changes in lesion density or signal intensity over time to assess treatment effectiveness
- **Quality assurance** — Verify image quality by checking noise levels (standard deviation in uniform regions)
- **Research** — Quantitative measurements are essential for clinical research protocols and trials

## Why It Matters for OpenScans

ROI statistics transform visual assessment into quantitative analysis. This is closely tied to ellipse/rectangle ROI tools — once ROI drawing is implemented, adding statistics is a natural extension that significantly increases clinical utility.

## Implementation Considerations

- Compute mean, std dev, min, max, area from pixel data within ROI boundary
- Apply DICOM rescale slope/intercept for correct physical values
- Display units based on modality (HU for CT, arbitrary units for MR)
- Performance optimization for large ROIs (consider Web Workers)
- Histogram display within ROI (optional advanced feature)
