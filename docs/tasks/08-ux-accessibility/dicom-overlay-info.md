# Task: Implement DICOM Overlay / Contextual Information Display

**Feature**: [DICOM Overlay Info](../../features/08-ux-accessibility/dicom-overlay-info.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Low-Medium (2-3 days)
**Dependencies**: None

## Overview

Display key DICOM metadata on the viewport corners as a semi-transparent overlay. Shows patient info, study details, and technical parameters without opening the sidebar.

## Implementation Steps

### Step 1: Create Viewport Overlay Component

**File**: `src/components/viewer/ViewportInfoOverlay.tsx`

1. Create a component with four corner positions:
   ```typescript
   interface OverlayCorner {
     position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
     lines: string[]
   }
   ```
2. Default layout:
   - **Top-left**: Patient name, Patient ID, Patient age/sex
   - **Top-right**: Institution, Study date, Study description
   - **Bottom-left**: Series description, Instance number (N of M)
   - **Bottom-right**: W/L values, Zoom %, Image dimensions, Pixel spacing
3. Render as absolutely-positioned div overlays with semi-transparent background
4. Monospace font for consistent alignment

### Step 2: Extract Overlay Data from Current Instance

**File**: `src/components/viewer/ViewportInfoOverlay.tsx`

1. Read metadata from the current instance via `useStudyStore`
2. Read viewport settings from `useViewportStore` (W/L, zoom)
3. Format values for display:
   ```typescript
   const overlayData = {
     topLeft: [
       metadata.patientName || 'Anonymous',
       metadata.patientId || '',
       `${metadata.patientAge || ''} ${metadata.patientSex || ''}`.trim(),
     ].filter(Boolean),
     topRight: [
       metadata.institutionName || '',
       metadata.studyDate ? formatDate(metadata.studyDate) : '',
       metadata.studyDescription || '',
     ].filter(Boolean),
     // ...
   }
   ```

### Step 3: Respect Privacy Settings

**File**: `src/components/viewer/ViewportInfoOverlay.tsx`

1. When patient privacy is enabled in settings, mask PII fields:
   - Patient name → "***"
   - Patient ID → "***"
   - Patient birth date → hidden
2. Non-PII fields (modality, W/L, zoom) always visible
3. Read privacy setting from `useSettingsStore`

### Step 4: Add Toggle Control

**File**: `src/stores/viewportStore.ts`

1. Add `showOverlayInfo: boolean` to viewport state (default: true)
2. Add `toggleOverlayInfo()` action
3. Add toggle to ViewportToolbar (small text icon)
4. Add keyboard shortcut (e.g., `O` for overlay)

### Step 5: Add Tests

1. Test overlay data extraction from metadata
2. Test privacy masking when enabled
3. Test with missing metadata fields (no crash, graceful empty strings)

## Acceptance Criteria

- [ ] Metadata displayed in four viewport corners
- [ ] Patient name, study date, series info, and technical parameters shown
- [ ] Respects privacy settings (masks PII when enabled)
- [ ] Toggle to show/hide overlay
- [ ] Handles missing metadata gracefully
- [ ] Semi-transparent background for readability
- [ ] Updates when navigating between instances
