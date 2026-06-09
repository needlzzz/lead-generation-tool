# Requirements Document

## Introduction

Automated demo website generation system for cold outreach. After the lead-generation-tool analyzes a business's website, the system generates a preview/demo website showing what the lead's new site could look like — built using the kaelint-website-business Astro template system. The preview is deployed to `preview.kaelint.ch/{slug}/` and included in outreach emails as a screenshot and live link.

This feature spans two repositories:
- **lead-generation-tool** — orchestration, config generation, screenshot capture, email integration
- **kaelint-website-business** — build pipeline, deploy script, preview assets

## Glossary

- **Preview_Generator**: The module in lead-generation-tool that generates a config.yaml from lead data and orchestrates the full preview lifecycle
- **Config_Generator**: The sub-module responsible for mapping lead data fields to a valid kaelint-website-business config.yaml
- **Build_Script**: The `scripts/build-preview.mjs` script in kaelint-website-business that builds a single preview site from a config.yaml
- **Deploy_Script**: The `scripts/deploy-previews.mjs` script in kaelint-website-business that deploys all non-expired preview sites to Cloudflare Pages
- **Screenshot_Capturer**: The module in lead-generation-tool that uses Playwright to capture the hero section of a built preview
- **Preview_Registry**: The JSON file in lead-generation-tool tracking all generated previews (slug, leadId, createdAt, expiresAt, status)
- **Preset_Map**: The mapping from business category to theme, colors, and features (derived from onboarding presets)
- **Niche_Assets**: Generic placeholder images per business niche committed to git in kaelint-website-business
- **Slug**: The URL-safe identifier for a preview in format `{uuid-prefix}-{business-name-slugified}`
- **Lead**: A business record in lead-generation-tool containing businessName, category, address, phone, websiteUrl, and analysis results
- **Orchestrator**: The Express API endpoint in lead-generation-tool that coordinates the full preview generation pipeline

## Requirements

### Requirement 1: Config Generation from Lead Data

**User Story:** As the operator, I want the system to automatically generate a valid config.yaml from lead data, so that each preview site is personalized to the target business.

#### Acceptance Criteria

1. WHEN lead data containing businessName, category, city, address, and phone is provided, THE Config_Generator SHALL produce a YAML string that passes the kaelint-website-business Zod schema validation
2. WHEN a lead has a recognized category (coiffeur, restaurant, therapie, handwerk, einzelhandel, fitness, kreativ, arztpraxis), THE Config_Generator SHALL select the theme, primaryColor, and features from the corresponding Preset_Map entry
3. WHEN a lead has a category that does not match any preset OR when the category recognition logic fails for any reason, THE Config_Generator SHALL fall back to the "slate-professional" theme with neutral colors and generic features (contactForm, openingHours, clickToCall) — the system SHALL always produce a valid config rather than failing
4. THE Config_Generator SHALL populate the businessName, operatorName (from lead.contactPerson or businessName), contactEmail, phone, and address fields from lead data. WHEN a lead has no email, THE Config_Generator SHALL use a placeholder email (`preview@kaelint.ch`). WHEN a lead has no phone number, THE Config_Generator SHALL use a placeholder phone number (`+41 00 000 00 00`) and disable the clickToCall feature.
5. THE Config_Generator SHALL derive secondaryColor (15% primaryColor + 85% white), accentColor (same as primaryColor), and fontFamily from the Preset_Map entry — following the same derivation logic as the onboarding form's `color-derivation.js` and `theme-map.js`
6. THE Config_Generator SHALL generate German-only content (languages: [de]) with a niche-appropriate tagline, aboutText, and service list derived from the Preset_Map. All text content SHALL use LocalizedText format (`{ de: "..." }`)
7. THE Config_Generator SHALL set the logoPath to the niche placeholder logo filename (referencing its location after build-time copy to `src/assets/images/`, e.g., `"logo.svg"`)
8. THE Config_Generator SHALL set features.contactForm to true and set ctaTarget to "#contactForm" for all generated configs
9. THE Config_Generator SHALL only enable features that either (a) require no additional config data (contactForm, clickToCall, googleMaps, scheduling), OR (b) have their required data generated from the Preset_Map and Niche_Assets (openingHours from preset, gallery from niche images, services from preset services list). Features requiring user-specific data (testimonials, events, faq) SHALL NOT be enabled.
10. WHEN features requiring config data are enabled (gallery, openingHours, services, priceList), THE Config_Generator SHALL produce the corresponding config objects using Niche_Assets paths (for gallery) and Preset_Map data (for services/openingHours/priceList)

