# Recent Studies History

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: Medium

## Description

Track recently loaded studies and provide quick-access to reload them. The recent studies list stores metadata about the last 10 studies viewed, allowing users to quickly switch between frequently accessed datasets.

## Benefits

- **Quick access** — Reload a recently viewed study without navigating through file dialogs
- **Workflow continuity** — Return to a study after accidentally closing or loading a different one
- **Study metadata** — See patient name, study date, and modality for each recent entry at a glance

## Current Implementation

- Track last 10 loaded studies
- Study metadata caching
- Quick-switch from the left drawer
- localStorage persistence

## Key Files

- `src/stores/recentStudiesStore.ts`
- `src/components/layout/LeftDrawer.tsx`
