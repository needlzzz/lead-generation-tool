/**
 * E2E Test: Preview Build Process
 *
 * Tests the full pipeline: config generation → YAML write → Astro build → output verification.
 * This test is SLOW (runs a real Astro build) and requires:
 * - kaelint-website-business repo at the path specified in settings
 * - Node.js and npm installed
 *
 * Run separately: npm run test:e2e:preview
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');
const { generateConfig } = require('../server/lib/configGenerator');
const { generateSlug } = require('../server/lib/slugGenerator');

const PREVIEW_SITE_REPO = '/Users/tabkamac/private/dev/git/kaelint-website-business';
const TEST_TIMEOUT = 90000; // 90 seconds for build

describe('Preview Build E2E', () => {
  let testSlug;
  let configDir;
  let outputDir;

  beforeAll(() => {
    // Verify the kaelint-website-business repo exists
    expect(fs.existsSync(PREVIEW_SITE_REPO)).toBe(true);
    expect(fs.existsSync(path.join(PREVIEW_SITE_REPO, 'package.json'))).toBe(true);
  });

  afterAll(() => {
    // Clean up generated config and output
    if (configDir && fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
    if (outputDir && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  test('generates valid config for a test lead', () => {
    const lead = {
      businessName: 'E2E Test Bäckerei',
      category: 'restaurant',
      city: 'Bern',
      address: 'Teststrasse 1',
      phone: '+41 79 000 00 00',
      email: 'test@example.com',
      contactPerson: 'Max Tester'
    };

    testSlug = generateSlug(lead.businessName, lead.city, []);
    const result = generateConfig(lead, testSlug);

    expect(result.success).toBe(true);
    expect(result.config.businessName).toBe('E2E Test Bäckerei');
    expect(result.config.theme).toBe('editorial'); // restaurant preset
    expect(result.config.languages).toEqual(['de']);
  });

  test('writes config.yaml to kaelint-website-business', () => {
    const lead = {
      businessName: 'E2E Test Bäckerei',
      category: 'restaurant',
      city: 'Bern',
      address: 'Teststrasse 1',
      phone: '+41 79 000 00 00',
      email: 'test@example.com',
      contactPerson: 'Max Tester'
    };

    const result = generateConfig(lead, testSlug);
    const configYaml = YAML.stringify(result.config);

    configDir = path.join(PREVIEW_SITE_REPO, 'previews', 'configs', testSlug);
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.yaml');
    fs.writeFileSync(configPath, configYaml, 'utf-8');

    expect(fs.existsSync(configPath)).toBe(true);

    // Verify YAML is valid by parsing it back
    const parsed = YAML.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(parsed.businessName).toBe('E2E Test Bäckerei');
  });

  test('builds preview site successfully', () => {
    const configPath = path.join(configDir, 'config.yaml');
    outputDir = path.join(PREVIEW_SITE_REPO, 'dist', 'previews', testSlug);

    // Run the build script
    const buildCmd = `node scripts/build-preview.mjs --config "${configPath}" --slug "${testSlug}" --niche restaurant`;

    let buildOutput;
    try {
      buildOutput = execSync(buildCmd, {
        cwd: PREVIEW_SITE_REPO,
        timeout: TEST_TIMEOUT,
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'production' }
      });
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : '';
      const stdout = err.stdout ? err.stdout.toString() : '';
      throw new Error(`Build failed:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
    }

    // Build should succeed (no throw = success)
    expect(fs.existsSync(outputDir)).toBe(true);
  }, TEST_TIMEOUT);

  test('output contains expected files', () => {
    // Check for index page (might be at root or in /de/ depending on Astro config)
    const indexPathDe = path.join(outputDir, 'de', 'index.html');
    const indexPathRoot = path.join(outputDir, 'index.html');
    const indexExists = fs.existsSync(indexPathDe) || fs.existsSync(indexPathRoot);
    expect(indexExists).toBe(true);

    // Check the HTML contains the business name
    const indexPath = fs.existsSync(indexPathDe) ? indexPathDe : indexPathRoot;
    const html = fs.readFileSync(indexPath, 'utf-8');
    expect(html).toContain('E2E Test B');  // might be encoded as HTML entity
  });

  test('output contains static assets', () => {
    // Check for _astro directory (Astro processed assets)
    const astroDir = path.join(outputDir, '_astro');
    expect(fs.existsSync(astroDir)).toBe(true);

    // Should have at least one CSS file
    const astroFiles = fs.readdirSync(astroDir);
    const hasCss = astroFiles.some(f => f.endsWith('.css'));
    expect(hasCss).toBe(true);
  });

  test('output does not contain leftover niche assets in src/', () => {
    // The build script should have cleaned up copied assets
    const galleryDir = path.join(PREVIEW_SITE_REPO, 'src', 'assets', 'images', 'gallery');
    const teamDir = path.join(PREVIEW_SITE_REPO, 'src', 'assets', 'images', 'team');
    const logoFile = path.join(PREVIEW_SITE_REPO, 'src', 'assets', 'images', 'logo.svg');

    // These should NOT exist (cleaned up by build-preview.mjs finally block)
    expect(fs.existsSync(galleryDir)).toBe(false);
    expect(fs.existsSync(teamDir)).toBe(false);
    expect(fs.existsSync(logoFile)).toBe(false);
  });
});
