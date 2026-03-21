# Video Export (AVI/MP4)

**Status**: ❌ Not Implemented
**Category**: Export & Sharing
**Priority**: Tier 3 — Evaluate Later
**Present In**: Weasis

## Description

Export a series of images as a video file (AVI or MP4), creating an animated sequence from a stack of DICOM images. This is particularly useful for cardiac cine sequences, fluoroscopy, and any dynamic imaging study.

## Benefits

- **Share dynamic studies** — Cardiac MRI cine loops and fluoroscopy sequences are meant to be viewed in motion; video export preserves this
- **Presentation ready** — Videos can be embedded in PowerPoint presentations for case conferences
- **Universal playback** — Recipients can view the study sequence without DICOM viewer software
- **Social media / Education** — Video format enables sharing on educational platforms

## Why It Matters for OpenScans

Video export pairs naturally with the planned cine loop feature. Once auto-play is implemented, adding video export becomes a logical extension. This is lower priority than cine loop itself but adds significant sharing value for dynamic imaging.

## Implementation Considerations

- Browser-based video encoding (MediaRecorder API or ffmpeg.wasm)
- Configurable frame rate and resolution
- MP4 (H.264) for maximum compatibility
- Optional annotation overlay in video
- Progress indicator for encoding
