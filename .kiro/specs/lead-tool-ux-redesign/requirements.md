# Requirements Document

## Introduction

A full CSS rewrite of the Lead Generation CRM frontend to adopt the kaelint-crm design system. This involves replacing all existing styles with a design-token-based approach using CSS custom properties, implementing BEM naming conventions, and adding new UI patterns (toast notifications, badge pills, empty states) — all without changing any JavaScript functionality or application behavior.

## Glossary

- **Lead_Tool**: The Lead Generation CRM frontend application served at `public/index.html`
- **Design_Token_Layer**: The CSS custom properties defined in the `:root` block that control all visual values (colors, radii, shadows, fonts, spacing)
- **App_Shell**: The top-level layout structure consisting of header, badge row, alert card, navigation, and main content area
- **Toast_System**: The notification component that displays transient success/error/warning/info messages in a fixed position
- **Badge_Row**: The horizontal strip of status count pills displayed below the header
- **Alert_Card**: The collapsible dashboard alert section showing follow-ups due and replies to check
- **Nav_Component**: The semantic `<nav>` element with ARIA tablist role providing tab-based navigation
- **Table_Component**: The styled data table with uppercase headers, letter-spacing, and hover-highlighted clickable rows
- **Modal_Component**: The overlay dialog with darkened backdrop and card-style content panel
- **Form_Component**: The styled form inputs with focus rings using box-shadow and form-group spacing pattern
- **Badge_Component**: A pill-shaped inline element displaying a lead status with semantic color token
- **Empty_State_Component**: A centered placeholder shown when a table has no data, featuring an icon and descriptive text
- **Button_Component**: BEM-structured buttons with variants for primary, secondary, danger, and small sizing

## Requirements

### Requirement 1: Design Token Layer

**User Story:** As a developer, I want all visual values defined as CSS custom properties in `:root`, so that the entire theme can be adjusted from a single location without hunting through scattered rules.

#### Acceptance Criteria

1. THE Design_Token_Layer SHALL define color tokens for primary, primary-hover, primary-light, success, success-light, warning, warning-light, danger, danger-light, info, info-light, background, surface, border, border-strong, text, text-secondary, and text-muted.
2. THE Design_Token_Layer SHALL define radius tokens for small (4px), medium (8px), and large (12px) values.
3. THE Design_Token_Layer SHALL define shadow tokens for small, medium, and large elevation levels.
4. THE Design_Token_Layer SHALL define font-family tokens for sans-serif and monospace stacks using system fonts.
5. THE Design_Token_Layer SHALL define layout tokens for header-height (56px), nav-height (48px), and content-max-width (1200px).
6. THE Design_Token_Layer SHALL define status-specific color tokens for all 7 lead statuses: discovered, reached-out, replied, no-response, meeting-scheduled, client-won, and lost.

### Requirement 2: App Shell Layout

**User Story:** As a user, I want a consistent page structure with clear visual hierarchy, so that I can quickly orient myself within the application.

#### Acceptance Criteria

1. THE App_Shell SHALL render sections in the order: header, Badge_Row, Alert_Card, Nav_Component, main content area.
2. THE App_Shell SHALL constrain the main content area to a maximum width of 1200px with auto horizontal margins.
3. THE App_Shell SHALL apply a sticky position to the header with a z-index ensuring the header remains above all scrollable content.
4. THE App_Shell SHALL set the body background to the background design token and text color to the text design token.
5. THE App_Shell SHALL use flexbox column layout for the full viewport height.

### Requirement 3: Navigation Component

**User Story:** As a user relying on assistive technology, I want the tab navigation to use proper ARIA roles, so that screen readers can identify and announce the navigation structure.

#### Acceptance Criteria

1. THE Nav_Component SHALL use a `<nav>` element containing a list with `role="tablist"` on the tab container.
2. THE Nav_Component SHALL apply `role="tab"` to each tab button and `aria-selected="true"` to the active tab.
3. THE Nav_Component SHALL style the active tab with the primary color token for text and a 2px bottom border in the primary color.
4. THE Nav_Component SHALL style inactive tabs with the text-secondary color token and a transparent bottom border.
5. WHEN a tab is hovered, THE Nav_Component SHALL transition the text color to the text token.
6. THE Nav_Component SHALL allow horizontal overflow scrolling on narrow viewports without showing a scrollbar.