### Requirement 2: Preview Build Pipeline

**User Story:** As the operator, I want the kaelint-website-business repo to build a single preview site from a config.yaml, so that I can generate demo sites without affecting production client builds.

#### Acceptance Criteria

1. WHEN the Build_Script receives a config.yaml path and a slug, THE Build_Script SHALL run an Astro build with SITE_CONFIG pointing to the config and output to `dist/previews/{slug}/`
2. THE Build_Script SHALL copy the appropriate Niche_Assets into `src/assets/images/` before building and clean them up after (following the build-demo.mjs pattern)
3. THE Build_Script SHALL set the DEMO_BASE environment variable to `/{slug}/` so all asset paths are correctly prefixed for the preview URL at `preview.kaelint.ch/{slug}/`
4. IF the Astro build fails OR times out (exceeds 60 seconds) OR is interrupted, THEN THE Build_Script SHALL exit with a non-zero code and print the build error to stderr
5. THE Build_Script SHALL complete a preview build within 60 seconds for a typical configuration; IF the build exceeds this timeout, THEN it SHALL be terminated and treated as a failure
6. THE Build_Script SHALL accept a --niche flag to determine which Niche_Assets directory to use for placeholder images

### Requirement 3: Preview Deployment

**User Story:** As the operator, I want all active previews to be deployed atomically to Cloudflare Pages, so that leads can access their personalized demo site via a stable URL.

#### Acceptance Criteria

1. WHEN the Deploy_Script is executed, THE Deploy_Script SHALL collect all non-expired preview directories from `dist/previews/` and deploy the contents of `dist/previews/` as the root of the "kaelint-previews" Cloudflare Pages project (so each `{slug}/` directory maps directly to `preview.kaelint.ch/{slug}/`)
2. THE Deploy_Script SHALL deploy all previews in a single atomic wrangler pages deploy command (not one deploy per preview)
3. WHEN a preview's expiresAt date has passed, THE Deploy_Script SHALL exclude that preview directory from the deploy output
4. THE Deploy_Script SHALL make each preview accessible at `https://preview.kaelint.ch/{slug}/`
5. IF the wrangler deploy fails, THEN THE Deploy_Script SHALL exit with a non-zero code and report the error
6. THE Deploy_Script SHALL read a `previews-manifest.json` file (located at `previews/previews-manifest.json` in the kaelint-website-business repo) to determine which previews are active and their expiry dates
7. IF the previews-manifest.json file is missing or contains invalid JSON, THEN THE Deploy_Script SHALL exit with a non-zero code and report the error
8. THE Deploy_Script SHALL delete the directories of expired previews from `dist/previews/` after a successful deploy to prevent unbounded disk growth

### Requirement 4: Screenshot Capture

**User Story:** As the operator, I want the system to capture a screenshot of the preview site's hero section, so that I can include a visual teaser in the outreach email.

#### Acceptance Criteria

