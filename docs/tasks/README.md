# OpenScans Task Breakdowns

Implementation task breakdowns for each unimplemented or partially implemented feature. Each task file includes step-by-step implementation instructions, specific file paths, code patterns, dependencies, and acceptance criteria.

## How to Use This Directory

1. **Pick a task** from the priority list below
2. **Check dependencies** — some tasks require others to be completed first
3. **Follow the steps** — each task is broken into sequential implementation steps
4. **Verify acceptance criteria** — each task lists what "done" looks like

## Priority Overview

### Tier 1 — Should Implement (High impact, most expected by users)

| Task | Effort | Dependencies | Category |
|------|--------|-------------|----------|
| [Distance Measurement](04-annotations-measurements/distance-measurement.md) | Medium (3-4d) | None | Annotations |
| [Angle Measurement](04-annotations-measurements/angle-measurement.md) | Medium (2-3d) | Distance Measurement | Annotations |
| [Cine Loop](02-image-manipulation/cine-loop.md) | Low (1-2d) | None | Image Manipulation |
| [Full-Screen Mode](03-advanced-viewing/fullscreen-mode.md) | Low (0.5-1d) | None | Advanced Viewing |
| [Split / Comparison View](03-advanced-viewing/split-comparison-view.md) | High (5-8d) | None | Advanced Viewing |
| [Ellipse / Rectangle ROI](04-annotations-measurements/ellipse-rectangle-roi.md) | Medium (3-4d) | Distance Measurement | Annotations |
| [Subscription AI — Anthropic](07-ai-intelligence/subscription-ai-anthropic.md) | High (8-12d) | None | AI |

### Tier 2 — Should Consider (Differentiating, medium demand)

| Task | Effort | Dependencies | Category |
|------|--------|-------------|----------|
| [DICOM Overlay Info](08-ux-accessibility/dicom-overlay-info.md) | Low-Medium (2-3d) | None | UX |
| [Text Annotations](04-annotations-measurements/text-annotations.md) | Low-Medium (2-3d) | None | Annotations |
| [Internationalization](08-ux-accessibility/internationalization.md) | Medium (4-5d) | None | UX |
| [DICOMDIR Support](01-core-viewing/dicomdir-support.md) | Medium (3-5d) | None | Core Viewing |
| [ROI Statistics](04-annotations-measurements/roi-statistics.md) | Medium (2-3d) | Ellipse/Rect ROI | Annotations |
| [Cobb Angle](04-annotations-measurements/cobb-angle.md) | Medium (2-3d) | Angle Measurement | Annotations |
| [Synchronized Scrolling](03-advanced-viewing/synchronized-scrolling.md) | Medium (3-4d) | Split View | Advanced Viewing |
| [Freehand Drawing](04-annotations-measurements/freehand-drawing.md) | Medium (2-3d) | ROI tools | Annotations |
| [Crosshair / Reference Lines](02-image-manipulation/crosshair-reference-lines.md) | High (5-7d) | Split View | Image Manipulation |
| [MPR](03-advanced-viewing/mpr.md) | Very High (2-3w) | Split View | Advanced Viewing |

### Tier 3 — Evaluate Later (Long-term, specialized)

