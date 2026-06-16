# Task: Implement GrowCut (Semi-Automatic Segmentation)

**Feature**: [GrowCut](../../features/05-segmentation/growcut-semi-auto.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Very High (2-3 weeks)
**Dependencies**: Manual Segmentation (brush tool for seed placement), Segmentation Overlays

## Overview

Semi-automatic segmentation using the GrowCut cellular automaton algorithm. User provides seed points for foreground and background, and the algorithm grows the segmentation to fill the target structure.

## Implementation Steps

### Step 1: Implement GrowCut Algorithm

**File**: `src/lib/segmentation/growcut.ts`

1. Implement the cellular automaton-based GrowCut algorithm:
   ```typescript
   function growCut(
     imageData: Float32Array,
     width: number, height: number,
     seeds: Uint8Array,  // seed labelmap (0=unknown, 1=foreground, 2=background)
     maxIterations: number
   ): Uint8Array  // result labelmap
   ```
2. For each iteration, each pixel "attacks" its neighbors
3. Pixels with stronger signal similarity to a labeled neighbor adopt that label
4. Converges when no more labels change

### Step 2: Create WebGPU Accelerated Version (Optional)

**File**: `src/lib/segmentation/growcutGpu.ts`

1. Port the GrowCut algorithm to WebGPU compute shaders
2. Each pixel processed in parallel on the GPU
3. Feature-detect WebGPU and fall back to CPU version
4. This is ambitious — consider CPU-only for initial implementation

### Step 3: Create Seed Painting UI

**File**: `src/hooks/useGrowCutTool.ts`

1. Two-brush mode: foreground brush (green) and background brush (red)
2. User paints seeds on the target structure (foreground) and surrounding tissue (background)
3. "Run" button executes the GrowCut algorithm
4. Preview mode: show growing segmentation in real-time (if GPU-accelerated)

### Step 4: Add Accept/Reject/Refine Workflow

**File**: `src/components/viewer/GrowCutControls.tsx`

1. After GrowCut runs, show the result as a preview overlay
2. "Accept" — commit the segmentation to the labelmap
3. "Reject" — discard and start over
4. "Refine" — add more seeds and re-run

### Step 5: Add Tests

1. Test GrowCut convergence on simple synthetic images
2. Test seed labelmap handling
3. Test with known segmentation targets

## Acceptance Criteria

- [ ] User can paint foreground and background seeds
- [ ] GrowCut algorithm produces a segmentation from seeds
- [ ] Preview/accept/reject workflow
- [ ] Results can be refined with additional seeds
- [ ] CPU implementation works on all browsers
- [ ] Optional WebGPU acceleration for real-time feedback
