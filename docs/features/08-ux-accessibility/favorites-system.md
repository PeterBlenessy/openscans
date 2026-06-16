# Favorites / Bookmarking System

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: Medium — Unique Feature

## Description

Mark specific images as "favorites" (starred) for quick access and batch operations. Favorited images are highlighted in the thumbnail strip and accessible through a dedicated favorites panel. This enables curating a subset of key images from a larger study.

## Benefits

- **Key image selection** — In a study with 500+ images, mark the 5-10 most important findings for quick review
- **Batch export** — Export only the favorited images to a PDF report, creating focused clinical summaries
- **Quick navigation** — Jump directly to any favorited image from the favorites panel
- **Presentation prep** — Curate images for case presentations and teaching sessions
- **Unique feature** — No competitor offers an image bookmarking/starring system

## Current Implementation

- Star button in viewport toolbar
- Star badges on thumbnails in the thumbnail strip
- Dedicated favorites panel with list and thumbnail views
- Jump-to-favorite navigation
- Batch PDF export from favorites
- localStorage persistence
- Clear all favorites option

## Key Files

- `src/stores/favoritesStore.ts`
- `src/components/favorites/FavoritesPanel.tsx`
