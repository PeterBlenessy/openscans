# WCAG Accessibility

**Status**: ❌ Not Implemented
**Category**: UX & Accessibility
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF (partial)

## Description

Implement Web Content Accessibility Guidelines (WCAG) 2.1 Level AA compliance to ensure the application is usable by people with disabilities. This includes screen reader support, keyboard navigation for all interactive elements, sufficient color contrast, and ARIA labels.

## Benefits

- **Inclusive design** — Ensure the application is usable by people with visual, motor, or cognitive disabilities
- **Legal compliance** — Many institutions are required to use WCAG-compliant software (Section 508 in the US, EN 301 549 in the EU)
- **Better UX for everyone** — Accessibility improvements (keyboard navigation, clear labels, high contrast) benefit all users
- **Institutional requirement** — Government and large healthcare organizations often mandate accessibility compliance

## Why It Matters for OpenScans

WCAG compliance is rarely implemented in DICOM viewers — even OHIF has only partial support. Achieving AA compliance would be a notable differentiator and would remove a barrier to institutional adoption, particularly in government healthcare systems.

## Implementation Considerations

- Audit current UI with accessibility tools (axe, Lighthouse)
- Add ARIA labels to all interactive elements
- Ensure keyboard navigation for all controls (focus management)
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Screen reader announcements for dynamic content changes
- Skip navigation links
- Radix UI components already provide accessibility foundations
