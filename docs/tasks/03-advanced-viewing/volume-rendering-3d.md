# Task: Implement 3D Volume Rendering

**Feature**: [3D Volume Rendering](../../features/03-advanced-viewing/volume-rendering-3d.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Very High (3-4 weeks)
**Dependencies**: MPR / Cornerstone3D Volume API (required first)

## Overview

Generate interactive 3D visualizations from CT/MRI volume data using GPU-accelerated ray casting. Requires the Cornerstone3D volume infrastructure from the MPR task.

## Implementation Steps

### Step 1: Add VTK.js Rendering Support

**File**: `package.json`

1. Add `@kitware/vtk.js` or use Cornerstone3D's built-in volume rendering
2. Cornerstone3D wraps VTK.js for volume rendering internally

### Step 2: Create 3D Rendering Viewport

**File**: `src/components/viewer/Volume3DViewport.tsx`

1. Create a Cornerstone3D viewport with `viewportType: 'VOLUME_3D'`
2. Render the loaded volume with a default transfer function
3. Enable orbit rotation (click-drag to rotate the 3D view)
4. Enable zoom (mouse wheel)

### Step 3: Implement Transfer Function Presets

**File**: `src/lib/cornerstone/transferFunctions.ts`

1. Define transfer function presets mapping density to opacity/color:
   - `bone` — show only bone-density voxels (>200 HU)
   - `skin` — semi-transparent skin surface
   - `vessel` — vascular structures with contrast
   - `mip` — Maximum Intensity Projection
   - `minip` — Minimum Intensity Projection
2. Each preset defines opacity and color arrays at key density thresholds

### Step 4: Create Transfer Function Editor

**File**: `src/components/viewer/TransferFunctionEditor.tsx`

1. Preset selector dropdown (bone, skin, vessel, MIP)
2. Optional: interactive opacity curve editor (advanced)
3. Opacity slider for overall transparency adjustment

### Step 5: Integrate with MPR Layout

**File**: `src/components/viewer/MprViewport.tsx`

1. Add optional 3D viewport as the fourth panel in 2x2 MPR layout
2. Link 3D viewport to the same volume as the MPR viewports
3. Crosshair position in MPR reflected as a dot or plane in 3D view

### Step 6: Performance Optimization

1. Use WebGL 2.0 for GPU-accelerated rendering
2. Progressive rendering (low resolution while rotating, full resolution on release)
3. Volume downsampling option for older GPUs
4. Memory monitoring and warnings

### Step 7: Add Tests

1. Test transfer function preset loading
2. Test viewport initialization and cleanup
3. Test memory cleanup on unmount

## Acceptance Criteria

- [ ] 3D volume renders from CT/MRI data
- [ ] Orbit rotation and zoom interaction
- [ ] At least 4 transfer function presets (bone, skin, vessel, MIP)
- [ ] Preset selector UI
- [ ] Integrates with MPR layout as fourth panel
- [ ] Acceptable performance on mid-range GPUs
- [ ] Memory cleanup on series change
