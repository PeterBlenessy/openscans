# PWA / Offline Support

**Status**: ❌ Not Implemented
**Category**: UX & Accessibility
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF

## Description

Convert the web application into a Progressive Web App (PWA) that can be installed on the user's device and used offline. A service worker caches the application shell and assets, enabling the viewer to load and function without an internet connection.

## Benefits

- **Offline capability** — Use the viewer in environments without reliable internet (rural clinics, field hospitals, aircraft)
- **Install to home screen** — Users can "install" the web app for a native-like experience without app store distribution
- **Faster loading** — Cached assets load instantly on subsequent visits
- **Update transparency** — Service worker updates the cached app in the background

## Why It Matters for OpenScans

Since OpenScans already processes everything client-side, it is well-suited for PWA conversion. The main benefit is the installable experience and guaranteed offline functionality. The Tauri desktop app already provides this for desktop users, so PWA primarily benefits users who prefer the web version.

## Implementation Considerations

- Service worker for asset caching (Vite PWA plugin)
- Web app manifest for install-to-home-screen
- Cache-first strategy for static assets
- Offline fallback page
- Background sync for AI features (queue API calls for when connectivity returns)
- Careful cache invalidation on app updates
