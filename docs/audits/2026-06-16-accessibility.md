# Accessibility Audit — OpenScans DICOM Viewer

**Date:** 2026-06-16
**Type:** Read-only audit (no code changed). Prioritized backlog.
**Scope:** `src/components/` (viewer, layout, settings, ui, export, favorites, help) + keyboard hooks.

Context: a React 18 + Tailwind web/desktop DICOM viewer used with keyboard + mouse. Radix UI primitives (dialog/dropdown/select/slider/tooltip/toggle) provide a lot of a11y for free — the issues below are concentrated in the **custom** components and icon-only buttons.

**Highest-leverage fixes:** **H1** (toolbar `aria-label`s) and **H5/H6** (migrate the four hand-rolled dialogs to `@radix-ui/react-dialog` for focus trap + dialog semantics in one move) clear the bulk of the blocking issues.

---

## HIGH — blocks keyboard/AT users or missing accessible names on core controls

| # | File | Problem | Fix |
|---|---|---|---|
| **H1** | `viewer/ViewportToolbar.tsx` (`ToolbarButton` 514–532; inline 383, 430) | Icon-only buttons expose only `title` — not a reliable accessible name. The **entire primary toolbar** (Reset, Fit, Zoom±, Rotate, Flip, Invert, Window presets, Favorite, Export, AI) is nameless to AT. | Add `aria-label={title}` in `ToolbarButton` + inline buttons; add `aria-pressed={active}` on toggles (Flip H/V, Invert). |
| **H2** | `App.tsx` 288, 300, 309, 321 | Panel toggles + privacy toggle are icon-only with `title` only. | `aria-label` each; `aria-pressed` on the toggles. |
| **H3** | `viewer/ViewportToolbar.tsx` 382–425 (+169–178) | Custom window-presets dropdown: no `aria-haspopup`/`aria-expanded`, no `role="menu"`/`menuitem`, closes only on outside mousedown (no Escape, no arrow-key nav). | `aria-haspopup="menu" aria-expanded`; `role="menu"`/`menuitem`; Escape handler. |
| **H4** | `viewer/ThumbnailStrip.tsx` 180–217 | Tile is a clickable `<div>` with no role/tabIndex/key handler — the series thumbnail strip is **keyboard-inoperable**. | `role="button" tabIndex={0}` + `onKeyDown` (Enter/Space) + `aria-label="Image {n}"`; keep nested action buttons as-is (they `stopPropagation`). |
| **H5** | `ui/Modal.tsx`, `settings/SettingsPanel.tsx`, `viewer/KeyboardShortcutsHelp.tsx`, `favorites/BatchExportDialog.tsx` | No dialog traps focus, moves focus in on open, or restores focus on close — Tab escapes behind the backdrop. (Escape-close IS handled — good.) | Migrate to `@radix-ui/react-dialog` (free focus trap/restore/`aria-modal`/labelling). Minimal alt: focus first element on open, restore `activeElement` on close. |
| **H6** | Same dialogs (`Modal.tsx` 71–104 etc.) | Plain `<div>`s — AT isn't told a dialog opened or its name. | `role="dialog" aria-modal="true" aria-labelledby={titleId}` on the panel; id on the `<h2>`. |

## MEDIUM

