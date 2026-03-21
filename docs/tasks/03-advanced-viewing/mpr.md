# Task: Implement Multiplanar Reconstruction (MPR)

**Feature**: [MPR (Multiplanar Reconstruction)](../../features/03-advanced-viewing/mpr.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Very High (2-3 weeks)
**Dependencies**: Split/Comparison View (for multi-plane display)

## Overview

Generate and display sagittal and coronal reconstructions from axial CT/MRI volume data using Cornerstone3D VolumeViewports.

## Implementation Steps

### Step 1: Evaluate Cornerstone3D Volume API

**Research task — no file changes**

1. The current codebase uses Cornerstone 2.x (`cornerstone-core` v2.6.1)
2. MPR requires Cornerstone3D (`@cornerstonejs/core`, `@cornerstonejs/tools`, `@cornerstonejs/streaming-image-volume-loader`)
3. Determine if migration to Cornerstone3D is required or if the existing stack viewport can coexist with volume viewports
4. Document breaking changes and migration path

### Step 2: Add Cornerstone3D Volume Dependencies

**File**: `package.json`

1. Add Cornerstone3D packages:
   ```
   @cornerstonejs/core
   @cornerstonejs/tools
   @cornerstonejs/streaming-image-volume-loader
   ```
2. Verify compatibility with existing Cornerstone 2.x setup
3. If incompatible, plan a migration from Cornerstone 2.x to 3D

### Step 3: Create Volume Loading Pipeline

**File**: `src/lib/cornerstone/volumeLoader.ts`

1. Create a function to load a DICOM series into a 3D volume:
   ```typescript
   async function loadSeriesAsVolume(
     seriesInstanceUID: string,
     imageIds: string[]
   ): Promise<Volume>
   ```
2. Use `StreamingImageVolume` to load images progressively
3. Sort image IDs by Image Position Patient for correct slice ordering
4. Handle memory management — volumes can be very large (500MB+)

### Step 4: Create MPR Viewport Component

**File**: `src/components/viewer/MprViewport.tsx`

1. Create a component that renders three orthogonal viewports (axial, sagittal, coronal)
2. Each uses Cornerstone3D `VolumeViewport` with the appropriate orientation
3. Link the three viewports to the same volume
4. Display crosshairs showing the intersection point

### Step 5: Add MPR Mode to Layout

**File**: `src/stores/layoutStore.ts`

1. Add an `mpr` layout mode alongside grid layouts
2. When MPR mode is activated, display three viewports in a 2x2 grid (axial, sagittal, coronal + optional 3D)
3. Add MPR toggle button to the toolbar

### Step 6: Implement Interactive Reslicing

**File**: `src/components/viewer/MprViewport.tsx`

1. Allow users to click on any viewport to set the reslice position
2. The other two viewports update to show slices at the clicked location
3. Display crosshair lines showing the current position in each plane

### Step 7: Handle Memory Management

**File**: `src/lib/cornerstone/volumeLoader.ts`

1. Monitor volume memory usage
2. Unload volumes when switching to a different series
3. Set maximum volume cache size (configurable)
4. Show warning for very large series

### Step 8: Add Tests

1. Test volume loading from sorted image IDs
2. Test orientation assignment (axial, sagittal, coronal)
3. Test memory cleanup on series change

## Acceptance Criteria

- [ ] Series can be viewed in axial, sagittal, and coronal planes simultaneously
- [ ] Clicking in one viewport updates the position in others
- [ ] Crosshair lines show the current position in each plane
- [ ] Volume loads progressively with a progress indicator
- [ ] Memory is managed (volumes unloaded when not needed)
- [ ] MPR mode can be toggled on/off
- [ ] Regular stack viewing continues to work unchanged
