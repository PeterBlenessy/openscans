# Folder Upload

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

Select and load entire folders of DICOM files at once, automatically discovering and organizing all valid DICOM images within the directory tree. This is essential for loading complete studies that are stored as collections of files in nested folders.

## Benefits

- **Load complete studies** — Medical imaging studies typically consist of hundreds of files organized in folders; this feature loads them all in one action
- **Automatic organization** — Files are parsed and organized into the correct study/series/instance hierarchy regardless of folder structure
- **Time savings** — Loading a folder with 500 images takes one click instead of selecting files individually
- **Handles nested structures** — Recursively processes subdirectories common in DICOM exports

## Current Implementation

- File System Access API for Chrome/Edge (modern folder picker)
- `webkitdirectory` fallback for Safari
- Recursive directory traversal
- Automatic DICOM validation and non-image file filtering

## Key Files

- `src/components/viewer/FileDropzone.tsx`
- `src/lib/dicom/parser.ts`