| Task | Effort | Dependencies | Category |
|------|--------|-------------|----------|
| [Image Filters](02-image-manipulation/image-filters.md) | Medium (3-5d) | None | Image Manipulation |
| [Pseudo-Color LUT](02-image-manipulation/pseudo-color-lut.md) | Medium (3-4d) | None | Image Manipulation |
| [PWA / Offline Support](08-ux-accessibility/pwa-offline-support.md) | Low-Medium (2-3d) | None | UX |
| [Video Export](06-export-sharing/video-export.md) | Medium (3-4d) | Cine Loop | Export |
| [DICOM Anonymization](06-export-sharing/dicom-anonymization.md) | Medium (3-5d) | None | Export |
| [Touch / Mobile Support](08-ux-accessibility/touch-mobile-support.md) | Medium (4-5d) | None | UX |
| [WCAG Accessibility](08-ux-accessibility/wcag-accessibility.md) | Medium (4-5d) | None | UX |
| [DICOM SR Export](04-annotations-measurements/dicom-sr-export.md) | High (5-7d) | Measurements | Annotations |
| [Hanging Protocols](03-advanced-viewing/hanging-protocols.md) | High (5-7d) | Split View | Advanced Viewing |
| [Segmentation Overlays](05-segmentation/segmentation-overlays.md) | Medium (3-4d) | None | Segmentation |
| [Manual Segmentation](05-segmentation/manual-segmentation.md) | Very High (2-3w) | Seg Overlays | Segmentation |
| [DICOM-SEG Support](05-segmentation/dicom-seg-support.md) | High (5-7d) | Seg Overlays | Segmentation |
| [RT Structure Set](05-segmentation/rt-structure-set.md) | High (5-7d) | Seg Overlays | Segmentation |
| [GrowCut](05-segmentation/growcut-semi-auto.md) | Very High (2-3w) | Manual Seg | Segmentation |
| [3D Volume Rendering](03-advanced-viewing/volume-rendering-3d.md) | Very High (3-4w) | MPR | Advanced Viewing |
| [3D Annotations](04-annotations-measurements/3d-annotations.md) | High (5-7d) | MPR | Annotations |
| [Image Fusion](03-advanced-viewing/image-fusion-overlay.md) | Very High (2-3w) | MPR, LUT | Advanced Viewing |
| [Local AI Models](07-ai-intelligence/local-ai-models.md) | Very High (3-4w) | None | AI |
| [DICOMweb / PACS](01-core-viewing/dicomweb-pacs-integration.md) | Very High (3-4w) | None | Core Viewing |
| [Share via Link](06-export-sharing/share-via-link.md) | High (5-7d) | DICOMweb | Export |
| [Authentication](09-privacy-security/authentication.md) | High (5-7d) | DICOMweb | Privacy |

## Dependency Graph

```
(no dependencies)
├── Cine Loop
├── Full-Screen Mode
├── Distance Measurement
│   ├── Angle Measurement
│   │   └── Cobb Angle
│   └── Ellipse/Rectangle ROI
│       ├── ROI Statistics
│       └── Freehand Drawing
├── Split / Comparison View
│   ├── Synchronized Scrolling
│   ├── Crosshair / Reference Lines
│   ├── Hanging Protocols
│   └── MPR (Multiplanar Reconstruction)
│       ├── 3D Volume Rendering
│       ├── 3D Annotations
│       └── Image Fusion
├── Text Annotations (complete)
├── DICOM Overlay Info
├── DICOMDIR Support
├── Internationalization
├── Segmentation Overlays
│   ├── Manual Segmentation
│   │   └── GrowCut
│   ├── DICOM-SEG Support
│   └── RT Structure Set
├── Subscription AI — Anthropic (proxy + auth + quota)
├── DICOMweb / PACS Integration
│   ├── Share via Link
│   └── Authentication (OpenID)
└── Local AI Models
```

## Task File Categories

| Folder | Files | Description |
|--------|-------|-------------|
| `01-core-viewing/` | 2 | File loading and PACS integration |
| `02-image-manipulation/` | 4 | Display tools and image processing |
| `03-advanced-viewing/` | 7 | Multi-viewport and 3D features |
| `04-annotations-measurements/` | 9 | Drawing and measurement tools |
| `05-segmentation/` | 5 | Segmentation creation and display |
| `06-export-sharing/` | 3 | Export formats and sharing |
| `07-ai-intelligence/` | 2 | Subscription AI and local models |
| `08-ux-accessibility/` | 5 | UI, i18n, and accessibility |
| `09-privacy-security/` | 1 | Authentication |
| **Total** | **38** | |

## Recommended Starting Point

For maximum impact with minimum effort, start with these tasks in order:

1. **Full-Screen Mode** (0.5-1 day) — Quick win, universally expected
2. **Cine Loop** (1-2 days) — Low effort, high clinical value
3. **Distance Measurement** (3-4 days) — Most-requested missing tool
4. **DICOM Overlay Info** (2-3 days) — Standard clinical expectation
5. **Angle Measurement** (2-3 days) — Builds on ruler infrastructure
6. **Split View** (5-8 days) — Unlocks many dependent features