### Requirement 4: Button Component

**User Story:** As a user, I want visually distinct button styles for different actions, so that I can quickly identify primary actions, secondary options, and destructive operations.

#### Acceptance Criteria

1. THE Button_Component SHALL use BEM class naming: `.btn` base, `.btn--primary`, `.btn--secondary`, `.btn--danger`, `.btn--sm`.
2. THE Button_Component SHALL style the primary variant with the primary color token as background and white text.
3. THE Button_Component SHALL style the secondary variant with the surface color token as background, text color token, and border-strong token border.
4. THE Button_Component SHALL style the danger variant with the danger color token as background and white text.
5. THE Button_Component SHALL style the small variant with reduced padding (0.375rem 0.75rem) and font-size (0.8125rem).
6. THE Button_Component SHALL apply border-radius using the medium radius token.
7. THE Button_Component SHALL display an inline-flex layout with centered content and 0.5rem gap for icon+text pairs.
8. WHEN a button is disabled, THE Button_Component SHALL reduce opacity to 0.5 and set cursor to not-allowed.

### Requirement 5: Table Component

**User Story:** As a user, I want clearly structured data tables, so that I can scan rows and columns efficiently.

#### Acceptance Criteria

1. THE Table_Component SHALL style table headers with uppercase text-transform, 0.025em letter-spacing, and the text-secondary color token.
2. THE Table_Component SHALL apply the background token as the header row background color.
3. THE Table_Component SHALL apply a 1px bottom border using the border token on all table cells.
4. WHEN a table row has the clickable class, THE Table_Component SHALL display a pointer cursor.
5. WHEN a clickable table row is hovered, THE Table_Component SHALL apply the primary-light color token as the row background.
6. THE Table_Component SHALL wrap tables in an overflow-x auto container for horizontal scroll on narrow viewports.

### Requirement 6: Modal Component

**User Story:** As a user, I want modals to feel visually grounded and clearly separated from the page content, so that I can focus on the modal task without distraction.

#### Acceptance Criteria

1. THE Modal_Component SHALL render a fixed overlay with `rgba(0, 0, 0, 0.5)` background covering the full viewport.
2. THE Modal_Component SHALL center the modal content card using flexbox alignment.
3. THE Modal_Component SHALL style the modal content card with the surface token background, border token border (1px solid), medium radius token border-radius, and large shadow token box-shadow.
4. THE Modal_Component SHALL constrain the modal card to 90% viewport width with a max-width of 600px for standard modals and 700px for wide modals.
5. THE Modal_Component SHALL allow vertical scrolling within the modal content when content exceeds 90vh.
6. THE Modal_Component SHALL set z-index to 10000 to render above all other interface elements.

### Requirement 7: Form Component

**User Story:** As a user, I want form fields with clear focus indicators, so that I always know which field I am currently editing.

#### Acceptance Criteria

1. THE Form_Component SHALL use a `.form-group` class with 1rem bottom margin for field spacing.
2. THE Form_Component SHALL style labels with font-size 0.875rem, font-weight 500, and the text-secondary color token.
3. THE Form_Component SHALL style inputs, selects, and textareas with the border-strong token border, medium radius token border-radius, and 0.5rem 0.75rem padding.
4. WHEN an input receives focus, THE Form_Component SHALL remove the default outline and apply a box-shadow of `0 0 0 3px` using the primary-light color token and set the border color to the primary token.
5. THE Form_Component SHALL style textareas with a minimum height of 80px and vertical resize only.

### Requirement 8: Badge Component

**User Story:** As a user, I want status badges styled as colored pills with distinct colors per status, so that I can identify lead counts and statuses at a glance.

#### Acceptance Criteria