1. WHEN a preview site has been built, THE Screenshot_Capturer SHALL open the built HTML files locally using Playwright and capture the hero section
2. THE Screenshot_Capturer SHALL produce a PNG image of the viewport (1280×800px) showing the above-the-fold content of the preview site
3. THE Screenshot_Capturer SHALL save the screenshot to `server/data/previews/{slug}/screenshot.png`
4. IF the screenshot capture fails (timeout, rendering error), THEN THE Screenshot_Capturer SHALL log the error and mark the preview status as "failed" with a `screenshotError` note in the Preview_Registry without blocking the deployment — the preview SHALL still be deployed without a screenshot, and the email SHALL omit the [Preview-Screenshot] placeholder gracefully
5. THE Screenshot_Capturer SHALL wait for all CSS and fonts to load before capturing (networkidle or a maximum 10-second timeout)

### Requirement 5: Slug Generation and Uniqueness

**User Story:** As the operator, I want each preview to have an unguessable URL that also contains the business name for readability, so that previews are secure without requiring authentication.

#### Acceptance Criteria

1. THE Preview_Generator SHALL generate slugs in the format `{8-char-uuid-prefix}-{business-name-slugified}` (e.g., "a7f3b92e-coiffeur-mueller-bern")
2. THE Preview_Generator SHALL slugify the business name by lowercasing, replacing umlauts (ä→ae, ö→oe, ü→ue), removing non-alphanumeric characters (except hyphens), and collapsing consecutive hyphens
3. THE Preview_Generator SHALL append the city (slugified) to the business name in the slug for disambiguation
4. THE Preview_Generator SHALL truncate the total slug length to a maximum of 80 characters
5. THE Preview_Generator SHALL verify that the generated slug does not already exist in the Preview_Registry before proceeding; IF a collision occurs, THE Preview_Generator SHALL regenerate with a new UUID prefix (up to 3 attempts) before failing

### Requirement 6: Preview Lifecycle Management

**User Story:** As the operator, I want previews to expire automatically after 30 days, so that hosting costs remain minimal and stale previews are cleaned up.

#### Acceptance Criteria

1. WHEN a preview is created, THE Preview_Generator SHALL record createdAt (ISO timestamp) and expiresAt (createdAt + 30 days) in the Preview_Registry
2. WHILE a preview's expiresAt date is in the future, THE Deploy_Script SHALL include it in deployments
3. WHEN a preview's expiresAt date has passed, THE Deploy_Script SHALL omit it from the next deployment (effectively removing it from the live site)
4. THE Preview_Registry SHALL store for each preview: slug, leadId, niche, createdAt, expiresAt, status (pending, built, deployed, expired, failed), screenshotPath, screenshotError (string or null), previewUrl, and leadDataHash (hash of businessName+category+city used to detect changes)
5. WHEN the Deploy_Script removes an expired preview from deployment, THE Preview_Registry SHALL update the status to "expired" atomically with the deploy operation; IF the status update fails, THE system SHALL retry on the next deploy cycle

### Requirement 7: API Endpoint for Preview Generation

**User Story:** As the operator, I want a single API endpoint that orchestrates the entire preview generation pipeline, so that I can trigger preview creation from the CRM UI.

#### Acceptance Criteria

1. WHEN a POST request to `/api/previews/generate` is received with a valid leadId, THE Orchestrator SHALL execute the full pipeline: config generation → build → screenshot → deploy
2. THE Orchestrator SHALL use SSE (Server-Sent Events) to stream progress updates (config_generated, build_started, build_complete, screenshot_captured, deploy_started, deploy_complete)
3. IF the lead does not have websiteAnalyzedAt set, THEN THE Orchestrator SHALL return a 400 error with message "Lead must be analyzed before preview generation"
4. IF a preview already exists for the given leadId with status "deployed" and not expired, THEN THE Orchestrator SHALL compare a hash of the current lead data (businessName + category + city) against the stored `leadDataHash` in the Preview_Registry; IF the hash differs, THE Orchestrator SHALL regenerate; IF unchanged, THE Orchestrator SHALL return the existing preview data without regenerating
5. THE Orchestrator SHALL save the preview URL and screenshot path to the lead record in leads.json (fields: previewUrl, previewScreenshotPath, previewGeneratedAt)
6. IF any pipeline step fails, THEN THE Orchestrator SHALL update the Preview_Registry status to "failed", log the error, and send an SSE error event with a human-readable message

