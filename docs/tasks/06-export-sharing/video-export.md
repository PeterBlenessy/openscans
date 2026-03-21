# Task: Implement Video Export (AVI/MP4)

**Feature**: [Video Export](../../features/06-export-sharing/video-export.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Cine Loop (provides the playback infrastructure to capture)

## Overview

Export a series of DICOM images as an MP4 video file, capturing the current viewport settings (W/L, zoom, annotations).

## Implementation Steps

### Step 1: Create Video Encoder

**File**: `src/lib/export/videoExport.ts`

1. Use the MediaRecorder API to capture canvas frames:
   ```typescript
   async function exportSeriesAsVideo(
     canvasElement: HTMLCanvasElement,
     frameCount: number,
     fps: number,
     onProgress: (progress: number) => void
   ): Promise<Blob>
   ```
2. Alternative: use `ffmpeg.wasm` for more control over encoding parameters
3. Output format: MP4 (H.264) for maximum compatibility

### Step 2: Implement Frame Capture Loop

**File**: `src/lib/export/videoExport.ts`

1. For each instance in the series:
   - Load the image into the viewport
   - Wait for rendering to complete
   - Capture the canvas frame
2. Apply current W/L, zoom, and annotation settings to each frame
3. Report progress (frame N of M)

### Step 3: Add Video Export UI

**File**: `src/components/export/VideoExportDialog.tsx`

1. Frame rate selector (5, 10, 15, 20, 30 fps)
2. Resolution selector (viewport size, 720p, 1080p)
3. Instance range (all images or selected range)
4. Include annotations toggle
5. Progress bar during export
6. Estimated file size display

### Step 4: Integrate with Export Dialog

**File**: `src/components/export/ExportDialog.tsx`

1. Add "Video (MP4)" as a format option
2. When selected, show video-specific settings
3. Trigger video export on confirm

### Step 5: Add Tests

1. Test frame capture for a small series
2. Test progress callback accuracy
3. Test with different fps settings

## Acceptance Criteria

- [ ] Series exported as playable MP4 video
- [ ] Configurable frame rate and resolution
- [ ] Current W/L settings applied to each frame
- [ ] Progress indicator during export
- [ ] Privacy-first filename generation
- [ ] Video plays in standard media players
