# Task: Implement Hanging Protocols

**Feature**: [Hanging Protocols](../../features/03-advanced-viewing/hanging-protocols.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: High (5-7 days)
**Dependencies**: Split/Comparison View (required first)

## Overview

Automatically arrange study series into predefined viewport layouts based on study type, modality, and body part examined. Eliminates the manual work of assigning series to viewport panels.

## Implementation Steps

### Step 1: Define Hanging Protocol Schema

**File**: `src/types/hangingProtocol.ts`

1. Define the protocol data structure:
   ```typescript
   interface HangingProtocol {
     id: string
     name: string
     description: string
     matchCriteria: ProtocolMatchCriteria
     layout: '1x1' | '1x2' | '2x1' | '2x2'
     viewports: ViewportProtocol[]
     priority: number  // higher = preferred when multiple match
   }

   interface ProtocolMatchCriteria {
     modality?: string[]
     bodyPartExamined?: string[]
     studyDescription?: RegExp
   }

   interface ViewportProtocol {
     seriesMatchCriteria: SeriesMatchCriteria
     initialSettings?: Partial<ViewportSettings>
   }

   interface SeriesMatchCriteria {
     seriesDescription?: RegExp
     modality?: string
     seriesNumber?: number
   }
   ```

### Step 2: Create Default Protocol Definitions

**File**: `src/lib/hangingProtocols/defaultProtocols.ts`

1. Define protocols for common study types:
   - **Brain MRI**: 2x2 layout — T1, T2, FLAIR, DWI
   - **Spine MRI**: 1x2 layout — Sagittal T1, Sagittal T2
   - **Chest CT**: 1x1 layout — axial soft tissue window
   - **MSK MRI (Knee)**: 2x2 layout — Sagittal PD, Coronal PD, Axial PD, Sagittal T2
2. Each protocol specifies series matching criteria using description patterns

### Step 3: Create Protocol Matching Engine

**File**: `src/lib/hangingProtocols/protocolMatcher.ts`

1. Create `findMatchingProtocol(study: DicomStudy, protocols: HangingProtocol[]): HangingProtocol | null`
2. Evaluate match criteria against study metadata
3. Score matches and select the highest-priority protocol
4. Return null if no protocol matches (fall back to 1x1)

### Step 4: Create Series Assignment Logic

**File**: `src/lib/hangingProtocols/seriesAssigner.ts`

1. For each viewport in the matched protocol, find the best-matching series
2. Match by series description regex, modality, and series number
3. Handle cases where a series is missing (leave viewport empty)
4. Handle extra series not covered by the protocol

### Step 5: Integrate with Study Loading

**File**: `src/hooks/useLoadStudy.ts`

1. After a study is loaded, run the protocol matcher
2. If a protocol matches, automatically set the layout and assign series
3. If no protocol matches, use the default 1x1 layout with the first series
4. Add a "Re-apply protocol" button for manual trigger

### Step 6: Protocol Management UI

**File**: `src/components/settings/ProtocolManager.tsx`

1. List available protocols in settings
2. Enable/disable individual protocols
3. Future: custom protocol editor (out of scope for initial implementation)

### Step 7: Add Tests

1. Unit tests for protocol matching logic
2. Test series assignment with various study configurations
3. Test fallback when no protocol matches
4. Test handling of missing series

## Acceptance Criteria

- [ ] Common study types auto-arrange into appropriate layouts
- [ ] Protocol matching uses modality, body part, and study description
- [ ] Series are assigned to viewports based on description matching
- [ ] Graceful fallback when no protocol matches
- [ ] At least 4 default protocols (brain MRI, spine MRI, chest CT, knee MRI)
- [ ] User can override the automatic layout
