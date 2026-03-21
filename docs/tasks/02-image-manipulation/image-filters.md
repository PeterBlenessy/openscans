# Task: Implement Image Filters

**Feature**: [Image Filters](../../features/02-image-manipulation/image-filters.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (3-5 days)
**Dependencies**: None

## Overview

Apply post-processing filters (sharpen, smooth, edge detect) to the displayed DICOM image for enhanced visualization. Filters are applied to the display only, not the underlying pixel data.

## Implementation Steps

### Step 1: Create Filter Engine

**File**: `src/lib/filters/imageFilters.ts`

1. Define convolution kernel functions:
   ```typescript
   type FilterKernel = number[][]

   const KERNELS = {
     sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
     smooth: [[1,1,1],[1,1,1],[1,1,1]],  // divide by 9
     edgeDetect: [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],
     gaussianBlur: [[1,2,1],[2,4,2],[1,2,1]],  // divide by 16
     emboss: [[-2,-1,0],[-1,1,1],[0,1,2]],
   }
   ```
2. Create `applyConvolution(imageData: ImageData, kernel: FilterKernel): ImageData`
3. Handle edge pixels (clamp or mirror)
4. Normalize output values to 0-255 range

### Step 2: Add Filter State to Viewport Store

**File**: `src/stores/viewportStore.ts`

1. Add filter state:
   ```typescript
   activeFilter: string | null  // null, 'sharpen', 'smooth', 'edgeDetect', etc.
   filterStrength: number       // 0.0 to 1.0, blend with original
   ```
2. Add actions: `setFilter(name)`, `setFilterStrength(value)`, `clearFilter()`

### Step 3: Apply Filters in Rendering Pipeline

**File**: `src/hooks/useViewportSetup.ts`

1. After Cornerstone renders the image, apply the active filter to the canvas
2. Use `canvas.getContext('2d').getImageData()` to get pixel data
3. Apply convolution kernel
4. Write filtered data back with `putImageData()`
5. Blend with original based on strength parameter

### Step 4: Add Filter Controls to UI

**File**: `src/components/viewer/FilterControls.tsx`

1. Create a dropdown or button group for filter selection
2. Add strength slider (0-100%)
3. Include "None" option to remove filter
4. Show filter name indicator when active
5. Add to ViewportToolbar as a collapsible section

### Step 5: Add Tests

1. Unit tests for convolution kernel application
2. Test edge pixel handling
3. Test filter strength blending
4. Test clearing filters

## Acceptance Criteria

- [ ] Sharpen, smooth, and edge detect filters can be applied
- [ ] Filter strength is adjustable
- [ ] Filters are non-destructive (don't modify DICOM data)
- [ ] Filters update when navigating between images
- [ ] "None" option removes the active filter
- [ ] No performance degradation on standard image sizes
