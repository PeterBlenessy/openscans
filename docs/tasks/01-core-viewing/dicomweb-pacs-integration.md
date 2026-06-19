# Task: Implement DICOMweb / PACS Integration

**Feature**: [DICOMweb / PACS Integration](../../features/01-core-viewing/dicomweb-pacs-integration.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Very High (3-4 weeks)
**Dependencies**: None for basic implementation; Authentication feature for secured PACS

> ⚠️ **Server-requiring — conflicts with the privacy-first principle.** This feature requires a remote PACS/DICOMweb server, which is at odds with OpenScans' "client-side only / no server / no PHI at rest" posture (see `CLAUDE.md` → "Privacy First"). Adopting it is a deliberate decision scoped to institutional/PACS deployments, not a default. The zero-footprint browser and local-only desktop modes must keep working with no backend.

## Overview

Add the ability to connect to PACS servers via DICOMweb (WADO-RS, QIDO-RS) to query, retrieve, and display studies from centralized imaging archives.

## Implementation Steps

### Step 1: Add DICOMweb Client Library

**File**: `package.json`

1. Install `dicomweb-client` package: `pnpm add dicomweb-client`
2. Add TypeScript types if not bundled

### Step 2: Create DICOMweb Configuration Store

**File**: `src/stores/dicomwebStore.ts`

1. Create a Zustand store for DICOMweb connection settings:
   - `serverUrl: string` — DICOMweb base URL
   - `authType: 'none' | 'basic' | 'bearer' | 'oidc'`
   - `credentials: { username?: string, token?: string }`
   - `isConnected: boolean`
   - `connectionError: string | null`
2. Add actions: `connect()`, `disconnect()`, `testConnection()`
3. Persist server URL to localStorage (never persist credentials)

### Step 3: Create DICOMweb Service Layer

**File**: `src/lib/dicomweb/dicomwebService.ts`

1. Create a service class wrapping `dicomweb-client`:
   - `searchStudies(params): Promise<Study[]>` — QIDO-RS study query
   - `searchSeries(studyUID): Promise<Series[]>` — QIDO-RS series query
   - `retrieveInstance(studyUID, seriesUID, instanceUID): Promise<ArrayBuffer>` — WADO-RS retrieval
   - `retrieveSeriesMetadata(studyUID, seriesUID): Promise<Metadata[]>` — metadata retrieval
2. Handle error responses (401, 403, 404, timeout)
3. Support pagination for large result sets

### Step 4: Create Study Search UI

**File**: `src/components/dicomweb/StudyBrowser.tsx`

1. Create a modal/panel for DICOMweb study browsing
2. Search form with filters: patient name, patient ID, study date range, modality, accession number
3. Results table showing: patient name, study date, modality, study description, number of series
4. Click a study to load it from the PACS
5. Pagination controls for large result sets

### Step 5: Create Server Configuration UI

**File**: `src/components/dicomweb/ServerConfig.tsx`

1. Settings panel section for DICOMweb server configuration
2. Input fields for server URL and authentication type
3. "Test Connection" button with status feedback
4. Save/load server configurations

### Step 6: Integrate with Existing Study Loading

**File**: `src/hooks/useLoadStudy.ts`

1. Add a `loadFromDicomweb(studyUID)` function
2. Retrieve series metadata first, then load instances on demand
3. Progressive loading — load thumbnails first, full images when navigated to
4. Integrate with existing `studyStore` for consistent state management

### Step 7: Add Image Loader for WADO-RS

**File**: `src/lib/cornerstone/wadoRsLoader.ts`

1. Register a custom Cornerstone image loader for `wadors:` scheme
2. Fetch image data via DICOMweb WADO-RS retrieve
3. Handle multipart DICOM responses
4. Cache retrieved images to avoid re-fetching

### Step 8: Add Tests

1. Unit tests for DICOMweb service (mock HTTP responses)
2. Unit tests for study search parameter building
3. Integration test for end-to-end study loading (with mock server)

## Acceptance Criteria

- [ ] User can configure a DICOMweb server URL in settings
- [ ] "Test Connection" verifies server is reachable
- [ ] Study search returns results matching query parameters
- [ ] Clicking a study loads it into the viewer
- [ ] Images display correctly via WADO-RS retrieval
- [ ] Error handling for unreachable servers, auth failures, missing studies
- [ ] Local file loading continues to work unchanged
- [ ] No credentials stored in localStorage
