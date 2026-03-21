# JPEG Export

**Status**: ✅ Implemented
**Category**: Export & Sharing
**Priority**: Essential

## Description

Export the current viewport image as a JPEG file with adjustable quality settings. JPEG produces smaller files than PNG at the cost of lossy compression, making it suitable for sharing and embedding where file size matters.

## Benefits

- **Small file sizes** — JPEG compression produces significantly smaller files than PNG, ideal for email and messaging
- **Quality control** — Adjustable quality slider (50-100%) lets users balance file size vs. image quality
- **Wide compatibility** — JPEG is the most universally supported image format
- **Quick sharing** — Smaller files are faster to upload, attach, and share

## Current Implementation

- Export current viewport as JPEG
- Quality slider (50-100%)
- Resolution scaling options (1x, 2x, 4x)
- Privacy-first filename generation

## Key Files

- `src/lib/export/imageExport.ts`
- `src/components/export/ExportDialog.tsx`
