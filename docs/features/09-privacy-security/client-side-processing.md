# Client-Side Only Processing

**Status**: ✅ Implemented
**Category**: Privacy & Security
**Priority**: Essential — Core Principle

## Description

All DICOM file parsing, image rendering, and data processing happens entirely within the user's web browser. No patient data is transmitted to any server for core viewing functionality. The only exception is optional AI features, which require explicit user consent before transmitting image data.

## Benefits

- **Maximum privacy** — Patient data never leaves the user's device for viewing, navigation, or export operations
- **HIPAA alignment** — Eliminates the need for Business Associate Agreements (BAAs) with server providers for core functionality
- **Zero infrastructure** — No server to maintain, secure, patch, or audit for HIPAA compliance
- **No data retention risk** — Since data isn't stored on servers, there's no risk of server-side data breaches
- **Works in air-gapped environments** — Can be used in networks completely disconnected from the internet

## Current Implementation

- DICOM parsing via dcmjs (client-side JavaScript)
- Image rendering via Cornerstone3D (client-side WebGL)
- State management in browser memory (Zustand)
- Persistence via localStorage (browser-local only)
- Export operations (PNG, JPEG, PDF) performed client-side

## Key Files

- `src/lib/dicom/parser.ts`
- `src/lib/cornerstone/initCornerstone.ts`