| # | File | Problem | Fix |
|---|---|---|---|
| **M1** | `viewer/DicomViewport.tsx` 110–118 | Cornerstone canvas is an empty `<div>` — no text alternative for the current image. | `role="img"` + dynamic `aria-label` (`${modality} ${seriesDescription}, image ${i+1} of ${n}`). |
| **M2** | `viewer/ThumbnailStrip.tsx` 33–50 | Strip has no list semantics/label; active tile not announced. | `role="listbox"`/`list` + `aria-label="Series images"`; `aria-current`/`aria-selected` on active. |
| **M3** | `viewer/StudySeriesBrowser.tsx` 77; `App.tsx` 417, 436 | Expand/collapse toggles lack `aria-expanded`; active series row lacks `aria-current`. | Add `aria-expanded`; `aria-current="true"` on selected series. |
| **M4** | `settings/SettingsPanel.tsx` 66–112,167–204; `export/ExportDialog.tsx` 167–175; `App.tsx` 372–388 | `SettingsRow` label is a sibling `<p>`, not `<label htmlFor>` — selects/sliders (Theme, sensitivities, AI provider/language, JPEG quality, instance slider) have no accessible name. | Wire `id` + `<label htmlFor>` (or `aria-label`); label the API-key visibility toggles + instance slider. |
| **M5** | `favorites/FavoritesPanel.tsx` 123, 138, 300 | View-mode + "Export all" icon buttons `title`-only; indicator `<div title>` overlays. | `aria-label` the header buttons; `aria-hidden` or visually-hidden text on indicators. |
| **M6** | `viewer/KeyboardShortcutsHelp.tsx` 63–68 | Close `×` button has no accessible name. | `aria-label="Close"`. |
| **M7** | `layout/ResizeHandle.tsx` 88–110 | Keyboard-operable (Alt+Arrow, good) but `role="separator"` lacks `aria-orientation`/`aria-valuenow/min/max`; Alt+Arrow undiscoverable; plain arrows do nothing. | Add `aria-orientation` + value semantics; consider plain Arrow support. |
| **M8** | `settings/SettingsPanel.tsx` 150; `viewer/AiAnalysisModal.tsx` 45 | `window.confirm` for the PHI-egress consent — unstyled + inconsistent across web/Tauri. | Use a labelled in-app dialog (the app already has `AiSendConfirmDialog`). Lower urgency. |

## LOW / polish

| # | File | Problem | Fix |
|---|---|---|---|
| **L1** | throughout | Decorative SVGs inside soon-to-be-labelled buttons should be `aria-hidden`/`focusable="false"` to avoid double-announce. | After H1/H2. |
| **L2** | `viewer/AiStatusOverlays.tsx`; `ErrorToast.tsx` 46 | Async status / errors are visual-only (no `aria-live`). | `role="status"` on spinners, `role="alert"`/`aria-live="assertive"` on errors + toast. |
| **L3** | `viewer/ViewportIndicators.tsx` | W/L + zoom values update without `aria-live`. | Optional visually-hidden `aria-live="polite"` mirror. |
| **L4** | `text-gray-500`/`600` on dark bg — `ViewportToolbar.tsx` 409, 389/437/523 (disabled); `SettingsPanel.tsx` 393; `ExportDialog.tsx` 258,319; `FavoritesPanel.tsx` 106 | Muted secondary/disabled text likely below WCAG AA 4.5:1. | Bump to `text-gray-400` (verify pairs clear 4.5:1 body / 3:1 large). |
| **L6** | `hooks/useViewportKeyboard.ts` 80, 89 | `M`/`N` AI shortcuts fire on any window keydown — **typing "m"/"n" in the API-key field triggers AI detection/analysis.** (`useKeyboardShortcuts.ts:88` has the correct input guard to copy.) | Add the `HTMLInputElement`/`TextAreaElement` guard. (Keyboard-correctness bug, not strictly a11y.) |

---

## Already good (credit where due)

- **Escape-to-close on every dialog** (Modal, Settings, Shortcuts, BatchExport, AiSendConfirmDialog).
- **Radix Tooltip used correctly** with a provider in `LeftDrawerIconBar.tsx` — and those icon buttons **do** carry `aria-label` (the model to copy for H1/H2).
- **`ToggleSwitch` uses `role="switch" aria-checked`** (`SettingsPanel.tsx` 412–414).
- **Modal close button labelled** (`aria-label="Close dialog"`); `ErrorToast` dismiss labelled.
- **Comprehensive global shortcuts**, and `useKeyboardShortcuts` **ignores keystrokes while focused in inputs** (`:88`).
- **Sidebar/study/series/favorites nav rows are real `<button>`s** (keyboard-reachable). The thumbnail *strip* (H4) is the exception.
- **Export/Batch checkboxes use native `<input>` inside `<label>`** — properly associated.
- **ResizeHandle has a keyboard path + touch support** (refinement in M7).

---

## Suggested implementation order

1. **Safe, invisible, zero-visual-risk batch** (additive ARIA + the L6 bug): H1, H2, H3 (attrs), H6, M1, M3, M4, M5, M6, L2 — plus the L6 keyboard guard. No visual change, verifiable by build/lint/test.
2. **Behavioral** (needs a smoke-test): H4 (thumbnail keyboard), H5 (dialog focus trap — ideally the Radix Dialog migration), H3 (arrow-key menu nav), M7.
3. **Visual**: L4 contrast bumps (verify ratios), L1/L3 polish.
