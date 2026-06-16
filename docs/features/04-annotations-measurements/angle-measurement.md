# Angle Measurement

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, DWV

## Description

Measure the angle formed between two lines (three points) on an image. The user clicks three points to define two line segments meeting at a vertex, and the angle between them is displayed in degrees.

## Benefits

- **Orthopedic assessment** — Measure joint angles, fracture angulation, spinal curvature, and limb alignment
- **Spine evaluation** — Assess vertebral body wedging, kyphosis, and lordosis angles
- **Surgical planning** — Determine correction angles for osteotomies and fracture reduction
- **Follow-up tracking** — Monitor angular changes over time (e.g., progressive scoliosis)

## Why It Matters for OpenScans

Given OpenScans' focus on vertebral detection and spine imaging, angle measurement is particularly relevant. Spinal assessment routinely involves measuring kyphotic/lordotic angles, vertebral body wedging, and Cobb angles. This feature directly complements the AI vertebral detection capability.

## Implementation Considerations

- Three-point interaction: click start of line 1, vertex, end of line 2
- Display angle in degrees with one decimal precision
- Cornerstone3D provides built-in angle measurement tools
- Render angle arc and label on the overlay canvas
- Persist in annotation store as `MeasurementAnnotation` with `subType: 'angle'`
