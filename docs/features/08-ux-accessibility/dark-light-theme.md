# Dark / Light Theme

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: High

## Description

Toggle between a dark theme (default) and light theme for the entire application interface. The dark theme uses professional dark grays and blacks optimized for radiologist viewing environments, while the light theme provides an alternative for well-lit conditions.

## Benefits

- **Eye comfort** — Dark theme reduces eye strain during extended viewing sessions in dimmed reading rooms
- **Clinical standard** — Radiology reading rooms use dark environments; a dark UI matches the ambient conditions
- **Flexibility** — Light theme option for brightly lit environments, presentations, or user preference
- **Persistent** — Theme preference saved in localStorage and applied across sessions

## Current Implementation

- Dark theme (default) — Professional dark color scheme
- Light theme — Alternative for various viewing conditions
- Toggle in settings panel
- Real-time application to all components
- localStorage persistence

## Key Files

- `src/stores/settingsStore.ts`
- `src/components/settings/SettingsPanel.tsx`
