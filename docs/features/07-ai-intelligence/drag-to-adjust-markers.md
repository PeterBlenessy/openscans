# Drag-to-Adjust AI Markers

**Status**: ✅ Implemented
**Category**: AI & Intelligence
**Priority**: High

## Description

Manually adjust the position of AI-generated markers by clicking and dragging them to the correct location. The system tracks which markers have been manually adjusted versus those at their original AI-assigned position, enabling quality assessment of the AI's accuracy.

## Benefits

- **Human-in-the-loop** — AI detections can be verified and corrected by the user, combining AI speed with human accuracy
- **Accuracy tracking** — The system records original vs. adjusted positions, enabling assessment of AI performance over time
- **Non-destructive** — Original AI positions are preserved even after adjustment, allowing comparison
- **Intuitive interaction** — Direct drag interaction is the most natural way to correct a misplaced marker

## Current Implementation

- Click-and-drag to reposition markers
- Original position preserved for comparison
- `manuallyAdjusted` flag tracks user corrections
- Context menu for additional marker operations

## Key Files

- `src/stores/annotationStore.ts`
- `src/types/annotation.ts`
