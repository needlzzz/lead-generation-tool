/**
 * Tests for websiteAnalyzer module
 * 
 * Tests the three new features:
 * 1. Security headers analysis
 * 2. CMS/Tech stack detection (tested via mocked page.evaluate)
 * 3. Opportunity score calculation
 */

const {
  analyzeSecurityHeaders,
  calculateOpportunityScore,
  calculateScore,
  scoreToQuality
} = require('../server/lib/websiteAnalyzer');

// --- Security Headers Tests ---

describe('analyzeSecurityHeaders', () => {
  test('returns grade A+ when all headers present', () => {
    const headers = {
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=()'
    };
    const issues = [];
    const result = analyzeSecurityHeaders(headers, true, issues);

    expect(result.grade).toBe('A+');
    expect(result.present).toHaveLength(6);
    expect(result.missing).toHaveLength(0);
    expect(issues).toHaveLength(0);
  });

  test('returns grade F when no headers present', () => {
    const headers = {};
    const issues = [];
    const result = analyzeSecurityHeaders(headers, true, issues);

    expect(result.grade).toBe('F');
    expect(result.present).toHaveLength(0);
    expect(result.missing).toHaveLength(6);
  });

  test('pushes missing-security-headers issue when critical headers missing on HTTPS site', () => {
    const headers = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff'
    };
    const issues = [];
    analyzeSecurityHeaders(headers, true, issues);

    const secIssue = issues.find(i => i.id === 'missing-security-headers');
    expect(secIssue).toBeDefined();
    expect(secIssue.label).toBe('Kein Schutz vor Datenklau und Manipulation');
    expect(secIssue.detail).toContain('HSTS');
  });

  test('does not push HSTS issue for non-SSL sites', () => {
    const headers = {};
    const issues = [];
    const result = analyzeSecurityHeaders(headers, false, issues);

    // HSTS is only relevant for HTTPS, so missing headers check should not flag HSTS
    const secIssue = issues.find(i => i.id === 'missing-security-headers');
    expect(secIssue).toBeUndefined();
  });

  test('grade B when 4 of 6 headers present', () => {
    const headers = {
      'strict-transport-security': 'max-age=31536000',
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff'
    };
    const issues = [];
    const result = analyzeSecurityHeaders(headers, true, issues);

    expect(result.grade).toBe('B');
    expect(result.present).toHaveLength(4);
    expect(result.missing).toContain('Referrer-Policy');
    expect(result.missing).toContain('Permissions-Policy');
  });

  test('pushes weak-security-headers issue for grade D or F', () => {
    const headers = {
      'x-content-type-options': 'nosniff'
    };
    const issues = [];
    const result = analyzeSecurityHeaders(headers, false, issues);

    // Only 1 of 6 → grade D or F
    expect(['D', 'F']).toContain(result.grade);
    const weakIssue = issues.find(i => i.id === 'weak-security-headers');
    expect(weakIssue).toBeDefined();
    expect(weakIssue.detail).toContain('Schutzmassnahmen');
  });

  test('stores all header values in result', () => {
    const headers = {
      'strict-transport-security': 'max-age=63072000',
      'x-frame-options': 'SAMEORIGIN'
    };
    const issues = [];
    const result = analyzeSecurityHeaders(headers, true, issues);

    expect(result.headers['strict-transport-security']).toBe('max-age=63072000');
    expect(result.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(result.headers['content-security-policy']).toBeNull();
  });
});

// --- Opportunity Score Tests ---

