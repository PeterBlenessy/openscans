# Desktop Application (Tauri)

**Status**: ✅ Implemented
**Category**: Core Viewing
**Priority**: Medium

## Description

OpenScans is available as a native desktop application for macOS, Windows, and Linux, built with Tauri. This provides a lightweight, native-feeling application with direct filesystem access and no browser dependency.

## Benefits

- **Native experience** — Runs as a proper desktop application with native window controls, file dialogs, and system integration
- **Direct filesystem access** — Can open files and folders through native OS dialogs without browser API limitations
- **Lightweight** — Tauri produces small application bundles (typically 5-10 MB) compared to Electron alternatives
- **Offline-first** — No web server or internet connection needed
- **Cross-platform** — Single codebase produces builds for macOS (Intel + Apple Silicon), Windows 10+, and Linux (Ubuntu 22.04+)

## Current Implementation

- Tauri v2.9.1 framework
- Platform-aware file dialogs
- Native filesystem access
- macOS, Windows, and Linux builds

## Key Files

- `src-tauri/` — Tauri backend configuration
- `src-tauri/tauri.conf.json` — Build and window configuration
