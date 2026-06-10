# Design Document

## Overview

This design describes the full CSS rewrite of the Lead Generation CRM frontend to adopt the kaelint-crm design system. The approach replaces all existing styles with a design-token-based system using CSS custom properties, applies BEM naming conventions for new components, and introduces toast notifications — all within the constraint of zero JavaScript behavior changes.

The implementation targets three files:
1. **`public/css/styles.css`** — full rewrite (design tokens, BEM components, all layout rules)
2. **`public/index.html`** — restructure for semantic ARIA nav, toast container, BEM class additions
3. **`public/js/app.js`** — minimal: add toast utility function, update badge class references to BEM modifiers

## Architecture

### Design Token Architecture

All visual values are centralized in a `:root` block at the top of `styles.css`. This mirrors the kaelint-crm pattern exactly:

```css
:root {
  /* Semantic colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #dbeafe;
  --color-success: #16a34a;
  --color-success-light: #dcfce7;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --color-danger: #dc2626;
  --color-danger-light: #fee2e2;
  --color-info: #0891b2;
  --color-info-light: #cffafe;

  /* Surface & text */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', SFMono-Regular, Consolas, monospace;

  /* Layout */
  --header-height: 56px;
  --nav-height: 48px;
  --content-max: 1200px;

  /* Status tokens */
  --status-discovered-bg: #f1f5f9;
  --status-discovered-text: #64748b;
  --status-reached-out-bg: #dbeafe;
  --status-reached-out-text: #1d4ed8;
  --status-replied-bg: #ede9fe;
  --status-replied-text: #6d28d9;
  --status-no-response-bg: #fef3c7;
  --status-no-response-text: #d97706;
  --status-meeting-scheduled-bg: #dcfce7;
  --status-meeting-scheduled-text: #16a34a;
  --status-client-won-bg: #166534;
  --status-client-won-text: #ffffff;
  --status-lost-bg: #fee2e2;
  --status-lost-text: #dc2626;
}
```

### Component Architecture

Components follow BEM naming where new classes are introduced, while preserving all existing class names used by JavaScript. The strategy is **additive** — new BEM classes coexist with legacy classes. The JavaScript uses class names like `.hidden`, `.active`, `.tab`, `.tab-panel`, `.modal-overlay`, `.status-badges`, `.badge`, etc., and these remain functional.

#### Dual-class Strategy

For elements that JS toggles via existing classes, we keep the old class for JS and add BEM for styling:

```html
<!-- JS uses .tab and .active classes; CSS targets both -->
<button class="tab nav__tab" role="tab">Discovery</button>
```

In practice, since this is a full CSS rewrite, the simplest approach is to style the **existing** classes directly while adopting the design token values. New components (toast, empty state icon) use clean BEM from the start.

### File Change Strategy

| File | Change Type | Scope |
|------|-------------|-------|
| `public/css/styles.css` | Full rewrite | Replace all ~400 lines with token-based rules |
| `public/index.html` | Restructure | Wrap tabs in `<nav>`, add ARIA attributes, add `#toast-container`, add BEM modifiers to badges |
| `public/js/app.js` | Minimal additions | Add `showToast()` function, update `statusClass()` to return BEM modifiers |

## Components and Interfaces

### 1. App Shell

The overall page uses flexbox column layout for full viewport height. The body gets the `--color-bg` background and `--color-text` color.

```css
body {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

The header is sticky with `z-index: 100` and uses `--color-surface` background. Main content uses `max-width: var(--content-max)` with auto margins.

### 2. Navigation Component

The existing `<nav class="tabs">` is restructured to use semantic ARIA:

```html
<nav class="tabs" aria-label="Main navigation">
  <div role="tablist">
    <button class="tab" role="tab" aria-selected="true" data-tab="discovery">Discovery</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="outreach">Outreach Pipeline</button>
    <!-- ... -->
  </div>
