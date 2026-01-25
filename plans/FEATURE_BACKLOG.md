# OpenScans - Feature Backlog

**Last Updated**: January 24, 2026
**Purpose**: Track proposed features and UX improvements beyond the current roadmap

---

## Overview

This document captures feature ideas and UX improvements for consideration in future development phases. Features are categorized by priority and complexity.

---

## High Priority Features

### 1. Settings Panel ✅ COMPLETED

**Description**: A dedicated settings modal or sidebar section for user preferences.

**Status**: Implemented January 24, 2026

**Implemented Features**:

#### Appearance
- Dark/Light theme toggle

#### Viewport Behavior
- Mouse wheel scroll direction (natural vs inverted)
- Window/Level sensitivity adjustment
- Zoom sensitivity adjustment

#### Display Preferences
- Show/hide DICOM metadata overlay on viewport
- Persist studies setting (reload studies after refresh)

**Additional Settings Possible**:
- Thumbnail size options
- Preload adjacent images settings

**Complexity**: Medium
**Dependencies**: None

---

### 2. Reset View Button ✅ COMPLETED

**Description**: A toolbar button to reset zoom, pan, rotation, and window/level to defaults.

**Status**: Implemented as part of the Viewport Toolbar (January 20, 2026)

---

### 3. Viewport Toolbar ✅ COMPLETED

**Description**: A floating or docked toolbar on the viewport with quick-access buttons for common actions.

**Status**: Implemented January 20, 2026

**Implemented Features**:
- Reset view button
- Fit to window
- Zoom in/out buttons
- Rotate 90° clockwise/counter-clockwise
- Flip horizontal/vertical (toggleable)
- Invert colors (toggleable)
- Floating overlay at top center of viewport

---

## Medium Priority Features

### 4. Theme Toggle (Light/Dark) ✅ COMPLETED

**Description**: Option to switch between dark and light color schemes.

**Status**: Implemented January 24, 2026

**Implemented Features**:
- Dark/Light theme toggle in Settings Panel
- Persisted in localStorage (via settingsStore)
- Applied globally across all components
- Smooth transitions between themes

**Rationale**:
- Some radiologists prefer light backgrounds
- Accessibility compliance
- Better visibility in bright environments

**Complexity**: Low-Medium
**Dependencies**: None

---

### 5. Cine Loop / Auto-play

**Description**: Automatically play through image slices at configurable frame rates.

**Rationale**: Common feature in medical imaging for reviewing MR series, cardiac imaging, or progression over time.

**Features**:
- Play/pause button
- Speed control (1-30 fps)
- Loop modes: once, loop, ping-pong (forward-backward)
- Frame counter display
- Keyboard shortcut (Space to play/pause)

**Complexity**: Medium
**Dependencies**: None

---

### 6. Comparison / Split View

**Description**: View two or more series or timepoints side-by-side.

**Rationale**: Essential for comparing pre/post treatment, different sequences, or timepoints.

**Features**:
- Layout options: 1x1, 1x2, 2x1, 2x2
- Synchronized scrolling between viewports (optional)
- Synchronized Window/Level linking (optional)
- Independent or linked zoom/pan
- Easy series assignment to each viewport

**Complexity**: High
**Dependencies**: Refactoring DicomViewport to support multiple instances

---

### 7. Recent Studies History ✅ COMPLETED

**Description**: Keep track of recently loaded studies within a session.

**Status**: Implemented January 20, 2026

**Implemented Features**:
- Session history list in left drawer menu
- Quick-switch between loaded studies
- Study metadata display (patient name, description, series/image counts)
- Clear history option
- Automatic tracking when studies are loaded
- Limits to 10 most recent entries

---

### 8. Contextual Information Overlay

**Description**: Configurable DICOM tag display overlay on viewport corners.

**Rationale**: Standard feature in PACS viewers. Provides quick access to essential patient and study information.

**Standard Layout**:
- Top-left: Patient name, ID, DOB, sex
- Top-right: Institution, study date, study description
- Bottom-left: Series description, slice location, slice thickness
- Bottom-right: Window/Level values, zoom percentage, image dimensions

**Customization**:
- Toggle visibility per corner
- Select which tags to display
- Font size options

**Complexity**: Medium
**Dependencies**: None

---

## Low Priority Features

### 9. Full-Screen Mode

**Description**: Browser full-screen API integration for maximum viewport space.

**Features**:
- Dedicated button or F11 shortcut
- Hide all UI chrome except essential controls
- Escape to exit
- Optional: auto-hide toolbar with mouse movement

**Complexity**: Low
**Dependencies**: None

---

### 10. Basic Measurement Tools

**Description**: Foundational measurement capabilities before full annotation system.

**Rationale**: Measurements are essential for clinical assessment. Can be implemented before the full Phase 2 annotation system.

**Tools**:
- Distance ruler (line with length in mm)
- Angle measurement (three-point angle)
- ROI rectangle/ellipse with mean/std pixel values

**Implementation Notes**:
- Could use Cornerstone Tools or custom implementation
- Store measurements in annotationStore
- Export measurements with images

**Complexity**: High
**Dependencies**: Cornerstone Tools integration or custom drawing layer

---

## Features NOT Recommended

The following features were considered but are not recommended for this project:

| Feature | Reason |
|---------|--------|
| Language/localization | Overkill for MVP scope |
| User accounts/profiles | Requires backend infrastructure |
| Cloud sync | Requires backend infrastructure |
| Plugin/extension system | Too complex, limited benefit |
| PACS connection settings | Deferred to Phase 3+ |
| Mobile-specific features | Desktop/tablet focus per PRD |

---

## Implementation Suggestions

### Quick Wins (< 1 day each)
1. ~~Reset View Button~~ ✅ Completed
2. Full-Screen Mode
3. Theme Toggle (if using Tailwind dark mode)

### Medium Effort (1-3 days each)
1. Settings Panel (basic version)
2. ~~Viewport Toolbar~~ ✅ Completed
3. Cine Loop
4. Contextual Information Overlay
5. ~~Recent Studies History~~ ✅ Completed

### Larger Efforts (3+ days each)
1. Comparison/Split View
2. Measurement Tools
3. Settings Panel (full version with persistence)

---

## Integration with Existing Roadmap

These features can be integrated into the existing phase structure:

| Feature | Suggested Phase | Status |
|---------|-----------------|--------|
| Reset View Button | Phase 1.5 (Polish) | ✅ Completed |
| Viewport Toolbar | Phase 1.5 (Polish) | ✅ Completed |
| Recent Studies | Phase 1.5 (Polish) | ✅ Completed |
| Left Drawer Menu | Phase 1.5 (Polish) | ✅ Completed |
| Theme Toggle | Phase 1.5 or Phase 4 | ✅ Completed |
| Settings Panel | Phase 1.5 or Phase 4 | ✅ Completed |
| Cine Loop | Phase 2 or standalone | Pending |
| Contextual Overlay | Phase 2 | Pending |
| Measurement Tools | Phase 2 (with annotations) | Pending |
| Split View | Phase 2 or Phase 3 | Pending |
| Full-Screen Mode | Phase 4 (Polish) | Pending |

---

## Contributing

When adding new feature ideas to this document:
1. Include a clear description and rationale
2. Estimate complexity (Low/Medium/High)
3. Note any dependencies
4. Suggest which phase it belongs to

---

**Note**: This is a living document. Features may be re-prioritized based on user feedback and project needs.
