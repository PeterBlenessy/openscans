# Task: Implement Manual Segmentation (Brush Tool)

**Feature**: [Manual Segmentation](../../features/05-segmentation/manual-segmentation.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Very High (2-3 weeks)
**Dependencies**: Segmentation Overlays (for visualizing results)

## Overview

Provide brush, eraser, and threshold painting tools for manual pixel-level segmentation of anatomical structures.

## Implementation Steps

### Step 1: Add Segmentation State Store

**File**: `src/stores/segmentationStore.ts`

1. Create Zustand store:
   ```typescript
   interface SegmentationState {
     segmentations: Segmentation[]
     activeSegmentationId: string | null
     activeSegmentIndex: number
     brushSize: number
     brushMode: 'paint' | 'erase'
     segments: Segment[]
     addSegmentation: (seg: Segmentation) => void
     setActiveSegment: (index: number) => void
     setBrushSize: (size: number) => void
     setBrushMode: (mode: string) => void
   }

   interface Segmentation {
     id: string
     seriesInstanceUID: string
     labelmap: Uint8Array[]  // one per slice
     width: number
     height: number
     segments: Segment[]
   }

   interface Segment {
     index: number
     label: string
     color: [number, number, number]
     visible: boolean
   }
   ```

### Step 2: Create Brush Tool

**File**: `src/hooks/useBrushTool.ts`

1. Track mouse position during drag
2. Paint pixels within brush radius onto the active segmentation labelmap
3. Use the active segment index as the label value
4. Support eraser mode (set pixels to 0)
5. Brush size adjustable via slider or bracket keys `[` / `]`

### Step 3: Create Segmentation Rendering

**File**: `src/components/viewer/SegmentationOverlay.tsx`

1. Render the labelmap as a colored overlay on the viewport
2. Each segment index maps to a color from the segment list
3. Adjustable overall opacity (default 50%)
4. Per-segment visibility toggle

### Step 4: Create Segment Management UI

**File**: `src/components/viewer/SegmentPanel.tsx`

1. List of segments with color, label, and visibility toggle
2. Add new segment button
3. Rename segment (double-click)
4. Delete segment
5. Color picker for each segment

### Step 5: Add Undo/Redo for Segmentation

**File**: `src/hooks/useSegmentationHistory.ts`

1. Store labelmap snapshots for undo/redo
2. Limit history size (e.g., last 20 actions)
3. Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts

### Step 6: Add Toolbar Controls

1. Brush tool button with size indicator
2. Eraser button
3. Opacity slider
4. Segment selector dropdown

### Step 7: Add Tests

1. Test brush painting on labelmap
2. Test eraser clearing pixels
3. Test undo/redo history
4. Test segment management (add, rename, delete)

## Acceptance Criteria

- [ ] Brush tool paints on the segmentation labelmap
- [ ] Eraser clears segmentation pixels
- [ ] Multiple segments with distinct colors
- [ ] Adjustable brush size and opacity
- [ ] Undo/redo for brush strokes
- [ ] Segment management panel (add, rename, delete, toggle visibility)
- [ ] Segmentation overlay rendered correctly
