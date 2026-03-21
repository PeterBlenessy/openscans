# DICOM-SEG Support

**Status**: ❌ Not Implemented
**Category**: Segmentation
**Priority**: Tier 3 — Long-term
**Present In**: OHIF

## Description

Import and display DICOM Segmentation objects (DICOM-SEG), which are a standardized way to store segmentation masks alongside DICOM images. This enables viewing segmentations created by other software or AI algorithms that output DICOM-SEG format.

## Benefits

- **AI integration** — Many commercial and research AI tools output results as DICOM-SEG; supporting this format enables viewing AI segmentation results
- **Interoperability** — DICOM-SEG is the standard format for sharing segmentations between PACS systems and viewers
- **Research** — View and verify segmentations from automated pipelines without switching tools
- **Standards compliance** — Part of the DICOM standard (Supplement 145)

## Why It Matters for OpenScans

As AI-powered segmentation becomes more prevalent, the ability to display segmentation results is increasingly important. This aligns with OpenScans' AI-forward strategy but is complex to implement and currently niche.

## Implementation Considerations

- Parse DICOM-SEG binary format using `dcmjs`
- Map segmentation frames to corresponding image instances
- Render color-coded overlay with adjustable opacity
- Handle multi-segment objects (multiple structures in one DICOM-SEG)
- Cornerstone3D has DICOM-SEG loading and display support
