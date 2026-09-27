// Run: node tests/cookie-consent.cjs (requires Playwright and its Chromium browser).
// Local files are served by interception under the production hostname. No deploy
// or Google traffic occurs. A GA stub verifies loading, cookies and withdrawal.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const key = 'aigen.analytics-consent.v1';
const ga = /googletagmanager\.com|google-analytics\.com/;
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', 'artifacts'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  });
}
const pages = htmlFiles(root).filter(file => /<html\b/i.test(fs.readFileSync(file, 'utf8')));
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/src="\/assets\/cookie-consent.js"/g) || []).length, 1, file);
  assert(!/googletagmanager|google-analytics|\bgtag\(/.test(html), file);
}
console.log(`PASS static coverage: ${pages.length} HTML pages`);
if (process.argv.includes('--static')) process.exit(0);
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  async function setup(viewport = { width: 1440, height: 1000 }) {
    const context = await browser.newContext({ viewport });
    const requests = [];
    const errors = [];
    context.on('request', request => { if (ga.test(request.url())) requests.push(request.url()); });
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'www.googletagmanager.com') {
        return route.fulfill({ contentType: 'text/javascript', body: `
          if (!window['ga-disable-G-YFF8RBFBP3']) {
            document.cookie = '_ga=stub; Path=/; Domain=aigen.fi; SameSite=Lax';
            document.cookie = '_ga_YFF8RBFBP3=stub; Path=/; SameSite=Lax';
            fetch('https://www.google-analytics.com/g/collect?test=1');
          }` });
      }
      if (ga.test(url.href)) return route.fulfill({ status: 204, body: '' });
      if (!['aigen.fi', 'www.aigen.fi'].includes(url.hostname)) return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ path: file });
    });
    return { context, requests, errors, page: await context.newPage() };
  }
  async function off(s) {
    assert.equal(await s.page.locator('#aigen-analytics').count(), 0);
    assert.equal((await s.context.cookies()).filter(c => /^_ga/.test(c.name)).length, 0);
  }
  try {
    // Every FI/EN page is verified fresh at the real hostname, avoiding a false
    // pass caused by the production-only GA hostname guard.
    const all = await setup();
    for (const file of pages) {
      await all.page.goto('https://aigen.fi/' + path.relative(root, file));
      assert(await all.page.locator('#cookie-consent').isVisible(), file);
      await off(all);
    }
    assert.equal(all.requests.length, 0);
    assert.deepEqual(all.errors, []);
    await all.context.close();
    console.log(`PASS fresh/no GA across ${pages.length} pages`);
    for (const locale of ['fi', 'en']) {
      for (const mobile of [false, true]) {
        const s = await setup(mobile ? { width: 320, height: 568 } : undefined);
        const { page, context, requests } = s;
        await page.goto('https://aigen.fi/' + (locale === 'en' ? 'en/' : ''));
        const dialog = page.locator('#cookie-consent');
        const reject = page.locator('[data-choice="rejected"]');
        const accept = page.locator('[data-choice="accepted"]');
        assert.equal(await page.locator('html').getAttribute('lang'), locale);
        await off(s);
        assert.equal(requests.length, 0);
        assert(await reject.evaluate(el => el === document.activeElement));
        const styles = await page.locator('[data-choice]').evaluateAll(els => els.map(el => {
          const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.fontSize, el.offsetHeight, el.offsetWidth];
        }));
        assert.deepEqual(styles[0], styles[1]);
        for (const key of ['Tab', 'Shift+Tab']) {
          for (let i = 0; i < 8; i++) {
            await page.keyboard.press(key);
            assert(await dialog.evaluate(el => el.contains(document.activeElement)));
          }
        }
        const box = await dialog.boundingBox();
        const vp = page.viewportSize();
        assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width && box.y + box.height <= vp.height);
        await page.screenshot({ path: path.join(root, `artifacts/consent-${locale}-${mobile ? 'mobile' : 'desktop'}.png`) });
        await reject.click();
        assert.equal(await page.evaluate(k => localStorage.getItem(k), key), 'rejected');
        await page.reload();
        assert(!(await dialog.isVisible()));
        await off(s);
        assert.equal(requests.length, 0);
        await page.locator('.consent-settings').click();
        await accept.click();
        await page.waitForFunction(() => document.cookie.includes('_ga='));
        assert.equal(requests.filter(url => url.includes('gtag/js')).length, 1);
        await page.reload();
        await page.waitForFunction(() => !!document.getElementById('aigen-analytics'));
        assert(!(await dialog.isVisible()));
        assert.equal(requests.filter(url => url.includes('gtag/js')).length, 2);
        await context.addCookies([{ name: '_gid', value: 'legacy', domain: '.aigen.fi', path: '/' }]);
        await page.locator('.consent-settings').click();
        const before = requests.length;
        await Promise.all([page.waitForEvent('load'), reject.click()]);
        await off(s);
        assert.equal((await context.cookies()).filter(c => c.name === '_gid').length, 0);
        assert.equal(requests.length, before);
        await page.reload();
        await off(s);
        assert.equal(requests.length, before);
        assert.deepEqual(s.errors, []);
        await context.close();
        console.log(`PASS ${locale} ${mobile ? 'mobile' : 'desktop'}: fresh/reject/accept/reload/withdraw/keyboard/layout`);
      }
    }
    const s = await setup();
    await s.page.goto('https://aigen.fi/');
    await s.page.locator('[data-choice="accepted"]').click();
    await s.page.waitForFunction(() => document.cookie.includes('_ga='));
    const other = await s.context.newPage();
    await other.goto('https://aigen.fi/en/');
    await other.locator('.consent-settings').click();
    await Promise.all([s.page.waitForEvent('load'), other.waitForEvent('load'), other.locator('[data-choice="rejected"]').click()]);
    await off(s);
    assert.equal(await other.locator('#aigen-analytics').count(), 0);
    await s.context.close();
    console.log('PASS cross-tab withdrawal');
    const blocked = await setup();
    await blocked.context.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
    await blocked.page.goto('https://aigen.fi/');
    await blocked.page.locator('[data-choice="accepted"]').click();
    await off(blocked);
    assert.equal(blocked.requests.length, 0);
    assert(await blocked.page.locator('#cookie-consent').isVisible());
    await blocked.context.close();
    console.log('PASS blocked storage fails closed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
