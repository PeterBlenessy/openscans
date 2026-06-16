# Keyboard Shortcuts

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: High

## Description

Comprehensive keyboard shortcuts for all major viewer functions including image navigation, viewport tools, AI operations, and UI toggling. Enables efficient hands-free workflow for power users and clinicians.

## Benefits

- **Speed** — Keyboard shortcuts are significantly faster than mouse-based toolbar interactions for experienced users
- **Radiologist workflow** — Clinicians reviewing many studies need rapid tool switching without moving from the keyboard
- **Accessibility** — Keyboard navigation is essential for users who cannot use a mouse
- **Discoverability** — Help dialog (? or H) displays all available shortcuts

## Current Implementation

- Arrow keys (Up/Down) — Navigate between instances
- PageUp/PageDown — Navigate instances
- Home/End — Jump to first/last instance
- W — Window/Level tool
- Z — Zoom tool
- P — Pan tool
- R — Reset viewport
- I — Invert colors
- F — Flip
- M — AI detection (Magic Wand)
- N — AI analysis
- ? or H — Show keyboard shortcuts help

## Key Files

- `src/hooks/useViewportKeyboard.ts`
- `src/components/viewer/KeyboardShortcutsHelp.tsx`
