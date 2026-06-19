# Task: Implement Split / Comparison View

**Feature**: [Split / Comparison View](../../features/03-advanced-viewing/split-comparison-view.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: High — realistically larger than the original 5-8d estimate (see "Architectural reality" below)
**Dependencies**: None to start, but it re-plumbs the single-viewport substrate the Tier-1 measurement/cine/full-screen tools stand on — best landed AFTER those (PR #19). Foundational for synchronized scrolling and reference lines.

## Overview

Display two or more image series side by side in a configurable layout grid. Each viewport panel operates independently with its own zoom, W/L, and scroll position.

## ⚠️ Architectural reality (read before starting)

The step list below understates — and in one place contradicts — the hardest part of this feature. The app today is **single-viewport by construction**:

- `viewportStore.settings` is a **single global** object (zoom, W/L, pan, rotation, flip, invert).
- `studyStore` holds a **single** `currentInstance` / `currentSeries` / `currentInstanceIndex`.
- One cornerstone element is enabled at a time; `AnnotationOverlay`, the AI detectors, favorites, keyboard nav, and the toolbar all read that single global current instance + settings.

True per-panel independence ("each panel has its own zoom/W/L/scroll" — Overview + Step 3) is therefore **incompatible** with "no changes to existing stores/hooks; 1×1 unchanged" (Step 7 as originally written). You cannot get independent per-panel state without **relocating per-viewport state into per-panel state** and rewiring every consumer. Preserving 1×1 behaviour is a *goal achieved through* that refactor — not by avoiding it.

### Interaction with the Tier-1 tools (PR #19)

Everything in the Tier-1 batch assumes one cornerstone element / one current instance, so each becomes a per-panel concern:

- **Measurement tools** (`useViewportTools`; Length/Angle/ROI) — tool activation, the W/L-drag yield, and the persisted SVG overlay are global today; they must target the active panel.
- **Cine** (`useCinePlayback`) — "which panel is playing?" The interval driver, frame-rate state, and auto-pause are global.
- **Full-screen** (`useFullscreen`) — panel vs. whole-grid scope.

### Recommended phased approach

1. **Phase 1** — layout grid + the per-panel viewport/current-instance state refactor, with toolbar, keyboard, cine, and measurement tools operating only on the **active** panel (other panels static). Ship + verify single-viewport parity first.
2. **Phase 2** — per-panel tool/cine independence (each panel scrolls/measures/plays on its own), then synchronized scrolling and reference lines.

The skeleton below is reasonable, but read Steps 3 and 7 in light of the above.

## Implementation Steps

### Step 1: Create Layout Store

**File**: `src/stores/layoutStore.ts`

1. Create a Zustand store for viewport layout management:
   ```typescript
   interface LayoutState {
     layout: '1x1' | '1x2' | '2x1' | '2x2'
     viewports: ViewportConfig[]   // one per panel
     activeViewportIndex: number   // which panel has focus
     setLayout: (layout: string) => void
     setViewportSeries: (index: number, seriesUID: string) => void
     setActiveViewport: (index: number) => void
   }

   interface ViewportConfig {
     seriesInstanceUID: string | null
     studyInstanceUID: string | null
   }
   ```
2. Default to `1x1` layout (current behavior)
3. Persist layout preference in localStorage

### Step 2: Create Layout Grid Container

**File**: `src/components/viewer/ViewportGrid.tsx`

1. Create a CSS Grid container that renders multiple viewport panels:
   ```typescript
   export function ViewportGrid() {
     const layout = useLayoutStore((s) => s.layout)
     const viewports = useLayoutStore((s) => s.viewports)

     const gridClass = {
       '1x1': 'grid-cols-1 grid-rows-1',
       '1x2': 'grid-cols-2 grid-rows-1',
       '2x1': 'grid-cols-1 grid-rows-2',
       '2x2': 'grid-cols-2 grid-rows-2',
     }[layout]

     return (
       <div className={`grid ${gridClass} h-full gap-1`}>
         {viewports.map((vp, i) => (
           <ViewportPanel key={i} index={i} config={vp} />
         ))}
       </div>
     )
   }
   ```

### Step 3: Refactor DicomViewport into ViewportPanel

**File**: `src/components/viewer/ViewportPanel.tsx`

1. Extract the current `DicomViewport` rendering logic into a reusable `ViewportPanel`
2. Each panel receives its own `ViewportConfig` specifying which series to display
3. Each panel maintains independent viewport state (zoom, W/L, scroll position) — **this is the load-bearing refactor**: today that state is global in `viewportStore.settings` + `studyStore.current*`. Move it into per-panel state (keyed by panel index in `layoutStore`, or a per-panel store instance) and update every consumer (toolbar, keyboard, `AnnotationOverlay`, AI, favorites, the Tier-1 tools) to read the **active** panel. See "Architectural reality" above.
4. Add a visual border highlight on the active (focused) panel
5. Click on a panel to make it the active viewport

### Step 4: Add Layout Selector to Toolbar

**File**: `src/components/viewer/LayoutSelector.tsx`

1. Create a dropdown or button group with layout options:
   - `1x1` (single viewport — default)
   - `1x2` (side by side)
   - `2x1` (top and bottom)
   - `2x2` (quad view)
2. Visual icons showing the grid arrangement
3. Add to the viewport toolbar

### Step 5: Enable Series Assignment to Panels

**File**: `src/components/viewer/ViewportGrid.tsx`

1. Allow drag-and-drop of series from the study browser to a viewport panel
2. Alternative: right-click on a series → "Open in Panel 2"
3. When changing layout from 1x1 to 1x2, the current series stays in panel 1 and panel 2 starts empty

### Step 6: Handle Active Viewport Context

**File**: `src/stores/layoutStore.ts`

1. Toolbar actions (W/L presets, rotation, export) apply to the active viewport
2. Keyboard navigation applies to the active viewport
3. The study browser highlights the series displayed in the active viewport

### Step 7: Maintain Backwards Compatibility

**File**: `src/components/viewer/DicomViewport.tsx`

1. Wrap existing `DicomViewport` with `ViewportGrid`
2. In `1x1` mode, behavior is identical to current implementation
3. ⚠️ Correction: existing stores/hooks **do** change — per-panel state is the whole point (see "Architectural reality"). The goal is that 1×1 *behaviour* stays byte-for-byte identical, achieved by making the single panel the active panel and routing all global reads through the active-panel accessor. "No store changes" is not achievable alongside independent per-panel state.

### Step 8: Add Tests

1. Unit tests for layout store (layout changes, viewport assignment)
2. Test that 1x1 layout preserves current behavior
3. Test active viewport switching
4. Test series assignment to panels

## Acceptance Criteria

- [ ] Layout selector with 1x1, 1x2, 2x1, 2x2 options
- [ ] Each panel displays an independent series
- [ ] Each panel has independent zoom, W/L, and scroll position
- [ ] Active panel is visually indicated
- [ ] Toolbar actions apply to the active panel
- [ ] Series can be assigned to panels via drag-drop or context menu
- [ ] Default 1x1 layout preserves current behavior
- [ ] Layout preference persists across sessions
