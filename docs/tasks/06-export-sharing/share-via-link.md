# Task: Implement Share via Link/URL

**Feature**: [Share via Link/URL](../../features/06-export-sharing/share-via-link.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: High (5-7 days)
**Dependencies**: DICOMweb/PACS Integration (for server-stored studies)

> ⚠️ **Server-requiring — conflicts with the privacy-first principle.** Shareable links require a persistent storage backend for the imaging data, which is at odds with OpenScans' "client-side only / no server / no PHI at rest" posture (see `CLAUDE.md` → "Privacy First"). Adopting it is a deliberate decision scoped to a backed deployment, not a default. The zero-footprint browser and local-only desktop modes must keep working with no backend.

## Overview

Generate shareable URLs that open a specific study, series, or image in the viewer. Requires a persistent storage backend for the imaging data.

## Implementation Steps

### Step 1: Define URL Schema

**File**: `src/lib/sharing/urlSchema.ts`

1. Define URL format:
   ```
   https://app.openscans.io/view?
     study=1.2.840...&
     series=1.2.840...&
     instance=1.2.840...&
     wl=400,40&
     zoom=1.5
   ```
2. Parse URL parameters on application load
3. Encode study/series/instance UIDs and viewport state

### Step 2: Create URL Generator

**File**: `src/lib/sharing/linkGenerator.ts`

1. Generate shareable URL from current viewer state:
   ```typescript
   function generateShareLink(
     studyUID: string,
     seriesUID?: string,
     instanceUID?: string,
     viewportState?: Partial<ViewportSettings>
   ): string
   ```
2. Include viewport state (W/L, zoom) as optional parameters
3. Copy-to-clipboard functionality

### Step 3: Create URL Parser and Auto-Load

**File**: `src/hooks/useUrlParams.ts`

1. On application load, check for URL parameters
2. If study UID is present, attempt to load from DICOMweb server
3. Navigate to the specified series/instance
4. Apply viewport state from URL parameters

### Step 4: Add Share Button to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add "Share" button (visible only when connected to DICOMweb)
2. Click generates URL and copies to clipboard
3. Toast notification: "Link copied to clipboard"
4. Optional: QR code generation for mobile sharing

### Step 5: Alternative: Session File Export

**File**: `src/lib/sharing/sessionExport.ts`

1. For offline/local use, export a "session file" (.openscans.json):
   ```json
   {
     "version": 1,
     "studyInstanceUID": "1.2.840...",
     "viewport": { "windowWidth": 400, "windowCenter": 40 },
     "annotations": [...]
   }
   ```
2. Import session files to restore viewport state and annotations
3. Works without server — user shares the session file alongside DICOM data

### Step 6: Add Tests

1. Test URL generation and parsing (round-trip)
2. Test viewport state encoding/decoding
3. Test session file export/import

## Acceptance Criteria

- [ ] Generate shareable URL from current viewer state
- [ ] URL opens the correct study/series/instance
- [ ] Viewport state (W/L, zoom) restored from URL
- [ ] Copy-to-clipboard for easy sharing
- [ ] Session file alternative for offline use
- [ ] Graceful error when study is not accessible
