/**
 * Tests for screenshotCapturer module
 *
 * Covers: Playwright missing handling, HTML file existence check,
 * output path calculation, success/failure object shape.
 *
 * Note: Does NOT actually launch Playwright (that's an integration test).
 * Uses jest mocking for the playwright module.
 */

const path = require('path');

// --- Test for Playwright Missing (isolated module) ---

describe('screenshotCapturer - Playwright missing', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns error when playwright is not installed', async () => {
    jest.doMock('playwright', () => {
      throw new Error("Cannot find module 'playwright'");
    });

    const { captureScreenshot } = require('../server/lib/screenshotCapturer');
    const result = await captureScreenshot('test-slug', '/tmp/repo');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Playwright/Chromium nicht installiert. Führe "npx playwright install chromium" aus.');
    expect(result.screenshotPath).toBeUndefined();
  });
});

// --- Tests with Playwright mocked successfully ---

describe('screenshotCapturer - with Playwright available', () => {
  let captureScreenshot;
  let mockPage;
  let mockBrowser;
  let mockChromium;
  let mockFs;

  const testSlug = 'a7f3b92e-coiffeur-mueller-bern';
  const testRepoPath = '/tmp/kaelint-website-business';

  beforeEach(() => {
    jest.resetModules();

    // Set up Playwright mock
    mockPage = {
      setViewportSize: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(undefined),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-png-data'))
    };
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined)
    };
    mockChromium = {
      launch: jest.fn().mockResolvedValue(mockBrowser)
    };

    jest.doMock('playwright', () => ({
      chromium: mockChromium
    }));

    // Set up fs mock
    mockFs = {
      existsSync: jest.fn().mockReturnValue(true),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
      renameSync: jest.fn()
    };

    jest.doMock('fs', () => mockFs);

    // Load the module with our mocks
    ({ captureScreenshot } = require('../server/lib/screenshotCapturer'));
  });

  // --- HTML File Existence Tests ---

  describe('HTML file existence check', () => {
    test('returns error when built HTML file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Built HTML not found:');
      expect(result.error).toContain(path.join(testRepoPath, 'dist', 'previews', testSlug, 'index.html'));
    });

    test('checks the correct HTML path (dist/previews/{slug}/index.html)', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await captureScreenshot(testSlug, testRepoPath);

      const expectedPath = path.join(testRepoPath, 'dist', 'previews', testSlug, 'index.html');
      expect(mockFs.existsSync).toHaveBeenCalledWith(expectedPath);
    });

    test('does not launch browser when HTML file is missing', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await captureScreenshot(testSlug, testRepoPath);

      expect(mockChromium.launch).not.toHaveBeenCalled();
    });
  });

  // --- Output Path Calculation Tests ---

  describe('output path calculation', () => {
    test('saves screenshot to server/data/previews/{slug}/screenshot.png', async () => {
      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(true);
      // The path should end with server/data/previews/{slug}/screenshot.png
      expect(result.screenshotPath).toContain(path.join('data', 'previews', testSlug, 'screenshot.png'));
    });

    test('creates output directory recursively', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(1);
      const calledPath = mockFs.mkdirSync.mock.calls[0][0];
      expect(calledPath).toContain(path.join('data', 'previews', testSlug));
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(calledPath, { recursive: true });
    });

    test('uses temp+rename pattern for atomic writes', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      // writeFileSync should be called with a .tmp. path
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      const writtenPath = mockFs.writeFileSync.mock.calls[0][0];
      expect(writtenPath).toMatch(/screenshot\.png\.tmp\.\d+$/);

      // renameSync should rename from tmp to final
      expect(mockFs.renameSync).toHaveBeenCalledTimes(1);
      const [tmpPath, finalPath] = mockFs.renameSync.mock.calls[0];
      expect(tmpPath).toMatch(/screenshot\.png\.tmp\.\d+$/);
      expect(finalPath).toMatch(/screenshot\.png$/);
      expect(finalPath).not.toMatch(/\.tmp\./);
    });
  });

  // --- Success Case Tests ---

  describe('successful screenshot capture', () => {
    test('returns success: true with screenshotPath on success', async () => {
      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(true);
      expect(result.screenshotPath).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('launches Playwright with headless mode', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      expect(mockChromium.launch).toHaveBeenCalledWith({ headless: true });
    });

    test('sets viewport to 1280x800', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 1280, height: 800 });
    });

    test('navigates to file:// URL with networkidle and 10s timeout', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      const expectedUrl = `file://${path.join(testRepoPath, 'dist', 'previews', testSlug, 'index.html')}`;
      expect(mockPage.goto).toHaveBeenCalledWith(
        expectedUrl,
        { waitUntil: 'networkidle', timeout: 10000 }
      );
    });

    test('captures screenshot as PNG', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      expect(mockPage.screenshot).toHaveBeenCalledWith({ type: 'png' });
    });

    test('closes browser after capture', async () => {
      await captureScreenshot(testSlug, testRepoPath);

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  // --- Error Handling Tests ---

  describe('error handling', () => {
    test('returns timeout error when navigation times out', async () => {
      mockPage.goto.mockRejectedValueOnce(new Error('Timeout 10000ms exceeded'));

      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Screenshot-Timeout: Seite konnte nicht geladen werden');
    });

    test('returns browser launch error when chromium fails to start', async () => {
      mockChromium.launch.mockRejectedValueOnce(new Error('Failed to launch browser'));

      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Browser konnte nicht gestartet werden');
    });

    test('returns generic error message for unknown errors', async () => {
      mockPage.screenshot.mockRejectedValueOnce(new Error('Something went wrong'));

      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    test('never throws - always returns result object', async () => {
      mockChromium.launch.mockRejectedValueOnce(new Error('Crash'));

      // Should not throw
      const result = await captureScreenshot(testSlug, testRepoPath);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });

    test('closes browser in finally block even on error', async () => {
      // Make screenshot fail but browser was already created
      mockPage.screenshot.mockRejectedValueOnce(new Error('Render failed'));

      await captureScreenshot(testSlug, testRepoPath);

      // Browser.close should have been called (in finally or in catch)
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  // --- Return Shape Tests ---

  describe('return value shape', () => {
    test('success result has success:true and screenshotPath, no error', async () => {
      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(true);
      expect(typeof result.screenshotPath).toBe('string');
      expect(result.error).toBeUndefined();
    });

    test('failure result has success:false and error, no screenshotPath', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await captureScreenshot(testSlug, testRepoPath);

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
      expect(result.screenshotPath).toBeUndefined();
    });
  });
});
