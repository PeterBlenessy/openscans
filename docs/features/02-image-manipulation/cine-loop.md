# Cine Loop / Auto-Play

**Status**: ❌ Not Implemented
**Category**: Image Manipulation
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, Stone Web Viewer

## Description

Automatically play through a series of images in sequence, like a video. Includes playback controls for speed adjustment, play/pause, loop mode, and forward/reverse direction.

## Benefits

- **Essential for dynamic imaging** — Cardiac MRI, fluoroscopy, and ultrasound studies are designed to be viewed as moving sequences, not static frames
- **Smooth scrolling** — Even for static CT/MR studies, cine mode provides a smooth fly-through that helps identify subtle findings across slices
- **Adjustable speed** — Different studies require different playback speeds (cardiac cine at 15-30 fps, CT scroll at 5-10 fps)
- **Hands-free review** — Once started, the user can observe without manual interaction, freeing hands for dictation or note-taking

## Why It Matters for OpenScans

This is one of the most commonly expected features in any DICOM viewer. Its absence is immediately noticed by clinical users. Cine loop is particularly important for cardiac imaging, fluoroscopy review, and efficient scrolling through large CT/MR datasets. Implementation effort is relatively low since the navigation infrastructure already exists.

## Implementation Considerations

- Timer-based automatic advancement through instances
- Configurable playback speed (fps slider or presets)
- Play/Pause toggle button and keyboard shortcut
- Forward/reverse direction toggle
- Loop vs. bounce (ping-pong) vs. stop-at-end modes
- Frame rate display during playback
