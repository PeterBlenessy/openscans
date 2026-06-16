# Touch / Mobile Support

**Status**: ❌ Not Implemented
**Category**: UX & Accessibility
**Priority**: Tier 3 — Evaluate Later
**Present In**: DWV

## Description

Optimize the user interface and interaction model for touch-based devices (tablets and phones). This includes touch gesture support for zoom (pinch), pan (two-finger drag), and W/L adjustment, as well as responsive layout adaptations for smaller screens.

## Benefits

- **Tablet use in clinical settings** — Tablets are increasingly used for bedside image review and in operating rooms
- **Mobile access** — Quick image review on a phone for urgent consultations
- **Touch gestures** — Pinch-to-zoom and swipe-to-scroll are natural touch interactions
- **Responsive layout** — UI adapts to smaller screen sizes without losing functionality

## Why It Matters for OpenScans

Most DICOM viewers (including OHIF and Weasis) are desktop-focused. DWV stands out for its mobile support. For OpenScans, tablet support is more valuable than phone support — radiologists reviewing images on an iPad is a realistic use case, while phone screens are too small for diagnostic viewing.

## Implementation Considerations

- Touch event handling for zoom (pinch), pan (two-finger drag), W/L (single-finger drag)
- Responsive layout with Tailwind CSS breakpoints
- Larger touch targets for buttons and controls
- Collapsible sidebar for small screens
- Consider tablet-first rather than phone-first (diagnostic viewing requires screen size)
