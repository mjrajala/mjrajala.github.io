const { chromium } = require('/opt/homebrew/lib/node_modules/openclaw/node_modules/playwright-core');
const fs = require('fs');
const BASE = process.env.AIGEN_TEST_BASE || 'http://127.0.0.1:8768', P = BASE;
const FIX = fs.readFileSync('/Users/jarvis/clawd/tmp/aigen-opus-fullsite/fixtures/apps-TEST-ONLY-50.js', 'utf8').replaceAll('/testi-sivu3/assets/', '/assets/catalog-site/').replaceAll('/testi-sivu3/', '/');
const results = []; let fails = 0;
const check = (n, ok, d) => { results.push((ok ? 'PASS ' : 'FAIL ') + n + (d !== undefined ? '  → ' + JSON.stringify(d).slice(0, 220) : '')); if (!ok) fails++; };
async function page(b, w, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, reducedMotion: 'reduce' });
  if (opts.fixture) await ctx.route('**/assets/catalog-site/apps.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FIX }));
  const p = await ctx.newPage(); p.errs = []; p.reqs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  p.on('request', r => p.reqs.push(r.url()));
  return p;
}
const cards = p => p.$$eval('#sovellukset .app-card', els => els.map(e => e.querySelector('.app-link').firstChild.textContent.trim()));
const count = p => p.$eval('#tulos-maara', e => e.textContent);
const settle = p => p.waitForTimeout(450);
const go = async (p, url) => { await p.goto(url, { waitUntil: 'networkidle' }); await settle(p); };


