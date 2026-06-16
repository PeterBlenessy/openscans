# 3D Annotations (SCOORD3D)

**Status**: ❌ Not Implemented
**Category**: Annotations & Measurements
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF

## Description

Create and display annotations with 3D spatial coordinates (SCOORD3D) that are not bound to a specific image plane. This enables measurements, points, and shapes to exist in true volumetric space, maintaining accuracy when viewed from different orientations.

## Benefits

- **Volumetric accuracy** — Annotations are defined in 3D patient coordinates, so they remain correct regardless of viewing orientation
- **MPR compatibility** — 3D annotations are visible in any reconstructed plane, not just the original acquisition plane
- **True distance measurement** — 3D coordinates enable accurate oblique distance measurements that account for slice thickness
- **Future-proof** — As 3D visualization becomes more common, 3D annotations provide the correct foundation

## Why It Matters for OpenScans

3D annotations are an advanced feature that depends on MPR and volume rendering capabilities. Since these are not yet implemented, 3D annotations are a long-term consideration. Current 2D annotations serve the existing viewing workflow well.

## Implementation Considerations

- Requires MPR or multi-plane viewing first
- DICOM SCOORD3D coordinate encoding
- Projection of 3D annotations onto 2D viewport planes
- Cornerstone3D has native 3D annotation support
- Complex interaction model for placing annotations in 3D space
