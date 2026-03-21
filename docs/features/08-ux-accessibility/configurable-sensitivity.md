# Configurable Mouse Sensitivity

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: Medium

## Description

Adjust the sensitivity of mouse-based interactions for window/level adjustment and zoom. Different users have different preferences for how much mouse movement is needed to achieve a given change, depending on their mouse hardware, display size, and personal preference.

## Benefits

- **Personalization** — Each user can tune the interaction to match their working style and hardware
- **Precision control** — Lower sensitivity enables finer adjustments for detailed window/level optimization
- **Large display support** — Users with large displays may want higher sensitivity to reduce arm movement
- **Persistent preferences** — Settings saved across sessions

## Current Implementation

- Separate sensitivity sliders for W/L and zoom
- Settings stored in localStorage
- Applied to mouse interaction hooks in real-time

## Key Files

- `src/stores/settingsStore.ts`
- `src/components/settings/SettingsPanel.tsx`