### Requirement 8: Email Template Integration

**User Story:** As the operator, I want new email placeholders for the preview link and screenshot, so that outreach emails can showcase the personalized demo website.

#### Acceptance Criteria

1. THE emailService SHALL support a `[Preview-Link]` placeholder that resolves to the full preview URL (e.g., "https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/de/")
2. THE emailService SHALL support a `[Preview-Screenshot]` placeholder that resolves to the full public URL of the screenshot image hosted at the preview domain (e.g., "https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/screenshot.png") — since emails are plain text, this is a URL the recipient can open; the screenshot file SHALL be included in the deploy output alongside the preview site
3. WHEN a lead does not have a previewUrl, THE emailService SHALL replace `[Preview-Link]` with an empty string
4. WHEN a lead does not have a previewScreenshotPath, THE emailService SHALL replace `[Preview-Screenshot]` with an empty string
5. THE emailService SHALL support a `[Preview-Ablauf]` placeholder that resolves to the formatted expiry date in German (e.g., "15. Juli 2026") for use in the email body

### Requirement 9: Niche Placeholder Assets

**User Story:** As the operator, I want generic placeholder images per business niche committed to the kaelint-website-business repo, so that preview sites look professional without requiring custom photos.

#### Acceptance Criteria

1. THE kaelint-website-business repo SHALL contain a `previews/assets/{niche}/` directory for each supported niche (coiffeur, restaurant, therapie, handwerk, einzelhandel, fitness, kreativ, arztpraxis)
2. EACH niche asset directory SHALL contain at minimum: a logo placeholder (SVG), 3 gallery images (JPEG, minimum 800×600px), and 2 team photos (JPEG, minimum 400×400px)
3. THE niche asset images SHALL be generic enough to not misrepresent any specific business (no real faces, no real brand logos)
4. THE Build_Script SHALL resolve the niche from the config or from a CLI flag and copy the corresponding niche assets before building

### Requirement 10: Error Handling and Resilience

**User Story:** As the operator, I want the system to handle failures gracefully at each pipeline step, so that a single failure does not corrupt the preview registry or block other operations.

#### Acceptance Criteria

1. IF the Config_Generator receives a lead with missing required fields (businessName, category), THEN THE Config_Generator SHALL return a descriptive error without writing any files
2. IF the Build_Script fails, THEN THE Orchestrator SHALL mark the preview status as "failed" in the Preview_Registry and not attempt screenshot or deploy
3. IF the Deploy_Script fails, THEN THE Orchestrator SHALL mark the preview status as "built" (preserving the build artifacts) and report the deploy error
4. IF Playwright is not installed or fails to launch, THEN THE Screenshot_Capturer SHALL return a clear error message ("Playwright/Chromium is not installed. Run npx playwright install chromium first.")
5. THE Orchestrator SHALL never hold file locks or leave partial state if the process is interrupted — config generation and registry updates SHALL use atomic write patterns (write to temp file then rename)

### Requirement 11: Cross-Repo Communication

**User Story:** As a developer, I want a clear interface between the two repositories, so that the lead-generation-tool can invoke kaelint-website-business scripts without tight coupling.

#### Acceptance Criteria

