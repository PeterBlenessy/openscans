# Text Annotations

**Status**: 🔄 Partially Implemented
**Category**: Annotations & Measurements
**Priority**: Medium

## Description

Place text labels at specific positions on an image to annotate findings, add notes, or label anatomy. Text annotations include a label string positioned at a specific coordinate, optionally with a leader line pointing to the relevant structure.

## Benefits

- **Documentation** — Add notes directly on the image for future reference or communication
- **Teaching** — Label anatomical structures for educational purposes
- **Finding description** — Annotate findings with brief text descriptions alongside visual markers
- **Report preparation** — Add annotations that become part of exported images or PDFs

## Current Implementation

- Text annotation type defined in the type system (`TextAnnotation`)
- Annotation store supports text annotations
- Visual rendering of text annotations on the viewport is not yet fully implemented

## What's Missing

- Interactive text placement tool (click to position, type to add text)
- Text editing and deletion UI
- Font size and style options
- Leader line from text to a target point
- Text background for readability over varying image content

## Key Files

- `src/types/annotation.ts`
- `src/stores/annotationStore.ts`
