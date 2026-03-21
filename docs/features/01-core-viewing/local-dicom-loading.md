# Local DICOM File Loading

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

Load DICOM files directly from the user's local filesystem without requiring a server or network connection. Supports individual file selection via a file picker dialog and batch folder selection for loading entire studies at once.

## Benefits

- **Zero setup required** — Users can start viewing images immediately without configuring a PACS server or uploading files to a cloud service
- **Privacy by design** — Files never leave the user's machine, eliminating data transmission risks
- **Works offline** — No internet connection needed to view local imaging data
- **Familiar workflow** — Mirrors how users interact with files on their computer (drag-and-drop, file picker, folder selection)

## Current Implementation

- Drag-and-drop file upload onto the viewport area
- File picker dialog for selecting individual DICOM files
- Folder selection for loading entire study directories (Chrome/Edge via File System Access API, Safari via `webkitdirectory`)
- Automatic DICOM format validation and parsing via `dcmjs`
- Error handling for non-DICOM files mixed into selections

## Key Files

- `src/components/viewer/FileDropzone.tsx`
- `src/lib/dicom/parser.ts`
- `src/hooks/useDicomLoader.ts`
