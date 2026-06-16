# Competitor Analysis & Feature Comparison

**Date**: 2026-03-21
**Purpose**: Identify feature gaps by comparing OpenScans against leading open-source DICOM viewers

## Competitors Analyzed

| Viewer | Platform | Tech Stack | License | Community |
|--------|----------|------------|---------|-----------|
| **[OHIF Viewer](https://github.com/OHIF/Viewers)** | Web (zero-footprint) | React, Cornerstone3D | MIT | ~1,900+ stars, 200+ contributors |
| **[Weasis](https://github.com/nroduit/Weasis)** | Desktop + Web-launch | Java, OpenCV | EPL-2.0/Apache-2.0 | Large clinical user base |
| **[DWV](https://github.com/ivmartel/dwv)** | Web (zero-footprint) | JavaScript, HTML5 | GPL-3.0 | ~1,300 stars |
| **[Stone Web Viewer](https://www.orthanc-server.com/static.php?page=stone-web-viewer)** | Web (zero-footprint) | C++/WebAssembly | AGPL-3.0 | Part of Orthanc ecosystem |
| **[Med3Web](https://github.com/nicktobey/Med3Web)** | Web | JavaScript, WebGL | Apache-2.0 | Research-focused |
| **[Papaya](https://github.com/rii-mango/Papaya)** | Web | JavaScript | BSD | Lightweight |

## Feature Comparison Matrix

### Legend
- ✅ Fully implemented
- 🔄 Partially implemented
- ❌ Not implemented
- N/A Not applicable

### Core Viewing

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Load local DICOM files | ✅ | ✅ | ✅ | ✅ | ❌ (server only) |
| DICOMweb / PACS integration | ❌ | ✅ | ✅ | ❌ | ✅ |
| DICOMDIR support | ❌ | ✅ | ✅ | ✅ | ✅ |
| Zero-footprint (no install) | ✅ | ✅ | ❌ (Java) | ✅ | ✅ |
| Drag-and-drop upload | ✅ | ✅ | ❌ | ✅ | ❌ |
| Folder upload | ✅ | ❌ | ✅ | ❌ | ❌ |
| Auto study/series organization | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-modality support | ✅ | ✅ | ✅ | ✅ | ✅ |
| Desktop app (native) | ✅ (Tauri) | ❌ | ✅ (Java) | ❌ | ❌ |

### Image Display & Manipulation

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Window/Level adjustment | ✅ | ✅ | ✅ | ✅ | ✅ |
| W/L presets (lung, bone, etc.) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Zoom / Pan | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rotation (90°) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Flip (H/V) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Invert (negative) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fit to screen / Reset | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cine loop / Auto-play | ❌ | ✅ | ✅ | ❌ | ✅ |
| Crosshair / Reference lines | ❌ | ✅ | ✅ | ❌ | ❌ |
| Image filters (sharpen, etc.) | ❌ | ❌ | ✅ | ✅ | ❌ |
| Pseudo-color / LUT mapping | ❌ | ✅ | ✅ | ❌ | ❌ |

### Advanced Viewing

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| MPR (Multiplanar Reconstruction) | ❌ | ✅ | ✅ | ❌ | ✅ |
| 3D Volume Rendering | ❌ | ✅ | ❌ | ❌ | ❌ |
| Split/Comparison view | ❌ | ✅ | ✅ | ❌ | ✅ |
| Synchronized scrolling | ❌ | ✅ | ✅ | ❌ | ✅ |
| Hanging protocols | ❌ | ✅ | ✅ | ❌ | ❌ |
| Full-screen mode | ❌ | ✅ | ✅ | ✅ | ✅ |
| Image fusion / Overlay | ❌ | ✅ | ✅ | ❌ | ❌ |

### Annotations & Measurements

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Point markers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Distance measurement (ruler) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Angle measurement | ❌ | ✅ | ✅ | ✅ | ❌ |
| Ellipse / Rectangle ROI | ❌ | ✅ | ✅ | ✅ | ❌ |
| Freehand drawing | ❌ | ✅ | ✅ | ✅ | ❌ |
| Text annotations | 🔄 (type only) | ✅ | ✅ | ✅ | ❌ |
| ROI statistics (mean, std) | ❌ | ✅ | ✅ | ❌ | ❌ |
| Cobb angle | ❌ | ✅ | ✅ | ❌ | ❌ |
| DICOM SR export/import | ❌ | ✅ | ✅ | ❌ | ✅ |
| 3D annotations (SCOORD3D) | ❌ | ✅ | ❌ | ❌ | ❌ |

### Segmentation

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Manual segmentation (brush) | ❌ | ✅ | ❌ | ❌ | ❌ |
| DICOM-SEG support | ❌ | ✅ | ❌ | ❌ | ❌ |
| RT Structure Set (RTSS) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Segmentation overlays | ❌ | ✅ | ✅ | ❌ | ❌ |
| GrowCut (semi-auto seg) | ❌ | ✅ (WebGPU) | ❌ | ❌ | ❌ |

### Export & Sharing

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| PNG export | ✅ | ✅ | ✅ | ✅ | ❌ |
| JPEG export | ✅ | ✅ | ✅ | ✅ | ❌ |
| PDF report export | ✅ | ❌ | ✅ | ❌ | ❌ |
| Batch PDF from favorites | ✅ | ❌ | ❌ | ❌ | ❌ |
| Resolution scaling (2x, 4x) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Privacy-first filenames | ✅ | ❌ | ❌ | ❌ | ❌ |
| AVI/MP4 video export | ❌ | ❌ | ✅ | ❌ | ❌ |
| DICOM anonymization export | ❌ | ❌ | ✅ | ❌ | ❌ |
| Share via link/URL | ❌ | ✅ | ❌ | ❌ | ✅ |

### AI & Intelligence

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| AI vertebral detection | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI radiology analysis | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-provider AI (Claude/GPT/Gemini) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Drag-to-adjust AI markers | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI consent management | ✅ | ❌ | ❌ | ❌ | ❌ |
| MONAI/TF.js local models | ❌ | ❌ | ❌ | ❌ | ❌ |

### UX & Accessibility

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Dark/Light theme | ✅ | 🔄 | ✅ | ❌ | ❌ |
| Keyboard shortcuts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Keyboard shortcuts help | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configurable sensitivity | ✅ | ❌ | ✅ | ❌ | ❌ |
| Favorites system | ✅ | ❌ | ❌ | ❌ | ❌ |
| Recent studies history | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thumbnail strip | ✅ | ✅ | ✅ | ❌ | ✅ |
| Internationalization (i18n) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Touch/mobile support | ❌ | 🔄 | ❌ | ✅ | 🔄 |
| WCAG accessibility | ❌ | 🔄 | ❌ | ❌ | ❌ |
| Offline / PWA support | ❌ | ✅ | N/A | ❌ | ❌ |

### Privacy & Security

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Client-side only processing | ✅ | ❌ (needs server) | N/A | ✅ | ❌ |
| No telemetry/tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| HIPAA-aware design | ✅ | 🔄 | ❌ | ❌ | ❌ |
| Privacy-first exports | ✅ | ❌ | ❌ | ❌ | ❌ |
| Authentication (OpenID) | ❌ | ✅ | ✅ | ❌ | ❌ |

### Testing & Quality

| Feature | OpenScans | OHIF | Weasis | DWV | Stone Web |
|---------|-----------|------|--------|-----|-----------|
| Unit tests | ✅ (199) | ✅ | ✅ | ✅ | Unknown |
| E2E tests | ✅ (11) | ✅ | ✅ | ❌ | Unknown |
| Comprehensive docs | ✅ | ✅ | ✅ | 🔄 | 🔄 |

---

## Gap Analysis: Prioritized Feature Opportunities

### Tier 1 — High Impact, High Demand (Should Implement)

These features are present in most competitors and would significantly improve OpenScans' competitiveness:

| # | Feature Gap | Present In | Impact | Effort |
|---|------------|------------|--------|--------|
| 1 | **Distance measurement (ruler)** | OHIF, Weasis, DWV | High — fundamental radiology tool | Medium |
| 2 | **Angle measurement** | OHIF, Weasis, DWV | High — essential for orthopedic/spine imaging | Medium |
| 3 | **Cine loop / Auto-play** | OHIF, Weasis, Stone | High — critical for cardiac, fluoroscopy review | Low |
| 4 | **Full-screen mode** | OHIF, Weasis, DWV, Stone | Medium — expected standard UX feature | Low |
| 5 | **Split/Comparison view** | OHIF, Weasis, Stone | High — essential for comparing prior studies | High |
| 6 | **Ellipse/Rectangle ROI** | OHIF, Weasis, DWV | Medium — needed for ROI statistics | Medium |

### Tier 2 — Differentiating, Medium Demand (Should Consider)

| # | Feature Gap | Present In | Impact | Effort |
|---|------------|------------|--------|--------|
| 7 | **Internationalization (i18n)** | OHIF, Weasis, DWV, Stone | Medium — broadens user base globally | Medium |
| 8 | **MPR (Multiplanar Reconstruction)** | OHIF, Weasis, Stone | High — advanced viewing for CT/MRI | Very High |
| 9 | **ROI statistics (mean, std, area)** | OHIF, Weasis | Medium — important for quantitative analysis | Medium |
| 10 | **Synchronized scrolling** | OHIF, Weasis, Stone | Medium — requires split view first | High |
| 11 | **DICOM overlay / Contextual info** | OHIF, Weasis | Medium — patient/study info on viewport | Low |
| 12 | **Freehand drawing** | OHIF, Weasis, DWV | Low-Medium — useful for annotations | Medium |

### Tier 3 — Nice to Have / Long-Term (Evaluate Later)

| # | Feature Gap | Present In | Impact | Effort |
|---|------------|------------|--------|--------|
| 13 | **DICOMweb / PACS integration** | OHIF, Weasis, Stone | High in clinical settings, low for standalone | Very High |
| 14 | **DICOM SR import/export** | OHIF, Weasis, Stone | Medium — standards-based annotation sharing | High |
| 15 | **Pseudo-color / LUT mapping** | OHIF, Weasis | Low — niche use cases | Medium |
| 16 | **Image filters (sharpen, etc.)** | Weasis, DWV | Low — rarely used in clinical workflow | Medium |
| 17 | **Video export (AVI/MP4)** | Weasis | Low — useful for cine sequences | Medium |
| 18 | **3D Volume Rendering** | OHIF | High visual impact, niche usage | Very High |
| 19 | **Segmentation tools** | OHIF | High for research, low for basic viewing | Very High |
| 20 | **PWA / Offline support** | OHIF | Medium — enables offline use | Medium |
| 21 | **DICOM anonymization** | Weasis | Medium — useful for research sharing | Medium |

---

## OpenScans Unique Strengths (Competitive Advantages)

These features are **unique to OpenScans** or significantly better than competitors:

1. **AI-powered vertebral detection** — No competitor offers built-in AI anatomical detection
2. **AI radiology analysis** — Multi-provider AI analysis (Claude, GPT-4, Gemini) is unmatched
3. **Batch PDF export from favorites** — Unique workflow for creating imaging reports
4. **Privacy-first export system** — Automatic PII exclusion from filenames and exports
5. **Resolution scaling on export** — 2x/4x upscaling not available elsewhere
6. **Favorites system** — No competitor offers image bookmarking/starring
7. **HIPAA-aware design** — Intentional privacy-first architecture throughout
8. **Client-side only** — Full functionality without any server requirement (unlike OHIF)
9. **Native desktop via Tauri** — Lighter than Java-based Weasis desktop

---

## Recommended Implementation Roadmap

### Phase 5: Measurement & Viewing Essentials
1. Distance measurement tool (ruler with mm/cm display)
2. Angle measurement tool
3. Cine loop with speed control
4. Full-screen mode
5. DICOM overlay (viewport corner info)

### Phase 6: Comparison & Advanced Tools
1. Split/comparison view (2-up layout)
2. Synchronized scrolling between viewports
3. Ellipse/Rectangle ROI with statistics
4. Freehand drawing tool
5. Cobb angle measurement

### Phase 7: Internationalization & Standards
1. i18n framework (start with EN, ES, FR, DE, ZH, JA)
2. DICOM SR annotation export
3. PWA / offline support
4. DICOM anonymization for research sharing

### Phase 8: Advanced Imaging (Long-term)
1. MPR (Multiplanar Reconstruction)
2. Pseudo-color / LUT mapping
3. DICOMweb integration (optional)
4. 3D Volume Rendering (research)

---

## Sources

- [OHIF Viewer GitHub](https://github.com/OHIF/Viewers)
- [OHIF v3.11 Release Notes](https://ohif.org/release-notes/3p11/)
- [Weasis Documentation](https://weasis.org/en/)
- [DWV GitHub](https://github.com/ivmartel/dwv)
- [Stone Web Viewer](https://www.orthanc-server.com/static.php?page=stone-web-viewer)
- [Web-Based DICOM Viewers: A Survey (Springer)](https://link.springer.com/article/10.1007/s10278-024-01216-5)
- [Open Source DICOM Viewers (Medicai)](https://blog.medicai.io/en/open-source-dicom-viewer/)
- [15 Best Open-source Web-based DICOM Viewers (Medevel)](https://medevel.com/14-best-browser-web-based-dicom-viewers-projects/)
- [How to Choose a Web-Based DICOM Viewer (Radical Imaging)](https://radicalimaging.com/event/how-to-choose-a-web-based-dicom-viewer/)
