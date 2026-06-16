# Task: Implement Synchronized Scrolling

**Feature**: [Synchronized Scrolling](../../features/03-advanced-viewing/synchronized-scrolling.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Split/Comparison View (required first)

## Overview

Link the scroll position of two viewports so that scrolling in one automatically advances the other to the corresponding anatomical position.

## Implementation Steps

### Step 1: Add Sync State to Layout Store

**File**: `src/stores/layoutStore.ts`

1. Add synchronization state:
   ```typescript
   syncGroups: SyncGroup[]
   addSyncGroup: (viewportIndices: number[]) => void
   removeSyncGroup: (groupId: string) => void
   toggleSync: (index1: number, index2: number) => void
   ```
2. A sync group links two or more viewport indices together

### Step 2: Create Scroll Synchronization Logic

**File**: `src/hooks/useSyncScroll.ts`

1. Create a hook that handles synchronized scrolling between linked viewports:
   ```typescript
   export function useSyncScroll(viewportIndex: number) {
     // When this viewport scrolls, find its sync group
     // Calculate relative scroll position (0.0 to 1.0)
     // Apply proportional scroll to linked viewports
   }
   ```
2. Synchronization strategies:
   - **By position** (preferred): Use DICOM Image Position Patient (0020,0032) and Frame of Reference UID (0020,0052) to match anatomical locations
   - **By ratio** (fallback): If spatial metadata is missing, sync by relative position (instance 50/100 → instance 25/50)
3. Prevent infinite loops (viewport A scrolls → syncs B → B scrolls → don't re-sync A)

### Step 3: Handle Mismatched Series

**File**: `src/hooks/useSyncScroll.ts`

1. Series may have different slice counts, thicknesses, or coverage areas
2. Use Frame of Reference UID to determine if series can be spatially synchronized
3. Fall back to ratio-based sync when Frame of Reference UIDs differ
4. Handle edge cases: one series has more coverage than the other (clamp, don't wrap)

### Step 4: Add Sync Toggle UI

**File**: `src/components/viewer/SyncControls.tsx`

1. Add a "link" button between paired viewports in split view
2. Toggle icon: linked chain (synced) vs. broken chain (independent)
3. Only visible when split view is active
4. Visual indicator on linked viewports

### Step 5: Add Tests

1. Unit tests for ratio-based synchronization
2. Unit tests for position-based synchronization
3. Test with mismatched series lengths
4. Test infinite loop prevention

## Acceptance Criteria

- [ ] Scrolling in one linked viewport advances the other
- [ ] Spatial synchronization when Frame of Reference matches
- [ ] Ratio-based fallback for unrelated series
- [ ] Toggle to link/unlink viewports
- [ ] No infinite scroll loops
- [ ] Handles series with different slice counts gracefully
