# Drag-and-Drop File Upload

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

Users can drag DICOM files or folders directly from their file manager onto the OpenScans viewport to load them. The drop zone provides visual feedback during the drag operation to guide users.

## Benefits

- **Intuitive interaction** — Drag-and-drop is a universally understood gesture that requires no instructions
- **Fast workflow** — Eliminates the need to navigate through file picker dialogs
- **Batch loading** — Users can drag entire folders or multiple files at once
- **Low friction onboarding** — New users can start viewing images within seconds of opening the application

## Current Implementation

- Full-viewport drop zone with visual overlay feedback
- Supports both individual files and folder drops
- Automatic DICOM validation on dropped files
- Non-DICOM files are silently filtered out
- Error feedback for invalid or corrupted files

## Key Files

- `src/components/viewer/FileDropzone.tsx`
