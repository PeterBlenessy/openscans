# Resolution Scaling on Export

**Status**: ✅ Implemented
**Category**: Export & Sharing
**Priority**: Medium

## Description

Export images at higher resolutions than the viewport display (2x or 4x scaling). This produces high-DPI output suitable for printing, publication, and presentation on high-resolution displays.

## Benefits

- **Print quality** — 2x or 4x scaling produces images with sufficient resolution for high-quality printing
- **Publication ready** — Medical journals typically require 300 DPI images; resolution scaling achieves this from standard viewport sizes
- **Retina display support** — Exported images look sharp on high-DPI screens
- **Unique feature** — No competitor offers configurable resolution scaling on export

## Current Implementation

- 1x (viewport resolution), 2x, and 4x scaling options
- Applied to both PNG and JPEG exports
- File size estimation updates with scaling selection

## Key Files

- `src/lib/export/imageExport.ts`
- `src/components/export/ExportDialog.tsx`
