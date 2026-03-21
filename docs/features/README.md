# OpenScans Feature Catalog

Complete feature descriptions for OpenScans — both implemented features and identified gaps from competitor analysis.

Each feature file includes: status, description, user benefits, and (for unimplemented features) priority and implementation considerations.

## Status Legend

- ✅ Implemented
- 🔄 Partially implemented
- ❌ Not implemented

## Feature Categories

### 01 — Core Viewing (9 features)

| Feature | Status |
|---------|--------|
| [Local DICOM Loading](01-core-viewing/local-dicom-loading.md) | ✅ |
| [Drag-and-Drop Upload](01-core-viewing/drag-and-drop-upload.md) | ✅ |
| [Folder Upload](01-core-viewing/folder-upload.md) | ✅ |
| [Auto Study/Series Organization](01-core-viewing/auto-study-organization.md) | ✅ |
| [Zero-Footprint Web App](01-core-viewing/zero-footprint-web.md) | ✅ |
| [Multi-Modality Support](01-core-viewing/multi-modality-support.md) | ✅ |
| [Desktop App (Tauri)](01-core-viewing/desktop-app.md) | ✅ |
| [DICOMDIR Support](01-core-viewing/dicomdir-support.md) | ❌ |
| [DICOMweb / PACS Integration](01-core-viewing/dicomweb-pacs-integration.md) | ❌ |

### 02 — Image Manipulation (11 features)

| Feature | Status |
|---------|--------|
| [Window/Level Adjustment](02-image-manipulation/window-level-adjustment.md) | ✅ |
| [Window/Level Presets](02-image-manipulation/window-level-presets.md) | ✅ |
| [Zoom and Pan](02-image-manipulation/zoom-pan.md) | ✅ |
| [Image Rotation](02-image-manipulation/rotation.md) | ✅ |
| [Image Flip (H/V)](02-image-manipulation/flip.md) | ✅ |
| [Image Inversion](02-image-manipulation/invert.md) | ✅ |
| [Fit to Screen / Reset View](02-image-manipulation/fit-reset.md) | ✅ |
| [Cine Loop / Auto-Play](02-image-manipulation/cine-loop.md) | ❌ |
| [Crosshair / Reference Lines](02-image-manipulation/crosshair-reference-lines.md) | ❌ |
| [Image Filters](02-image-manipulation/image-filters.md) | ❌ |
| [Pseudo-Color / LUT Mapping](02-image-manipulation/pseudo-color-lut.md) | ❌ |

### 03 — Advanced Viewing (7 features)

| Feature | Status |
|---------|--------|
| [Full-Screen Mode](03-advanced-viewing/fullscreen-mode.md) | ❌ |
| [Split / Comparison View](03-advanced-viewing/split-comparison-view.md) | ❌ |
| [Synchronized Scrolling](03-advanced-viewing/synchronized-scrolling.md) | ❌ |
| [MPR (Multiplanar Reconstruction)](03-advanced-viewing/mpr.md) | ❌ |
| [3D Volume Rendering](03-advanced-viewing/volume-rendering-3d.md) | ❌ |
| [Hanging Protocols](03-advanced-viewing/hanging-protocols.md) | ❌ |
| [Image Fusion / Overlay](03-advanced-viewing/image-fusion-overlay.md) | ❌ |

### 04 — Annotations & Measurements (10 features)

| Feature | Status |
|---------|--------|
| [Point Markers](04-annotations-measurements/point-markers.md) | ✅ |
| [Text Annotations](04-annotations-measurements/text-annotations.md) | 🔄 |
| [Distance Measurement (Ruler)](04-annotations-measurements/distance-measurement.md) | ❌ |
| [Angle Measurement](04-annotations-measurements/angle-measurement.md) | ❌ |
| [Ellipse / Rectangle ROI](04-annotations-measurements/ellipse-rectangle-roi.md) | ❌ |
| [ROI Statistics](04-annotations-measurements/roi-statistics.md) | ❌ |
| [Freehand Drawing](04-annotations-measurements/freehand-drawing.md) | ❌ |
| [Cobb Angle](04-annotations-measurements/cobb-angle.md) | ❌ |
| [DICOM SR Export/Import](04-annotations-measurements/dicom-sr-export.md) | ❌ |
| [3D Annotations (SCOORD3D)](04-annotations-measurements/3d-annotations.md) | ❌ |

### 05 — Segmentation (5 features)

