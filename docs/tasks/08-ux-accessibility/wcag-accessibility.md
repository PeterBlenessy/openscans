# Task: Implement WCAG Accessibility

**Feature**: [WCAG Accessibility](../../features/08-ux-accessibility/wcag-accessibility.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (4-5 days)
**Dependencies**: None

## Overview

Achieve WCAG 2.1 Level AA compliance for the application interface.

## Implementation Steps

### Step 1: Accessibility Audit

**No file changes — research task**

1. Run automated audits with Lighthouse and axe-core
2. Manually test keyboard navigation through the entire application
3. Test with screen readers (VoiceOver on macOS, NVDA on Windows)
4. Document all findings in a checklist

### Step 2: Add ARIA Labels and Roles

**Files**: All components in `src/components/`

1. Add `aria-label` to all icon-only buttons:
   ```html
   <button aria-label="Zoom In" title="Zoom In">
     <ZoomIn size={20} />
   </button>
   ```
2. Add `role` attributes where semantic HTML is insufficient
3. Add `aria-expanded` to collapsible sections
4. Add `aria-selected` to active items in lists
5. Add `aria-live` regions for dynamic content (error messages, status updates)

### Step 3: Ensure Keyboard Navigation

**Files**: Various components

1. All interactive elements must be focusable and operable via keyboard
2. Add visible focus indicators (focus ring styles):
   ```css
   .focus-visible:ring-2 .focus-visible:ring-blue-500
   ```
3. Implement focus trapping in modal dialogs
4. Add skip navigation link at the top of the page
5. Ensure logical tab order throughout the application

### Step 4: Fix Color Contrast

**File**: `tailwind.config.js` and component files

1. Verify all text meets WCAG AA contrast ratios:
   - Normal text: 4.5:1 contrast ratio
   - Large text (18px+): 3:1 contrast ratio
2. Check both dark and light themes
3. Fix any failing contrast ratios by adjusting colors

### Step 5: Add Screen Reader Announcements

**File**: `src/components/viewer/A11yAnnouncements.tsx`

1. Create a live region component for dynamic announcements:
   ```typescript
   export function A11yAnnouncer() {
     return (
       <div aria-live="polite" aria-atomic="true" className="sr-only">
         {announcement}
       </div>
     )
   }
   ```
2. Announce key state changes:
   - "Image 5 of 20" when navigating
   - "Study loaded: Chest CT" when loading
   - "Tool activated: Zoom" when switching tools
   - Error messages

### Step 6: Add Automated Accessibility Tests

**File**: `e2e/accessibility.spec.ts`

1. Add axe-core integration to Playwright tests:
   ```typescript
   import AxeBuilder from '@axe-core/playwright'
   test('should not have accessibility violations', async ({ page }) => {
     const results = await new AxeBuilder({ page }).analyze()
     expect(results.violations).toEqual([])
   })
   ```

### Step 7: Add Tests

1. Automated axe-core audit in E2E tests
2. Keyboard navigation test (tab through all controls)
3. Focus management test (modals, drawers)

## Acceptance Criteria

- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all controls
- [ ] Visible focus indicators on all focusable elements
- [ ] Color contrast meets WCAG AA ratios
- [ ] Screen reader announces key state changes
- [ ] Focus trapped in modal dialogs
- [ ] Skip navigation link present
- [ ] No axe-core violations in automated tests
