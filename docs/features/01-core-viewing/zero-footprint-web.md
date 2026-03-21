# Zero-Footprint Web Application

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Essential

## Description

OpenScans runs entirely in the web browser with no plugins, installations, or server-side components required. Users simply navigate to the application URL and begin viewing DICOM images immediately.

## Benefits

- **No installation barrier** — Users can start immediately without downloading or installing software
- **Cross-platform** — Works on any device with a modern browser (Chrome, Firefox, Safari, Edge)
- **Always up-to-date** — Users automatically get the latest version without manual updates
- **IT-friendly** — No client-side software to deploy, manage, or patch across an organization
- **Security** — No elevated permissions or system access required; everything runs in the browser sandbox

## Current Implementation

- React 18 + TypeScript single-page application
- Vite build system for fast development and optimized production builds
- Cornerstone3D for GPU-accelerated medical image rendering
- All DICOM parsing and image processing happens client-side in the browser
- Compatible with Chrome, Firefox, Safari, and Edge

## Key Files

- `src/App.tsx`
- `index.html`
- `vite.config.ts`
