# Implementation Plan: Lead Tool UX Redesign

## Overview

Full CSS rewrite of the Lead Generation CRM frontend to adopt the kaelint-crm design system. Three files are modified: `public/css/styles.css` (complete replacement), `public/index.html` (nav restructuring, toast container, ARIA attributes), and `public/js/app.js` (minimal: `showToast()` function, `statusClass()` BEM update, ARIA toggle in `setupTabs()`). No tests needed — this is a pure visual redesign with no logic changes.

## Tasks

- [ ] 1. Rewrite `public/css/styles.css` with design token system
  - [ ] 1.1 Replace entire `public/css/styles.css` with the new token-based stylesheet
    - Define `:root` design token block (colors, radii, shadows, fonts, layout, all 7 status tokens)
    - Write base/reset styles (body, app shell, flexbox column layout, sticky header)
    - Write Nav component styles (`.tabs`, `.tab`, active/hover states, overflow-x scroll, hidden scrollbar)
    - Write Button component styles (`.btn` base, `--primary`, `--secondary`, `--danger`, `--sm`, disabled state)
    - Write Table component styles (uppercase headers, letter-spacing, border, clickable row hover)
    - Write Modal component styles (overlay, centered card, surface/border/radius/shadow tokens, z-index 10000)
    - Write Form component styles (`.form-group`, labels, inputs/selects/textareas, focus ring via box-shadow)
    - Write Badge component styles (`.badge` base pill, all 7 `--{status}` modifiers with token colors)
    - Write Toast component styles (`#toast-container` fixed bottom-right, `.toast` base, 4 variant borders, entry/exit animation)
    - Write Empty State component styles (`.empty-state`, `__icon`, `__text`)
    - Write Dashboard Alert Card styles (`.dashboard-alerts` with surface/border/radius tokens)
    - Write utility classes (`.hidden { display: none !important }`, `.active` panel display)
    - Write all remaining component styles (enrichment bar, preview section, loading overlay, error banner, header, panel toolbar, status-pill inline badges, quality-badge, settings tabs/panels, lead-select checkboxes)
    - Preserve all CSS class names referenced by JavaScript (see design doc CSS Class Contract table)
    - _Requirements: 1.1–1.6, 2.1–2.5, 3.3–3.6, 4.1–4.8, 5.1–5.6, 6.1–6.6, 7.1–7.5, 8.1–8.12, 9.1–9.9, 10.1–10.4, 11.1–11.4, 12.3, 12.5_

- [ ] 2. Restructure `public/index.html` for ARIA navigation and toast container
  - [ ] 2.1 Update the navigation section and add toast container
    - Add `aria-label="Main navigation"` to the existing `<nav class="tabs">`
    - Wrap tab buttons in a `<div role="tablist">`
    - Add `role="tab"` and `aria-selected` attributes to each `.tab` button (`aria-selected="true"` on the active tab, `"false"` on others)
    - Add `<div id="toast-container"></div>` before the closing `</div>` of `#app` (or at end of body)
    - _Requirements: 3.1, 3.2, 9.1, 12.1, 12.2_

- [ ] 3. Update `public/js/app.js` with toast function and minor updates
  - [ ] 3.1 Add `showToast()` function and update `statusClass()` and `setupTabs()`
    - Add the `showToast(type, message)` function (creates toast element, appends to `#toast-container`, animates entry, auto-dismisses non-error toasts after 4s, error toasts persist with close button)
    - Update `statusClass()` to return BEM modifiers (`badge--discovered`, `badge--reached-out`, etc.)
    - Update `setupTabs()` to toggle `aria-selected="true"/"false"` on tab buttons when switching tabs
    - Add "🎨" preview trigger button in Discovery table row actions (visible when lead has websiteAnalyzedAt, triggers generation via SSE)
    - Add "👁" view preview button in Discovery table row actions (visible when lead has previewUrl, opens preview in new tab)
    - Keep full preview progress/result in the detail modal (top section, more prominent)
    - _Requirements: 9.1–9.9, 8.1, 3.2, 12.4, 14.1–14.6_

- [ ] 4. Final checkpoint
  - Ensure all three files are consistent: CSS classes referenced in HTML exist in CSS, JS functions reference correct element IDs and class names
  - Verify no JavaScript behavior changes — tab switching, modal open/close, form submission, table row clicking all work identically
  - Ensure all existing element IDs and data attributes are preserved
  - Ask the user if questions arise.

## Notes

- No tests needed — this is a CSS/UI redesign with zero logic changes
- The CSS rewrite is a single large task because splitting pure CSS into isolated tasks creates artificial boundaries that don't reduce complexity
- All existing class names used by JavaScript are preserved (`.hidden`, `.active`, `.tab`, `.tab-panel`, `.modal-overlay`, `.status-badges`, `.badge`, etc.)
- The `statusClass()` update changes return values from old format to BEM modifiers — CSS must support both during transition
- The `showToast()` function is additive — existing `showError()` function remains unchanged
- No build step, no preprocessor, no external dependencies introduced

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": [] }
  ]
}
```
