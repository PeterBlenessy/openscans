# PNG Export

**Status**: ✅ Implemented
**Category**: Export & Sharing
**Priority**: Essential

## Description

Export the current viewport image as a PNG file with transparency support. The exported image captures the current window/level settings, zoom, and any visible annotations, producing a publication-ready image.

## Benefits

- **Lossless quality** — PNG format preserves full image quality without compression artifacts
- **Transparency support** — PNG supports alpha channel for compositing over other backgrounds
- **Universal compatibility** — PNG files can be opened by any image viewer, inserted into documents, or shared via email
- **Publication ready** — Suitable quality for inclusion in research papers and presentations

## Current Implementation

- Export current viewport as PNG
- Resolution scaling options (1x, 2x, 4x) for high-DPI output
- Privacy-first filename generation (excludes patient data by default)
- Captures current W/L, zoom, and viewport settings

## Key Files

- `src/lib/export/imageExport.ts`
- `src/components/export/ExportDialog.tsx`