1. THE lead-generation-tool SHALL invoke the Build_Script via child process execution (execSync/spawn) with the kaelint-website-business repo path configurable in settings.json
2. THE lead-generation-tool settings SHALL include a `previewSiteRepoPath` field pointing to the local kaelint-website-business checkout (e.g., "/Users/tabkamac/private/dev/git/kaelint-website-business")
3. THE Config_Generator SHALL write the generated config.yaml to a file inside the kaelint-website-business repo at `previews/configs/{slug}/config.yaml`
4. THE Build_Script SHALL accept the config path and slug as CLI arguments: `node scripts/build-preview.mjs --config <path> --slug <slug> --niche <niche>`
5. THE Deploy_Script SHALL be independently executable: `node scripts/deploy-previews.mjs` (reads previews-manifest.json, deploys all active previews)
6. THE Orchestrator SHALL write/update `previews/previews-manifest.json` inside kaelint-website-business after each successful build, adding the new preview entry and preserving existing active entries from the Preview_Registry
7. Build artifacts in `dist/previews/{slug}/` SHALL persist across multiple build invocations (each build adds one slug's output to the directory without removing others). The Deploy_Script deploys the full `dist/previews/` directory atomically.
8. THE Orchestrator SHALL also copy the screenshot PNG to `dist/previews/{slug}/screenshot.png` inside kaelint-website-business before triggering deploy, so it is served alongside the preview site

### Requirement 12: Unit Testing

**User Story:** As a developer, I want automated unit tests covering the config generation logic and the preview lifecycle, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE Config_Generator SHALL have unit tests (Jest) verifying: valid output for each preset niche, fallback behavior for unknown categories, correct field mapping from lead data, and Zod schema compliance
2. THE slug generation logic SHALL have unit tests covering: umlaut replacement, special character removal, length truncation, uniqueness check, and format compliance
3. THE Preview_Registry SHALL have unit tests verifying: creation with correct timestamps, status transitions, expiry calculation, and atomic file writes
4. THE Build_Script SHALL have a smoke test (vitest) that builds a preview from a known-good config and verifies the output directory structure
5. THE email placeholder integration SHALL have unit tests verifying: correct replacement when preview exists, empty replacement when preview is missing, and date formatting for [Preview-Ablauf]

### Requirement 13: Regression Testing

**User Story:** As a developer, I want all existing tests in both repositories to continue passing after this feature is implemented, so that existing functionality is not broken.

#### Acceptance Criteria

1. ALL existing Jest tests in lead-generation-tool (pipeline, dataStore, emailService, csvService, websiteAnalyzer) SHALL continue to pass without modification
2. ALL existing vitest tests in kaelint-website-business SHALL continue to pass without modification
3. ALL existing Playwright E2E tests in kaelint-website-business (admin/tests/) SHALL continue to pass without modification
4. THE existing `npm run build:demo` command in kaelint-website-business SHALL continue to build all demos successfully (no regressions in shared build infrastructure)
5. THE existing email send flow in lead-generation-tool SHALL continue to work for leads without preview data (new placeholders resolve to empty strings gracefully)

### Requirement 14: UI Integration and Testing

**User Story:** As the operator, I want a "Generate Preview" button in the lead detail view, so that I can trigger preview generation directly from the CRM interface with visual progress feedback.

#### Acceptance Criteria

1. WHEN a lead has websiteAnalyzedAt set and status is "Discovered" or "Reached Out", THE lead-generation-tool frontend SHALL display a "🎨 Generate Preview" button in the lead detail modal
2. WHEN the "Generate Preview" button is clicked, THE frontend SHALL show a progress indicator with step-by-step status updates (received via SSE from the Orchestrator)
3. WHEN preview generation completes successfully, THE frontend SHALL display the preview URL as a clickable link and the screenshot as a thumbnail in the lead detail modal
4. WHEN a lead already has a valid (non-expired) preview, THE frontend SHALL display the existing preview link and screenshot instead of the "Generate Preview" button; WHEN the lead detail modal is opened and the preview's expiresAt date has passed, THE frontend SHALL show the "Generate Preview" button (checked on each page load/data refresh, not real-time)
5. WHEN preview generation fails, THE frontend SHALL display a human-readable error message with a "Retry" button; IF the generation completes but produces an invalid preview (no output files), THE frontend SHALL display the same error state
6. THE frontend SHALL disable the "Generate Preview" button while a generation is in progress (prevents duplicate requests)

