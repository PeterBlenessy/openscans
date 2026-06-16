# Manual Segmentation (Brush Tool)

**Status**: ❌ Not Implemented
**Category**: Segmentation
**Priority**: Tier 3 — Long-term
**Present In**: OHIF

## Description

Paint-based segmentation tool that allows users to manually label regions of an image by "painting" over structures with a brush tool. Different labels (colors) can be assigned to different anatomical structures or findings. The result is a pixel-level mask overlay on the image.

## Benefits

- **Structure delineation** — Precisely outline tumors, organs, or pathological regions for volume calculation or treatment planning
- **Ground truth creation** — Manual segmentation is essential for creating training data for AI/ML models
- **Research** — Volumetric analysis of segmented structures (e.g., tumor volume, organ volume)
- **Treatment planning** — Radiation therapy target delineation and organ-at-risk contouring

## Why It Matters for OpenScans

Manual segmentation is a complex feature primarily needed for research and radiation oncology. For OpenScans' current scope, this is a long-term consideration. However, as AI capabilities expand, the ability to manually correct AI-generated segmentations becomes valuable.

## Implementation Considerations

- Brush, eraser, and threshold painting tools
- Multi-label support (different colors for different structures)
- Undo/redo for segmentation edits
- Segmentation mask overlay with adjustable opacity
- Cornerstone3D has a complete segmentation toolkit
- Significant UI complexity for tool settings and label management