async function productionPreflight(browser, url) {
  const probe = await browser.newPage();
  await probe.goto(url + '/');
  const canonical = await probe.locator('link[rel="canonical"]').getAttribute('href');
  const preview = await probe.locator('.preview-strip').count();
  await probe.close();
  if (canonical !== 'https://aigen.fi/' || preview) throw new Error('Test server is not the promoted production root: ' + url);
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  await productionPreflight(b,BASE);

  // J1 FI + EN: home search → catalog → detail → CTA href → back restores → breadcrumb
  for (const [lang, home, q, first, det, cta] of [['fi', '/', 'ilmoituskanava', 'Ilmoo', '/sovellukset/ilmoo/', 'https://ilmoo.fi/sign-up'], ['en', '/en/', 'whistleblowing', 'Ilmoo', '/en/apps/ilmoo/', 'https://ilmoo.fi/sign-up']]) {
    const p = await page(b, 1440);
    await go(p, P + home);
    await p.fill('#etusivu-haku', q); await Promise.all([p.waitForURL('**/?q=*'), p.press('#etusivu-haku', 'Enter')]); await settle(p);
    check(`J1 ${lang} hero search → own-language catalog`, p.url() === P + (lang === 'fi' ? '/sovellukset/' : '/en/apps/') + '?q=' + q, p.url());
    check(`J1 ${lang} first result ${first}`, (await cards(p))[0] === first, await cards(p));
    await Promise.all([p.waitForURL('**' + det), p.click('#sovellukset .app-card:first-child .app-link')]); await settle(p);
    check(`J1 ${lang} card → ${lang} detail`, p.url() === P + det, p.url());
    check(`J1 ${lang} primary CTA`, (await p.getAttribute('.buy .button-primary', 'href')) === cta);
    const rel = await p.$$eval('[data-related] .app-link', e => e.map(x => x.getAttribute('href')));
    check(`J1 ${lang} related apps stay in language`, rel.length > 0 && rel.every(h => lang === 'en' ? h.includes('/en/apps/') : h.includes('/sovellukset/')), rel);
    await p.goBack(); await p.waitForLoadState('networkidle'); await settle(p);
    check(`J1 ${lang} back restores search`, (await p.inputValue('#haku-kentta')) === q && (await cards(p))[0] === first);
    await p.goForward(); await settle(p);
    await Promise.all([p.waitForURL(P + home), p.click('.breadcrumb a >> nth=0')]);
    check(`J1 ${lang} breadcrumb home`, p.url() === P + home);
    check(`J1 ${lang} no console errors`, p.errs.length === 0, p.errs);
    await p.context().close();
  }

  // J2 FI + EN: task chip → filtered catalog → detail → tag → catalog
  for (const [lang, home, chip, expect, slug] of [['fi', '/', 'tehtava=raportointi', ['Aigen CBAM', 'TasaPay'], 'tehtava=velvoitteet'], ['en', '/en/', 'task=reporting', ['Aigen CBAM', 'TasaPay'], 'task=obligations']]) {
    const p = await page(b, 1440);
    await go(p, P + home);
    const n = await p.$eval(`.browse a[href*="${chip}"] .n`, e => e.textContent);
    await Promise.all([p.waitForURL('**' + chip), p.click(`.browse a[href*="${chip}"]`)]); await settle(p);
    check(`J2 ${lang} chip filters catalog`, JSON.stringify(await cards(p)) === JSON.stringify(expect) && +n === expect.length, await cards(p));
    await Promise.all([p.waitForURL('**/aigen-cbam/'), p.click('.app-card[data-app="aigen-cbam"] .app-link')]); await settle(p);
    await Promise.all([p.waitForURL('**' + slug), p.click(`.tags a[href*="${slug}"]`)]); await settle(p);
    check(`J2 ${lang} detail tag → category`, (await cards(p)).length === 4, await cards(p));
    await p.context().close();
  }

  // J3 FI search/filters/reset/empty/other audience/sort; EN URL params localized
  {
    const p = await page(b, 1440);
    await go(p, P + '/sovellukset/');
    check('J3 fi business default 5, no games', (await count(p)) === '5 sovellusta' && !(await cards(p)).includes('Spawnpad'));
    for (const [q, exp] of [['päästöjen', 'Aigen CBAM'], ['paastot', 'Aigen CBAM'], ['whistleblowing', 'Ilmoo'], ['palkkaerot', 'TasaPay']]) { await p.fill('#haku-kentta', q); await settle(p); check(`J3 fi search "${q}"`, (await cards(p))[0] === exp, await cards(p)); }
    await p.fill('#haku-kentta', 'peli'); await settle(p);
    check('J3 fi games hidden from business + empty state', await p.isVisible('#tyhja') && await p.isVisible('#muut-osumat'));
    await p.click('#muut-osumat button'); await settle(p);
    check('J3 fi switch to Pelit ja kokeilut', (await cards(p)).includes('Spawnpad') && p.url().includes('kohde=muut'), p.url());
    await p.click('[data-audience="yritykset"]'); await p.fill('#haku-kentta', ''); await settle(p);
    await p.check('input[name=tehtava][value=velvoitteet]'); await settle(p); await p.check('input[name=tila][value=saatavilla]'); await settle(p);
    check('J3 fi combined filters', JSON.stringify((await cards(p)).sort()) === '["Aigen CBAM","Ilmoo"]' && /tehtava=velvoitteet/.test(p.url()) && /tila=saatavilla/.test(p.url()), p.url());
    await p.fill('#haku-kentta', 'palkka'); await settle(p);
    check('J3 fi query+filters → empty', await p.isVisible('#tyhja'));
    await p.click('#tyhja [data-reset]'); await settle(p);
    check('J3 fi reset', (await count(p)) === '5 sovellusta' && p.url().endsWith('/sovellukset/'), p.url());
    await p.selectOption('#jarjestys', 'nimi'); await settle(p);
    const nm = await cards(p); check('J3 fi sort A–Ö', JSON.stringify(nm) === JSON.stringify([...nm].sort((a, c) => a.localeCompare(c, 'fi'))), nm);
    check('J3 fi tulossa cards say so, no start CTA', await p.$$eval('.app-card.status-tulossa', els => els.every(e => /Tulossa/.test(e.textContent) && /suunnitelmasta/.test(e.textContent))));
    await p.context().close();
    const e = await page(b, 1440);
    await go(e, P + '/en/apps/');
    check('J3 en business default 5', (await count(e)) === '5 apps');
    await e.fill('#haku-kentta', 'emissions'); await settle(e); check('J3 en search "emissions" → CBAM (EN text)', (await cards(e))[0] === 'Aigen CBAM');
    await e.fill('#haku-kentta', 'ilmoituskanava'); await settle(e); check('J3 en does not match Finnish-only words', await e.isVisible('#tyhja'));
    await e.fill('#haku-kentta', 'game'); await settle(e); await e.click('#muut-osumat button'); await settle(e);
    check('J3 en other audience URL localized', e.url().includes('audience=other') && (await cards(e)).includes('Spawnpad'), e.url());
    await e.click('[data-audience="yritykset"]'); await e.fill('#haku-kentta', ''); await settle(e);
    await e.check('input[name=tila][value=tulossa]'); await settle(e);
    check('J3 en status param localized + coming apps', e.url().includes('status=coming') && JSON.stringify((await cards(e)).sort()) === '["GPSRdocs","TasaPay"]', e.url());
    const hrefs = await e.$$eval('#sovellukset .app-link', x => x.map(a => a.getAttribute('href')));
    check('J3 en cards link to EN details', hrefs.every(h => h.startsWith('/en/apps/')), hrefs);
    check('J3 en no console errors', e.errs.length === 0, e.errs);
    await e.context().close();
  }

  // J4 keyboard catalog
  {
    const p = await page(b, 1440);
    await go(p, P + '/sovellukset/');
    await p.focus('#haku-kentta'); await p.keyboard.type('cbam'); await settle(p);
    check('J4 typing filters', (await cards(p)).length === 1);
    await p.keyboard.press('Escape'); await settle(p);
    check('J4 Escape clears', (await cards(p)).length === 5);
    await p.focus('input[name=tehtava][value=""]'); await p.keyboard.press('ArrowDown'); await settle(p);
    check('J4 arrow keys keep focus', (await p.evaluate(() => document.activeElement.value)) === 'velvoitteet' && (await cards(p)).length === 4);
    await p.context().close();
  }

  // J5 mobile: filter dialog, menu with language switch
  for (const lang of ['fi', 'en']) {
    const p = await page(b, 390);
    await go(p, P + (lang === 'fi' ? '/sovellukset/' : '/en/apps/'));
    await p.click('#avaa-suodattimet'); await settle(p);
    check(`J5 ${lang} filter dialog`, (await p.getAttribute('#suodattimet', 'role')) === 'dialog' && (await p.evaluate(() => document.activeElement.id)) === 'sulje-suodattimet');
    await p.check('input[name=tehtava][value=henkilosto]'); await settle(p);
    check(`J5 ${lang} live apply count`, /2/.test(await p.textContent('#nayta-tulokset')), await p.textContent('#nayta-tulokset'));
    for (let i = 0; i < 15; i++) await p.keyboard.press('Tab');
    check(`J5 ${lang} focus trapped`, await p.evaluate(() => document.getElementById('suodattimet').contains(document.activeElement)));
    await p.keyboard.press('Escape'); await settle(p);
    check(`J5 ${lang} Escape returns focus`, (await p.evaluate(() => document.activeElement.id)) === 'avaa-suodattimet' && (await cards(p)).length === 2);
    await p.click('.menu-button'); await settle(p);
    const sw = await p.$('#paavalikko .lang-switch');
    check(`J5 ${lang} menu shows lang switch`, await sw.isVisible());
    await Promise.all([p.waitForNavigation(), sw.click()]); await settle(p);
    check(`J5 ${lang} switch goes to counterpart catalog`, p.url() === P + (lang === 'fi' ? '/en/apps/' : '/sovellukset/'), p.url());
    await p.context().close();
  }

  // J6 language counterparts: article, guide, app (exact pages, not home)
  {
    const p = await page(b, 1440);
    for (const [a, z] of [['/blog/aigen-cbam-avattu/', '/en/blog/aigen-cbam-launched/'], ['/oppaat/ai-act-pk-yritys/', '/en/guides/ai-act-for-smes/'], ['/sovellukset/tasapay/', '/en/apps/tasapay/'], ['/raataloity-kehitys/', '/en/custom-development/'], ['/yritys/', '/en/company/']]) {
      await go(p, P + a);
      await Promise.all([p.waitForURL(P + z), p.click('.main-nav .lang-switch')]);
      const enLang = await p.evaluate(() => document.documentElement.lang);
      await Promise.all([p.waitForURL(P + a), p.click('.main-nav .lang-switch')]);
      check(`J6 ${a} ⇄ ${z}`, enLang === 'en' && p.url() === P + a);
    }
    await p.context().close();
  }

  // J7 guides + blog journeys
  {
    const p = await page(b, 1440);
    await go(p, P + '/oppaat/');
    await Promise.all([p.waitForURL('**/oppaat/whistleblowing-kanava/'), p.click('a.guide-card[href$="/oppaat/whistleblowing-kanava/"]')]); await settle(p);
    await Promise.all([p.waitForURL('**/sovellukset/ilmoo/'), p.click('.mini-app-link')]);
    check('J7 guide → related app (Ilmoo)', p.url() === P + '/sovellukset/ilmoo/');
    await go(p, P + '/oppaat/ai-act-pk-yritys/');
    await p.click('.doc-toc a[href="#tarkistuslista"]'); await settle(p);
    const top = await p.$eval('#tarkistuslista', e => Math.round(e.getBoundingClientRect().top));
    check('J7 TOC anchor scrolls below sticky header', top > 60 && top < 160, top);
    await go(p, P + '/blog/');
    const total = await p.$$eval('.post-card', e => e.length);
    await p.click('.tag-filter button[data-tag="Automaatio"]'); await settle(p);
    const shown = await p.$$eval('.post-card:not([hidden])', e => e.length);
    check('J7 blog topic filter', total === 14 && shown > 0 && shown < total, { total, shown });
    await p.click('.tag-filter button[data-tag=""]'); await settle(p);
    check('J7 blog filter reset', (await p.$$eval('.post-card:not([hidden])', e => e.length)) === 14);
    await Promise.all([p.waitForURL('**/blog/aigen-cbam-avattu/'), p.click('.post-card a[href$="/blog/aigen-cbam-avattu/"]')]); await settle(p);
    check('J7 article next step → CBAM app', (await p.getAttribute('.post-next .mini-app-link', 'href')) === '/sovellukset/aigen-cbam/');
    const rel = await p.$$eval('.related-posts a', e => e.map(a => a.getAttribute('href')));
    check('J7 related posts stay in preview', rel.every(h => h.startsWith('/blog/')), rel);
    await p.goBack(); await settle(p); check('J7 back to blog index', p.url() === P + '/blog/');
    check('J7 no console errors', p.errs.length === 0, p.errs);
    await p.context().close();
  }

  // J8 aliases (old paths under prefix), incl. fragment translation
  {
    const p = await page(b, 1440);
    for (const [a, z] of [['/tuotteet/ilmoita/', '/sovellukset/ilmoo/'], ['/en/products/cbam-tool/#capabilities', '/en/apps/aigen-cbam/#features'], ['/tuotteet/cbam-tool/#cbam-video-heading', '/sovellukset/aigen-cbam/#video'], ['/ai-act-pk-yritys/#tarkistuslista', '/oppaat/ai-act-pk-yritys/#tarkistuslista'], ['/en/whistleblowing-channel/', '/en/guides/whistleblowing-channel/']]) {
      await p.goto(P + a); await p.waitForURL(P + z, { timeout: 5000 }).catch(() => {});
      check(`J8 alias ${a}`, p.url() === P + z, p.url());
    }
    await p.context().close();
  }

  // J9 video: nothing from YouTube before click
  {
    const p = await page(b, 1440);
    await go(p, P + '/sovellukset/aigen-cbam/');
    check('J9 no youtube request before click', !p.reqs.some(u => /youtube|ytimg|google/.test(u)));
    await p.route(/youtube/, r => r.abort());
    await p.click('#video .video button'); await settle(p);
    check('J9 click inserts youtube-nocookie iframe', (await p.getAttribute('#video iframe', 'src') || '').startsWith('https://www.youtube-nocookie.com/embed/jxG4TfzwtwQ'));
    await p.context().close();
  }

  // J10 50-app TEST-ONLY fixture, FI + EN
  for (const lang of ['fi', 'en']) {
    const p = await page(b, 1440, { fixture: true });
    await go(p, P + (lang === 'fi' ? '/sovellukset/' : '/en/apps/'));
    check(`J10 ${lang} fixture business count 40`, /^40 /.test(await count(p)), await count(p));
    check(`J10 ${lang} 24 cards + show more 16`, (await cards(p)).length === 24 && /16/.test(await p.textContent('#nayta-lisaa')));
    await p.click('#nayta-lisaa'); await settle(p);
    check(`J10 ${lang} show more → 40, focus moved`, (await cards(p)).length === 40 && (await p.evaluate(() => [...document.querySelectorAll('.app-link')].indexOf(document.activeElement))) === 24);
    const perf = await p.evaluate(async () => { const i = document.getElementById('haku-kentta'); const t = []; for (const q of ['a', 'te', 'test-only', 'xyz', '']) { const s = performance.now(); i.value = q; i.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 100)); t.push(performance.now() - s - 90); } return Math.max(...t).toFixed(1); });
    check(`J10 ${lang} worst search render < 50 ms`, +perf < 50, perf + ' ms');
    await p.click('[data-audience="muut"]'); await settle(p);
    check(`J10 ${lang} games separate (10)`, (await cards(p)).length === 10);
    if (lang === 'fi') await p.screenshot({ path: require('path').join(__dirname,'../docs/production-50-apps.png') });
    await p.context().close();
  }

  // J11 deep paths load directly (static refresh) – sample of nested routes
  {
    const p = await page(b, 390);
    for (const u of ['/en/blog/tesla-grok-streetlight-report/', '/oppaat/tekoalyautomaatio-pk-yrityksille/', '/en/apps/clawspam/', '/sovellukset/gpsrdocs/']) {
      const r = await p.goto(P + u); check(`J11 direct load ${u}`, r.status() === 200 && (await p.$$('h1')).length === 1);
    }
    await p.context().close();
  }

  await b.close();
  fs.writeFileSync(__dirname + '/../docs/production-journey-results.txt', results.join('\n') + `\n\n${results.length - fails}/${results.length} passed\n`);
  console.log(results.filter(r => r.startsWith('FAIL')).join('\n')); console.log(`${results.length - fails}/${results.length} passed`);
})();
