# GrowCut (Semi-Automatic Segmentation)

**Status**: ❌ Not Implemented
**Category**: Segmentation
**Priority**: Tier 3 — Long-term
**Present In**: OHIF (WebGPU)

## Description

A semi-automatic segmentation algorithm where the user provides seed points (foreground and background markers), and the algorithm automatically grows the segmentation to fill the target structure. OHIF recently introduced a WebGPU-accelerated implementation that provides real-time visual feedback.

## Benefits

- **Faster than manual** — Users provide minimal input (a few seed points) and the algorithm does the heavy lifting
- **Interactive refinement** — Add more seeds to refine the result iteratively
- **GPU-accelerated** — WebGPU implementation enables real-time feedback even on large volumes
- **Research tool** — Useful for creating segmentation datasets with less manual effort

## Why It Matters for OpenScans

GrowCut is a cutting-edge feature that only OHIF has implemented (and only recently). This is aspirational rather than practical for OpenScans' current scope. However, it represents the direction medical imaging is heading — AI-assisted semi-automatic analysis.

## Implementation Considerations

- Requires WebGPU support (not yet widely available in all browsers)
- Complex algorithm implementation (cellular automaton-based)
- Needs segmentation overlay infrastructure first
- Significant development effort for a niche feature
- Could leverage Cornerstone3D's segmentation tools as foundation