describe('calculateOpportunityScore', () => {
  const baseAnalysis = { copyrightYear: null };
  const emptyTechStack = { cms: null, framework: null };

  test('returns higher score for worse website quality', () => {
    const lowQuality = calculateOpportunityScore(20, [{id:'a'},{id:'b'},{id:'c'}], baseAnalysis, emptyTechStack, {});
    const highQuality = calculateOpportunityScore(80, [{id:'a'}], baseAnalysis, emptyTechStack, {});

    expect(lowQuality).toBeGreaterThan(highQuality);
  });

  test('WordPress sites get higher opportunity than Wix sites', () => {
    const wpStack = { cms: 'WordPress', framework: null };
    const wixStack = { cms: 'Wix', framework: null };

    const wpScore = calculateOpportunityScore(50, [{id:'a'},{id:'b'}], baseAnalysis, wpStack, {});
    const wixScore = calculateOpportunityScore(50, [{id:'a'},{id:'b'}], baseAnalysis, wixStack, {});

    expect(wpScore).toBeGreaterThan(wixScore);
  });

  test('higher Google rating increases opportunity', () => {
    const highRating = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, emptyTechStack, { googleRating: 4.8 });
    const lowRating = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, emptyTechStack, { googleRating: 3.0 });

    expect(highRating).toBeGreaterThan(lowRating);
  });

  test('stale copyright year increases opportunity', () => {
    const staleAnalysis = { copyrightYear: 2019 };
    const freshAnalysis = { copyrightYear: new Date().getFullYear() };

    const stale = calculateOpportunityScore(50, [{id:'a'}], staleAnalysis, emptyTechStack, {});
    const fresh = calculateOpportunityScore(50, [{id:'a'}], freshAnalysis, emptyTechStack, {});

    expect(stale).toBeGreaterThan(fresh);
  });

  test('more issues increase opportunity', () => {
    const manyIssues = calculateOpportunityScore(50,
      [{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'}],
      baseAnalysis, emptyTechStack, {});
    const fewIssues = calculateOpportunityScore(50,
      [{id:'a'}],
      baseAnalysis, emptyTechStack, {});

    expect(manyIssues).toBeGreaterThan(fewIssues);
  });

  test('score is capped at 100', () => {
    // Worst case: terrible site, many issues, WordPress, old copyright, great rating
    const maxScore = calculateOpportunityScore(0,
      [{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'},{id:'f'}],
      { copyrightYear: 2015 },
      { cms: 'WordPress', framework: null },
      { googleRating: 5.0 });

    expect(maxScore).toBeLessThanOrEqual(100);
  });

  test('score is at minimum 0', () => {
    const minScore = calculateOpportunityScore(100, [], { copyrightYear: new Date().getFullYear() }, emptyTechStack, {});
    expect(minScore).toBeGreaterThanOrEqual(0);
  });

  test('null googleRating does not affect score', () => {
    const withNull = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, emptyTechStack, { googleRating: null });
    const withoutOption = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, emptyTechStack, {});

    expect(withNull).toBe(withoutOption);
  });

  test('Shopify gets medium opportunity score', () => {
    const shopifyStack = { cms: 'Shopify', framework: null };
    const wpStack = { cms: 'WordPress', framework: null };
    const wixStack = { cms: 'Wix', framework: null };

    const shopify = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, shopifyStack, {});
    const wp = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, wpStack, {});
    const wix = calculateOpportunityScore(50, [{id:'a'}], baseAnalysis, wixStack, {});

    expect(shopify).toBeGreaterThan(wix);
    expect(shopify).toBeLessThan(wp);
  });
});

// --- calculateScore Tests ---

describe('calculateScore', () => {
  test('returns 100 when no issues', () => {
    expect(calculateScore([], 1000)).toBe(100);
  });

  test('deducts correctly for known issues', () => {
    const issues = [{ id: 'no-ssl' }, { id: 'no-viewport' }];
    // no-ssl = 20, no-viewport = 25 → 100 - 45 = 55
    expect(calculateScore(issues, 1000)).toBe(55);
  });

  test('uses default deduction of 5 for unknown issue ids', () => {
    const issues = [{ id: 'some-new-issue' }];
    expect(calculateScore(issues, 1000)).toBe(95);
  });

  test('never goes below 0', () => {
    const issues = [
      { id: 'no-ssl' }, { id: 'no-viewport' }, { id: 'slow-load' },
      { id: 'uses-flash' }, { id: 'table-layout' }, { id: 'outdated-wp' },
      { id: 'missing-security-headers' }, { id: 'no-title' }
    ];
    expect(calculateScore(issues, 6000)).toBeGreaterThanOrEqual(0);
  });

  test('deducts for new security header issues', () => {
    const withSecurity = calculateScore([{ id: 'missing-security-headers' }], 1000);
    const withWeak = calculateScore([{ id: 'weak-security-headers' }], 1000);

    expect(withSecurity).toBe(88); // 100 - 12
    expect(withWeak).toBe(92); // 100 - 8
  });

  test('deducts for outdated joomla', () => {
    expect(calculateScore([{ id: 'outdated-joomla' }], 1000)).toBe(88);
  });
});

// --- scoreToQuality Tests ---

describe('scoreToQuality', () => {
  test('returns Good for 80+', () => {
    expect(scoreToQuality(80)).toBe('Good');
    expect(scoreToQuality(100)).toBe('Good');
  });

  test('returns Outdated for 50-79', () => {
    expect(scoreToQuality(50)).toBe('Outdated');
    expect(scoreToQuality(79)).toBe('Outdated');
  });

  test('returns Poor for below 50', () => {
    expect(scoreToQuality(49)).toBe('Poor');
    expect(scoreToQuality(0)).toBe('Poor');
  });
});
