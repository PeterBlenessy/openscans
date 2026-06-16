# Multiplanar Reconstruction (MPR)

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Reconstruct and display images in arbitrary planes (axial, sagittal, coronal, and oblique) from a volumetric dataset. MPR takes a stack of axial CT or MRI slices and generates sagittal and coronal views on-the-fly, allowing simultaneous multi-plane viewing of the same anatomy.

## Benefits

- **3D understanding from 2D data** — View anatomy in all three standard planes from a single acquisition, providing complete spatial understanding
- **Lesion characterization** — Evaluate the size, shape, and extent of findings in multiple planes for more accurate assessment
- **Surgical planning** — Surgeons rely on coronal and sagittal reconstructions for operative planning
- **Spine assessment** — Sagittal and coronal MPR views are essential for vertebral alignment and disc evaluation

## Why It Matters for OpenScans

MPR is an advanced feature that would significantly elevate OpenScans from a basic viewer to a clinical-grade tool. Given OpenScans' AI vertebral detection focus, sagittal and coronal MPR views of the spine would complement the AI features particularly well. However, this is a technically complex feature requiring volume data management.

## Implementation Considerations

- Requires Cornerstone3D VolumeViewport (already available in the library)
- Load entire series into a 3D volume in GPU memory
- Render three orthogonal planes simultaneously
- Interactive plane positioning (drag to reslice)
- Significant memory requirements for large volumes
- Best paired with split view for multi-plane display