1. THE Badge_Component SHALL use BEM class naming: `.badge` base with status modifiers `.badge--discovered`, `.badge--reached-out`, `.badge--replied`, `.badge--no-response`, `.badge--meeting-scheduled`, `.badge--client-won`, `.badge--lost`.
2. THE Badge_Component SHALL render as a pill shape using `border-radius: 9999px`.
3. THE Badge_Component SHALL apply padding of `0.125rem 0.5rem` with font-size 0.75rem and font-weight 500.
4. THE Badge_Component SHALL use inline-flex display with centered alignment.
5. WHILE the Badge_Row is displayed, THE Lead_Tool SHALL render all status badges as a flex-wrap row with 0.5rem gap below the header.
6. THE Badge_Component SHALL apply the discovered status token (grey background, dark text) to the `.badge--discovered` modifier.
7. THE Badge_Component SHALL apply the reached-out status token (blue-light background, blue text) to the `.badge--reached-out` modifier.
8. THE Badge_Component SHALL apply the replied status token (purple-light background, purple text) to the `.badge--replied` modifier.
9. THE Badge_Component SHALL apply the no-response status token (yellow-light background, amber text) to the `.badge--no-response` modifier.
10. THE Badge_Component SHALL apply the meeting-scheduled status token (green-light background, green text) to the `.badge--meeting-scheduled` modifier.
11. THE Badge_Component SHALL apply the client-won status token (dark-green background, white text) to the `.badge--client-won` modifier.
12. THE Badge_Component SHALL apply the lost status token (red-light background, red text) to the `.badge--lost` modifier.

### Requirement 9: Toast Notification System

**User Story:** As a user, I want non-intrusive notifications for action feedback, so that I am informed of success or failure without losing my current context.

#### Acceptance Criteria

1. THE Toast_System SHALL render notifications in a fixed container at the bottom-right of the viewport with z-index 9999.
2. THE Toast_System SHALL support four variants: success, error, warning, and info, each with a distinct left-border color using the corresponding design token.
3. THE Toast_System SHALL style each toast with the surface token background, border token border, medium radius token border-radius, and medium shadow token box-shadow.
4. WHEN a success toast is displayed, THE Toast_System SHALL auto-dismiss the toast after 4 seconds.
5. WHEN an error toast is displayed, THE Toast_System SHALL persist the toast until the user manually dismisses the toast via a close button.
6. THE Toast_System SHALL animate entry with a translateY(0.5rem) to translateY(0) transition over 200ms with opacity 0 to 1.
7. THE Toast_System SHALL animate exit with opacity 1 to 0 and translateY(0.5rem) over 200ms before removing the element.
8. THE Toast_System SHALL stack multiple toasts vertically with 0.5rem gap in column-reverse order (newest at bottom).
9. THE Toast_System SHALL constrain toast width to a maximum of 360px.

### Requirement 10: Empty State Component

**User Story:** As a user, I want a clear visual indication when a list has no data, so that I understand the section is empty and know what action to take next.

#### Acceptance Criteria

1. THE Empty_State_Component SHALL center content both horizontally and vertically within its container with 3rem vertical padding.
2. THE Empty_State_Component SHALL display an icon element at 2.5rem font-size with 0.75rem bottom margin.
3. THE Empty_State_Component SHALL display descriptive text at 0.9375rem font-size using the text-muted color token.
4. THE Empty_State_Component SHALL use the text-muted color token for the icon element.

### Requirement 11: Dashboard Alert Card

**User Story:** As a user, I want dashboard alerts displayed as a collapsible card, so that I can see urgent follow-ups without them permanently consuming screen space.

#### Acceptance Criteria

1. THE Alert_Card SHALL render below the Badge_Row and above the Nav_Component in the App_Shell layout order.
2. THE Alert_Card SHALL use the surface token background, border token border, and medium radius token border-radius.
3. THE Alert_Card SHALL apply 1rem padding and 1rem horizontal margin matching the main content alignment.
4. WHEN the Alert_Card contains no active alerts, THE Lead_Tool SHALL hide the Alert_Card using the `hidden` attribute.

### Requirement 12: No Functionality Changes

**User Story:** As a user, I want the restyled application to behave identically to the current version, so that my workflow is uninterrupted by the visual update.

#### Acceptance Criteria

1. THE Lead_Tool SHALL preserve all existing HTML element IDs and data attributes used by JavaScript.
2. THE Lead_Tool SHALL preserve all existing CSS class names referenced by JavaScript for show/hide toggling.
3. THE Lead_Tool SHALL preserve the `.hidden` utility class with `display: none !important` behavior.
4. THE Lead_Tool SHALL preserve all existing interactive behaviors including tab switching, modal opening/closing, form submission, and table row clicking.
5. THE Lead_Tool SHALL introduce no build step, preprocessor, or external CSS dependency.
