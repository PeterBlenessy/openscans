# Task: Implement PWA / Offline Support

**Feature**: [PWA / Offline Support](../../features/08-ux-accessibility/pwa-offline-support.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Low-Medium (2-3 days)
**Dependencies**: None

## Overview

Convert the web application into an installable Progressive Web App with offline caching.

## Implementation Steps

### Step 1: Add PWA Plugin

**File**: `package.json` and `vite.config.ts`

1. Install: `pnpm add -D vite-plugin-pwa`
2. Configure in Vite:
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa'

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
           maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for WASM
         },
       }),
     ],
   })
   ```

### Step 2: Create Web App Manifest

**File**: `public/manifest.json`

1. Define PWA manifest:
   ```json
   {
     "name": "OpenScans - DICOM Viewer",
     "short_name": "OpenScans",
     "description": "Privacy-first medical imaging viewer",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#1a1a2e",
     "background_color": "#0a0a1a",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

### Step 3: Create PWA Icons

**File**: `public/icon-192.png`, `public/icon-512.png`

1. Generate PWA icons at required sizes (192x192, 512x512)
2. Create maskable icon variants for Android
3. Generate Apple touch icon for iOS

### Step 4: Configure Service Worker Caching

**File**: `vite.config.ts` (PWA plugin config)

1. Cache-first strategy for static assets (JS, CSS, images, WASM)
2. Network-first for API calls (AI API endpoints)
3. Precache all critical application assets
4. Runtime caching for dynamically loaded assets

### Step 5: Add Install Prompt

**File**: `src/components/PwaInstallPrompt.tsx`

1. Listen for `beforeinstallprompt` event
2. Show a dismissible banner: "Install OpenScans for offline access"
3. Persist dismiss preference in localStorage
4. Only show on supported browsers

### Step 6: Handle Offline AI Gracefully

**File**: `src/hooks/useAiOperations.ts`

1. Detect offline state (`navigator.onLine`)
2. When offline, disable cloud AI buttons with message: "AI requires internet"
3. Mock detector still works offline
4. Queue AI requests for later if desired (optional)

### Step 7: Add Tests

1. Test manifest is valid
2. Test service worker registration
3. Test offline fallback behavior
4. Test install prompt display logic

## Acceptance Criteria

- [ ] Application installable as PWA from browser
- [ ] All static assets cached for offline use
- [ ] Application loads and functions offline (local file viewing)
- [ ] Install prompt shown to users
- [ ] AI features gracefully disabled when offline
- [ ] Service worker auto-updates on new deployments