</nav>
```

The CSS for `.tabs` adds `overflow-x: auto; scrollbar-width: none;` and hides WebKit scrollbars for narrow viewports. Active tabs get `color: var(--color-primary); border-bottom-color: var(--color-primary);`.

The `setupTabs()` function in `app.js` is updated to toggle `aria-selected` when switching tabs (in addition to the existing `.active` class toggle).

### 3. Button Component

Buttons use BEM modifiers while keeping existing class names functional:

```css
.btn { /* base */ }
.btn-primary, .btn--primary { background: var(--color-primary); color: #fff; }
.btn-danger, .btn--danger { background: var(--color-danger); color: #fff; }
.btn-sm, .btn--sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
```

Both old names (`btn-primary`) and BEM names (`btn--primary`) are supported via CSS. The HTML can gradually migrate, but JS inline references continue to work.

### 4. Table Component

Tables adopt the kaelint-crm pattern — uppercase headers with letter-spacing, `--color-bg` header background, `--color-border` cell borders. Clickable rows get `cursor: pointer` and `--color-primary-light` on hover.

```css
th {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background: var(--color-bg);
}

tr.clickable { cursor: pointer; }
tr.clickable:hover td { background: var(--color-primary-light); }
```

### 5. Modal Component

Modals use `z-index: 10000`, `rgba(0, 0, 0, 0.5)` overlay, flexbox centering, and card styling with surface/border/radius/shadow tokens. Width constraints: 90% viewport width, `max-width: 600px` default, `700px` for `.modal-wide`.

### 6. Form Component

Forms use `.form-row` (kept for backward compatibility, styled as `.form-group` with 1rem margin). Focus states use `box-shadow: 0 0 0 3px var(--color-primary-light)` with `border-color: var(--color-primary)` and `outline: none`.

### 7. Badge Component

The `statusClass()` function in `app.js` is updated to return BEM modifiers:

```javascript
function statusClass(status) {
  const map = {
    'Discovered': 'badge--discovered',
    'Reached Out': 'badge--reached-out',
    'Replied': 'badge--replied',
    'No Response': 'badge--no-response',
    'Meeting Scheduled': 'badge--meeting-scheduled',
    'Client Won': 'badge--client-won',
    'Lost': 'badge--lost'
  };
  return map[status] || '';
}
```

Each modifier applies the corresponding status token pair:

```css
.badge--discovered { background: var(--status-discovered-bg); color: var(--status-discovered-text); }
.badge--reached-out { background: var(--status-reached-out-bg); color: var(--status-reached-out-text); }
/* ... etc for all 7 */
```

The `.badge` base class uses `border-radius: 9999px; display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 500;`.

### 8. Toast Notification System

A new `#toast-container` element is appended to `index.html`:

```html
<div id="toast-container"></div>
```

CSS positions it fixed at bottom-right:

```css
#toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  max-width: 360px;
  width: calc(100% - 2rem);
}
```

Toast elements use BEM:

```css
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: 0.875rem;
  opacity: 0;
  transform: translateY(0.5rem);
  transition: opacity 0.2s, transform 0.2s;
}
.toast--visible { opacity: 1; transform: translateY(0); }
.toast--success { border-left: 3px solid var(--color-success); }
.toast--error { border-left: 3px solid var(--color-danger); }
.toast--warning { border-left: 3px solid var(--color-warning); }
.toast--info { border-left: 3px solid var(--color-info); }
```

JavaScript `showToast(type, message)` function:

```javascript
function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__message">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  if (type !== 'error') {
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }
}
```

### 9. Empty State Component

Empty states gain an icon element and use the text-muted token:

```css
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}
.empty-state__icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
}
.empty-state__text {
  font-size: 0.9375rem;
}
```

### 10. Alert Card

The `.dashboard-alerts` section uses surface/border/radius tokens with 1rem padding:

```css
.dashboard-alerts {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin: 0.75rem 1rem;
}
```

### 11. Enrichment Bar & Preview Section

Both retain existing behavior and class names (`.enrichment-bar`, `.preview-section`) but are restyled using design tokens. The enrichment bar keeps its fixed bottom position. The preview section keeps its blue-tinted background but uses token-derived values.

### JavaScript API Surface (unchanged)

All existing global functions remain:
- `openModal(id)` / `closeModal(id)` — toggle `.hidden` class on `.modal-overlay`
- `showLoading(text)` / `hideLoading()` — toggle `.hidden` on `#loadingOverlay`
- `showError(msg)` — error banner
- `setupTabs()` — manages `.active` class on `.tab` and `.tab-panel`

### New JavaScript API

```javascript
/**
 * Display a toast notification.
 * @param {'success'|'error'|'warning'|'info'} type - Toast variant
 * @param {string} message - Display message (plain text, HTML-escaped internally)
 */
function showToast(type, message)
```

### CSS Class Contract with JavaScript

The following classes are used by JavaScript and MUST remain styled correctly:

| Class | JS Usage | Required CSS |
|-------|----------|--------------|
| `.hidden` | Show/hide toggling | `display: none !important` |
| `.active` | Tab panel visibility, tab highlight | `display: block` on panels |
| `.tab` | Tab button selection | Styled as nav tab |
| `.tab-panel` | Content panel toggling | `display: none` / `.active → display: block` |
| `.modal-overlay` | Modal visibility | Fixed overlay |
| `.modal-overlay.hidden` | Modal hidden state | `display: none` |
| `.status-badges` | Badge container (getElementById) | Flex row |
| `.badge` | Status badge rendering | Pill styling |
| `.badge--{status}` | Status color (new BEM) | Status token colors |
| `.status-pill` | Inline status in tables | Pill styling with status colors |
| `.enrichment-bar` | Progress bar visibility | Fixed bottom bar |
| `.preview-section` | Preview section visibility | Card styling |
| `.loading-overlay` | Loading state | Fixed overlay |
| `.settings-tab` / `.settings-panel` | Settings sub-tabs | Same pattern as main tabs |
| `.lead-select` | Checkbox selection | Sized checkbox |
| `.clickable` | Row click indicator | Pointer cursor |
| `.quality-badge` | Website quality display | Colored pill |
| `.category-filter` | Dropdown styling | Form select |

## Data Models

No data model changes. All data flows remain identical — JSON persistence via `server/lib/dataStore.js`, REST API via `server/routes/`, and frontend state in `app.js` global variables.

## Error Handling

- The existing `showError()` function (error banner at top) remains for critical errors.
- The new `showToast()` function provides lighter feedback for non-critical notifications (success confirmations, info messages).
- Error toasts persist until manually dismissed. Success/warning/info toasts auto-dismiss after 4 seconds.

## Accessibility Considerations

1. **ARIA tablist**: Navigation tabs use `role="tablist"`, `role="tab"`, and `aria-selected` attributes.
2. **Focus indicators**: All interactive elements have visible focus rings via `box-shadow` (not just outline) using the primary-light token.
3. **Color contrast**: Token values are chosen from the kaelint-crm system which targets WCAG AA contrast ratios.
4. **Toast announcements**: Toast container uses implicit live region behavior via DOM insertion (visible change).

## Performance Considerations

- No external dependencies added — all CSS is in a single file.
- No build step or preprocessor.
- CSS custom properties are resolved at paint time by the browser with negligible overhead.
- Toast animations use `transform` and `opacity` (GPU-composited properties) for smooth 60fps transitions.

## Testing Strategy

This is a CSS-heavy redesign with minimal JavaScript changes. Testing focuses on verifying visual correctness and functional preservation.

### Unit Tests (Example-based)
- Verify the `showToast()` function creates and removes DOM elements correctly
- Verify toast auto-dismiss timing (success: 4s, error: persists)
- Verify `statusClass()` returns correct BEM modifiers for all 7 statuses

### Property Tests
- Status token completeness: all 7 statuses map to valid CSS tokens and BEM classes
- Toast variant coverage: all 4 variants get distinct left-border styling
- Element ID preservation: all IDs referenced in JS exist in HTML
- Class name preservation: all toggled class names are defined in CSS
- ARIA tab consistency: exactly one tab is aria-selected at any time

### Integration / E2E Tests
- Tab switching still works (clicks toggle `.active` on tabs and panels)
- Modal open/close preserves `.hidden` toggling behavior
- Form submissions still trigger correct API calls
- Enrichment bar and preview section show/hide correctly
- Toast notifications display and auto-dismiss correctly

### Manual Verification
- Visual diff of all pages against the kaelint-crm reference design
- Responsive behavior on narrow viewports (nav scrolling, table overflow)
- Focus ring visibility on keyboard navigation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status tokens completeness

For any lead status in the set {Discovered, Reached Out, Replied, No Response, Meeting Scheduled, Client Won, Lost}, the CSS file SHALL define a corresponding `--status-{slug}-bg` and `--status-{slug}-text` custom property in `:root`, AND a `.badge--{slug}` class that references those tokens.

**Validates: Requirements 1.6, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12**

### Property 2: Toast variant styling

For any toast variant in {success, error, warning, info}, the CSS file SHALL define a `.toast--{variant}` class with a `border-left` color matching the corresponding design token (`--color-success`, `--color-danger`, `--color-warning`, `--color-info` respectively).

**Validates: Requirements 9.2**

### Property 3: JavaScript element ID preservation

For any HTML element ID referenced by `document.getElementById()` or `document.querySelector('#...')` in `app.js`, the restructured `index.html` SHALL contain an element with that exact ID.

**Validates: Requirements 12.1**

### Property 4: JavaScript class name preservation

For any CSS class name used in `classList.add()`, `classList.remove()`, `classList.toggle()`, or `querySelector('.')` calls in `app.js`, the rewritten CSS SHALL define a rule for that class that preserves the expected visual behavior (show/hide, active state, etc.).

**Validates: Requirements 12.2, 12.3**

### Property 5: ARIA tab state consistency

For any set of tab buttons within a `role="tablist"` container, exactly one tab SHALL have `aria-selected="true"` at any point in time, and it SHALL be the same tab that has the `.active` CSS class.

**Validates: Requirements 3.2**

### Property 6: Toast auto-dismiss behavior

For any toast of type other than 'error', calling `showToast(type, message)` SHALL result in the toast element being removed from the DOM within 4200ms (4000ms timeout + 200ms exit animation). For any toast of type 'error', the toast SHALL remain in the DOM indefinitely until the close button is clicked.

**Validates: Requirements 9.4, 9.5**