| Feature | Status |
|---------|--------|
| [Manual Segmentation (Brush)](05-segmentation/manual-segmentation.md) | ❌ |
| [DICOM-SEG Support](05-segmentation/dicom-seg-support.md) | ❌ |
| [RT Structure Set](05-segmentation/rt-structure-set.md) | ❌ |
| [Segmentation Overlays](05-segmentation/segmentation-overlays.md) | ❌ |
| [GrowCut (Semi-Auto)](05-segmentation/growcut-semi-auto.md) | ❌ |

### 06 — Export & Sharing (10 features)

| Feature | Status |
|---------|--------|
| [PNG Export](06-export-sharing/png-export.md) | ✅ |
| [JPEG Export](06-export-sharing/jpeg-export.md) | ✅ |
| [PDF Report Export](06-export-sharing/pdf-report-export.md) | ✅ |
| [Batch PDF from Favorites](06-export-sharing/batch-pdf-export.md) | ✅ |
| [Resolution Scaling](06-export-sharing/resolution-scaling.md) | ✅ |
| [Privacy-First Filenames](06-export-sharing/privacy-first-filenames.md) | ✅ |
| [Video Export (AVI/MP4)](06-export-sharing/video-export.md) | ❌ |
| [DICOM Anonymization](06-export-sharing/dicom-anonymization.md) | ❌ |
| [Share via Link/URL](06-export-sharing/share-via-link.md) | ❌ |

### 07 — AI & Intelligence (6 features)

| Feature | Status |
|---------|--------|
| [AI Vertebral Detection](07-ai-intelligence/ai-vertebral-detection.md) | ✅ |
| [AI Radiology Analysis](07-ai-intelligence/ai-radiology-analysis.md) | ✅ |
| [Multi-Provider AI](07-ai-intelligence/multi-provider-ai.md) | ✅ |
| [Drag-to-Adjust AI Markers](07-ai-intelligence/drag-to-adjust-markers.md) | ✅ |
| [AI Consent Management](07-ai-intelligence/ai-consent-management.md) | ✅ |
| [Local AI Models (MONAI/TF.js)](07-ai-intelligence/local-ai-models.md) | ❌ |

### 08 — UX & Accessibility (11 features)

| Feature | Status |
|---------|--------|
| [Dark / Light Theme](08-ux-accessibility/dark-light-theme.md) | ✅ |
| [Keyboard Shortcuts](08-ux-accessibility/keyboard-shortcuts.md) | ✅ |
| [Configurable Sensitivity](08-ux-accessibility/configurable-sensitivity.md) | ✅ |
| [Favorites System](08-ux-accessibility/favorites-system.md) | ✅ |
| [Recent Studies History](08-ux-accessibility/recent-studies.md) | ✅ |
| [Thumbnail Strip](08-ux-accessibility/thumbnail-strip.md) | ✅ |
| [DICOM Overlay Info](08-ux-accessibility/dicom-overlay-info.md) | ❌ |
| [Internationalization (i18n)](08-ux-accessibility/internationalization.md) | ❌ |
| [Touch / Mobile Support](08-ux-accessibility/touch-mobile-support.md) | ❌ |
| [WCAG Accessibility](08-ux-accessibility/wcag-accessibility.md) | ❌ |
| [PWA / Offline Support](08-ux-accessibility/pwa-offline-support.md) | ❌ |

### 09 — Privacy & Security (5 features)

| Feature | Status |
|---------|--------|
| [Client-Side Processing](09-privacy-security/client-side-processing.md) | ✅ |
| [No Telemetry / Tracking](09-privacy-security/no-telemetry.md) | ✅ |
| [HIPAA-Aware Design](09-privacy-security/hipaa-aware-design.md) | ✅ |
| [Privacy-First Exports](09-privacy-security/privacy-first-exports.md) | ✅ |
| [Authentication (OpenID)](09-privacy-security/authentication.md) | ❌ |

## Summary

| Category | Implemented | Partial | Not Implemented | Total |
|----------|-------------|---------|-----------------|-------|
| Core Viewing | 7 | 0 | 2 | 9 |
| Image Manipulation | 7 | 0 | 4 | 11 |
| Advanced Viewing | 0 | 0 | 7 | 7 |
| Annotations & Measurements | 1 | 1 | 8 | 10 |
| Segmentation | 0 | 0 | 5 | 5 |
| Export & Sharing | 6 | 0 | 3 | 9 |
| AI & Intelligence | 5 | 0 | 1 | 6 |
| UX & Accessibility | 6 | 0 | 5 | 11 |
| Privacy & Security | 4 | 0 | 1 | 5 |
| **Total** | **36** | **1** | **36** | **73** |

See [competitor-analysis.md](../competitor-analysis.md) for the full comparison matrix and prioritized gap analysis.
