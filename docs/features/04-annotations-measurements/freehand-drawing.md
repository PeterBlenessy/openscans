# Freehand Drawing

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis, DWV

## Description

Draw freeform shapes on the image by clicking and dragging. The drawn contour can outline irregular structures, mark areas of concern, or create custom ROI regions that don't conform to simple geometric shapes.

## Benefits

- **Irregular structure outlining** — Tumors, organs, and pathological findings are rarely circular or rectangular; freehand drawing can trace their actual boundaries
- **Communication** — Circle or highlight areas to draw attention to specific findings when sharing images
- **Area measurement** — Freehand-drawn regions can calculate the enclosed area for irregular shapes
- **Teaching** — Annotate images for educational presentations by outlining relevant anatomy

## Why It Matters for OpenScans

Freehand drawing adds flexibility to the annotation toolkit. While less precise than geometric ROI tools, it handles the common case of "circle this area" that clinicians and educators frequently need. It's moderate priority — geometric ROI tools cover most quantitative needs.

## Implementation Considerations

- Mouse/touch-based drawing with smooth path interpolation
- Closed contour for area calculation
- Open path option for simple marking/highlighting
- Cornerstone3D provides freehand ROI tools
- Path smoothing to handle jittery mouse input
- Persist as `RegionAnnotation` with polygon points
