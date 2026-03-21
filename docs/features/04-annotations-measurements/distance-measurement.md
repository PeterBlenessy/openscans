# Distance Measurement (Ruler)

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, DWV

## Description

Draw a line between two points on an image and display the real-world distance in millimeters or centimeters. The measurement uses DICOM pixel spacing metadata to convert pixel distances to physical units.

## Benefits

- **Quantitative assessment** — Measure tumor size, organ dimensions, fracture displacement, or vessel diameter directly on the image
- **Clinical requirement** — Size measurements are included in nearly every radiology report (e.g., "3.2 cm hepatic lesion")
- **Treatment decisions** — Many clinical guidelines use size thresholds (e.g., aortic aneurysm >5.5 cm requires intervention)
- **Follow-up comparison** — Measure the same finding over time to track growth or regression
- **Most-used annotation tool** — After W/L adjustment, distance measurement is the most commonly used tool in clinical viewing

## Why It Matters for OpenScans

This is the single most impactful missing annotation feature. Every clinical DICOM viewer includes a ruler tool. Its absence limits OpenScans' utility for any clinical or semi-clinical use case. The type system already defines `MeasurementAnnotation` — the foundation is in place.

## Implementation Considerations

- Use DICOM pixel spacing tags (0028,0030) and imager pixel spacing (0018,1164) for calibration
- Display distance in mm with one decimal place precision
- Render the line, endpoints, and distance label on a canvas overlay
- Cornerstone3D provides built-in length measurement tools
- Persist measurements in the annotation store
- Handle images without pixel spacing metadata (display in pixels with a warning)
