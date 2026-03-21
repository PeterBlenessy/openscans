# RT Structure Set (RTSS) Display

**Status**: ❌ Not Implemented
**Category**: Segmentation
**Priority**: Tier 3 — Long-term
**Present In**: OHIF

## Description

Display DICOM RT Structure Sets, which contain contour data used in radiation therapy planning. RTSS defines the outlines of treatment targets (tumors) and organs at risk on each image slice. These contours are rendered as colored outlines overlaid on the planning CT.

## Benefits

- **Radiation oncology review** — View treatment plans with target volumes and organ contours
- **Treatment verification** — Verify that contours correctly outline the intended structures
- **Multi-disciplinary review** — Share treatment plans for tumor board discussion
- **Quality assurance** — Check contour accuracy before treatment delivery

## Why It Matters for OpenScans

RT Structure Set display is a specialized feature for radiation oncology workflows. While OHIF has implemented it, this is a niche use case for a standalone viewer. Consider only if OpenScans expands into oncology imaging workflows.

## Implementation Considerations

- Parse DICOM RTSS contour data
- Project contours onto corresponding CT slices
- Color-coded rendering per structure
- Handle contours in non-acquisition planes (oblique projection)
- Cornerstone3D and OHIF have RTSS rendering implementations
