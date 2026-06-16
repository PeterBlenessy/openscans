# Cobb Angle Measurement

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis

## Description

Measure the Cobb angle for scoliosis assessment. The user draws lines along the superior endplate of the upper-most tilted vertebra and the inferior endplate of the lower-most tilted vertebra. The angle between perpendiculars to these lines gives the Cobb angle, which quantifies the severity of spinal curvature.

## Benefits

- **Scoliosis grading** — The Cobb angle is the gold standard for quantifying scoliosis severity (>10° = scoliosis, >25° = moderate, >40° = severe)
- **Treatment decisions** — Cobb angle thresholds drive clinical decisions: observation (<25°), bracing (25-40°), or surgery (>40°)
- **Follow-up monitoring** — Serial Cobb angle measurements track progression or correction of spinal curvature over time
- **Standardized measurement** — The Cobb method is universally accepted and understood across orthopedics and radiology

## Why It Matters for OpenScans

This feature directly complements OpenScans' AI vertebral detection capability. Since OpenScans already identifies and labels vertebrae, adding Cobb angle measurement creates a natural workflow: AI detects the vertebrae, then the user (or eventually AI) measures the Cobb angle. This is a strong differentiator for spine-focused imaging.

## Implementation Considerations

- Specialized two-line tool (one line per endplate)
- Automatic perpendicular calculation and angle display
- Visual rendering of the endplate lines, perpendiculars, and angle arc
- Could be semi-automated using AI-detected vertebral positions
- Persist as a specialized measurement annotation
