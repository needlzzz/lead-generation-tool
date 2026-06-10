# Implementation Plan: Preview Site Generation

## Overview

Automated demo website generation system for cold outreach. The implementation spans two repos (lead-generation-tool and kaelint-website-business) and follows a bottom-up approach: pure utility modules first, then orchestration, then UI/integration.

## Tasks

- [x] 1. Implement slug generator module (`server/lib/slugGenerator.js`) with umlaut replacement, UUID prefix generation, city append, 80-char truncation, uniqueness retry (up to 3 attempts), and `computeLeadDataHash`. Write Jest tests covering format regex, umlauts, special chars, truncation, consecutive hyphens, and hash computation. #requirements(5.1, 5.2, 5.3, 5.4, 5.5, 12.2)
- [x] 2. Implement preview registry module (`server/lib/previewRegistry.js`) with JSON persistence at `server/data/previews.json`, CRUD operations (createPreview, updateStatus, getByLeadId, getActiveEntries, markExpired), valid status transitions (pending→built→deployed→expired, any→failed), 30-day expiry calculation, and atomic write pattern (temp+rename). Write Jest tests. #requirements(6.1, 6.2, 6.3, 6.4, 6.5, 10.5, 12.3)
- [x] 3. Implement config generator module (`server/lib/configGenerator.js`) with PRESET_MAP for 8 niches, FALLBACK_PRESET (slate-professional), THEME_FONT_MAP, `deriveColors(primaryHex)` for secondary/accent, `generateConfig(lead, slug)` producing full config object with LocalizedText format, feature safety (no testimonials/events/faq), gallery from niche paths, placeholder email/phone handling. Write Jest tests for each niche, fallback, color derivation, feature filtering. #requirements(1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 10.1, 12.1)
- [x] 4. Create niche placeholder assets in kaelint-website-business at `previews/assets/{niche}/` for all 8 niches plus generic fallback. Each directory: logo.svg, gallery/ (3 JPEGs ≥800×600), team/ (2 JPEGs ≥400×400). Use Sharp to generate abstract/geometric placeholders. Add to .gitignore exception. #requirements(9.1, 9.2, 9.3, 9.4)
- [x] 5. Implement build-preview.mjs script in kaelint-website-business (`scripts/build-preview.mjs`). Parse CLI args (--config, --slug, --niche), copy niche assets to src/assets/images/, set SITE_CONFIG and DEMO_BASE=/{slug}/, run astro build with 60s timeout, cleanup assets in finally block. Add npm script. #requirements(2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.4)
- [x] 6. Implement deploy-previews.mjs script in kaelint-website-business (`scripts/deploy-previews.mjs`). Read previews-manifest.json, filter active (non-expired) entries, delete expired dirs from dist/previews/, run wrangler pages deploy dist/previews/ --project-name=kaelint-previews. Handle missing/invalid manifest. Add npm script. #requirements(3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 11.5)
- [x] 7. Implement screenshot capturer module (`server/lib/screenshotCapturer.js`). Launch Playwright, navigate to file:// built HTML (dist/previews/{slug}/de/index.html), viewport 1280×800, wait networkidle (max 10s), capture PNG, save to server/data/previews/{slug}/screenshot.png using temp+rename. Return success/failure object. Handle Playwright missing gracefully. #requirements(4.1, 4.2, 4.3, 4.4, 4.5, 10.4)
- [x] 8. Implement preview generator orchestrator (`server/lib/previewGenerator.js`). Full pipeline: validate lead → check existing preview (hash comparison) → generate slug → create registry entry → write config.yaml → spawn build-preview.mjs → capture screenshot → copy screenshot to dist → write previews-manifest.json → spawn deploy-previews.mjs → update registry/lead record. Stream SSE events at each step. Handle failures per step (build failure stops pipeline, screenshot failure continues). #requirements(7.1, 7.2, 7.4, 7.5, 7.6, 10.2, 10.3, 11.1, 11.3, 11.6, 11.7, 11.8)
- [x] 9. Implement API route (`server/routes/previews.js`) with POST /api/previews/generate (SSE endpoint, validates leadId and websiteAnalyzedAt) and GET /api/previews/:leadId (returns preview state). Register in server/index.js. Add previewSiteRepoPath to settings defaults. #requirements(7.1, 7.2, 7.3, 11.2)
- [x] 10. Extend email service with preview placeholders. Add [Preview-Link], [Preview-Screenshot] (public URL at preview.kaelint.ch/{slug}/screenshot.png), and [Preview-Ablauf] (German formatted expiry date) to renderTemplate. Implement formatGermanDate helper. Write Jest tests for all new placeholders with and without data. #requirements(8.1, 8.2, 8.3, 8.4, 8.5, 12.5, 13.5)
- [x] 11. Implement frontend UI integration. Add "🎨 Generate Preview" button to lead detail modal (conditional on websiteAnalyzedAt + status). SSE progress display, success state (link + thumbnail), error state with retry, expiry check on page load. Disable button during generation. #requirements(14.1, 14.2, 14.3, 14.4, 14.5, 14.6)
- [x] 12. Set up Cloudflare Pages project. Create "kaelint-previews" project, configure preview.kaelint.ch custom domain, verify DNS/SSL, test deploy with minimal file. Document in kaelint-website-business docs. #requirements(3.4)
- [x] 13. Add property-based tests (fast-check). Install fast-check, create tests/preview.property.js with 8 properties: config validity, color derivation math, slug format/no-consecutive-hyphens, fallback validity, expiry correctness, email placeholder degradation, feature safety. #requirements(12.1, 12.2, 12.5)
- [x] 14. Run regression tests and update documentation. Verify all existing Jest/vitest/Playwright tests pass. Test email without preview data. Update steering files and CLAUDE.md in both repos. Add previews/configs/ and dist/previews/ to kaelint-website-business .gitignore. #requirements(13.1, 13.2, 13.3, 13.4, 13.5)

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": [1, 2, 3, 4, 12]},
    {"tasks": [5, 6, 7]},
    {"tasks": [8, 10]},
    {"tasks": [9, 13]},
    {"tasks": [11]},
    {"tasks": [14]}
  ]
}
```

Tasks 1-3 are pure logic modules with no external dependencies. Task 4 (niche assets) and 12 (CF Pages setup) are infrastructure. Wave 2 depends on wave 1 (build script needs assets, deploy script is standalone). The orchestrator (task 8) integrates modules from waves 1-2. API route and property tests depend on the orchestrator. Frontend is last. Regression/docs close it out.

## Notes

- Tasks 1-3 are pure logic modules with no external dependencies — implement and test first
- Task 4 (niche assets) is a manual/creative task that blocks the build script (task 5)
- Task 12 (Cloudflare setup) is infrastructure and can be done in parallel with code tasks
- The orchestrator (task 8) is the most complex task — it integrates all other modules
- Both repos need changes: tasks 4, 5, 6, 12 are in kaelint-website-business; all others in lead-generation-tool
