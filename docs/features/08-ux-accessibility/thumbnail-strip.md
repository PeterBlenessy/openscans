# Thumbnail Strip

**Status**: ✅ Implemented
**Category**: UX & Accessibility
**Priority**: High

## Description

A visual strip of thumbnail images showing all instances in the current series. Users can click any thumbnail to jump directly to that image. The current image and favorited images are visually indicated.

## Benefits

- **Visual navigation** — See all images in a series at a glance and click to navigate, much faster than sequential scrolling
- **Context awareness** — Understand the overall content of a series without viewing each image individually
- **Current position** — Visual indicator shows which image is currently displayed
- **Favorites visibility** — Star badges on thumbnails show which images have been bookmarked

## Current Implementation

- Visual thumbnails of all series instances
- Click-to-navigate interaction
- Current instance highlight
- Favorite star badges
- Efficient rendering for large series

## Key Files

- `src/components/viewer/ThumbnailStrip.tsx`
