# PDF Report Export

**Status**: ✅ Implemented
**Category**: Export & Sharing
**Priority**: High

## Description

Export the current image to a PDF document with an optional metadata cover page including patient information, study details, and series descriptions. The PDF format is ideal for creating formal imaging reports and sharing with referring physicians.

## Benefits

- **Professional reports** — Generate formatted PDF reports with metadata and images suitable for clinical communication
- **Cover page metadata** — Optional inclusion of patient name, ID, study date, modality, and series description
- **Privacy controls** — Patient data can be included or excluded from the PDF based on user preference
- **Universal format** — PDFs can be viewed, printed, and archived on any platform without special software
- **Self-contained** — All images and metadata in a single file

## Current Implementation

- Single image to PDF with metadata cover page
- Optional metadata inclusion (controlled per export)
- Privacy-first approach (patient data excluded by default)
- Generated via `jsPDF` library

## Key Files

- `src/lib/export/pdfExport.ts`
- `src/components/export/ExportDialog.tsx`
