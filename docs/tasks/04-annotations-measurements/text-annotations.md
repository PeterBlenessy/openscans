# Task: Complete Text Annotations

**Feature**: [Text Annotations](../../features/04-annotations-measurements/text-annotations.md)
**Priority**: Medium
**Estimated Effort**: Low-Medium (2-3 days)
**Dependencies**: None (type system already exists)

## Overview

Complete the text annotation feature. The `TextAnnotation` type is already defined in the type system and the annotation store supports it. What's missing is the interactive placement UI and visual rendering.

## Implementation Steps

### Step 1: Create Text Placement Tool

**File**: `src/hooks/useTextAnnotationTool.ts`

1. Create a hook that handles text annotation placement:
   - Click on the image to set the text position
   - Show an input field/modal to enter the text content
   - Create a `TextAnnotation` and add it to the store
2. Handle the click → input → save flow

### Step 2: Create Text Input Dialog

**File**: `src/components/viewer/TextAnnotationInput.tsx`

1. Small floating input that appears at the click position
2. Text input field with a confirm button
3. Optional font size selector (small, medium, large)
4. Press Enter to confirm, Escape to cancel
5. Auto-focus the input field on open

### Step 3: Render Text Annotations on Viewport

**File**: `src/components/viewer/AnnotationOverlay.tsx`

1. Create an overlay component that renders text annotations:
   ```typescript
   // For each TextAnnotation on the current instance:
   <text
     x={annotation.position.x}
     y={annotation.position.y}
     className="fill-yellow-400 text-sm"
   >
     {annotation.text}
   </text>
   ```
2. Add a semi-transparent background for readability
3. Optional leader line from text to a target point
4. Handle viewport transforms (zoom, pan) to keep text properly positioned

### Step 4: Add Edit and Delete Interactions

**File**: `src/components/viewer/AnnotationOverlay.tsx`

1. Double-click a text annotation to edit it
2. Right-click for context menu with "Edit" and "Delete" options
3. Drag to reposition the text
4. Use existing `updateAnnotation()` and `deleteAnnotation()` store actions

### Step 5: Add Text Tool to Toolbar

**File**: `src/components/viewer/ViewportToolbar.tsx`

1. Add text annotation button using `Type` Lucide icon
2. Clicking activates text placement mode
3. Add keyboard shortcut (e.g., `T` for text)

### Step 6: Add Tests

1. Test text annotation creation with position and content
2. Test text editing (update annotation)
3. Test text deletion

## Acceptance Criteria

- [ ] Click on image to place a text annotation
- [ ] Text input dialog appears for entering content
- [ ] Text renders on the viewport with readable background
- [ ] Double-click to edit existing text
- [ ] Right-click to delete
- [ ] Drag to reposition
- [ ] Text annotations persist across navigation and sessions
