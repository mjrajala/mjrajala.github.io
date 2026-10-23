/* Visual + computed-style QA for the homepage "More apps" / "Lisää sovelluksia" section.
   Usage: node tests/more-apps-visual.cjs <label> [base-url]
   Writes screenshots to media/aigen-more-apps-20261023/<label>/ and prints assertions. */
const { chromium } = require('/opt/homebrew/lib/node_modules/openclaw/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const LABEL = process.argv[2] || 'after';
const BASE = process.argv[3] || 'http://127.0.0.1:8841';
const OUT = `/Users/jarvis/clawd/media/aigen-more-apps-20261023/${LABEL}`;
const WIDTHS = [320, 390, 768, 1440];
const PAGES = [['fi', '/'], ['en', '/en/']];

fs.mkdirSync(OUT, { recursive: true });

const issues = [];
const fail = (m) => { issues.push(m); console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

async function run() {
  // The bundled playwright-core expects a newer build than the one cached locally; pin to what exists.
  const cached = '/Users/jarvis/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch(fs.existsSync(cached) ? { executablePath: cached } : {});
  for (const [lang, url] of PAGES) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const bad = [];
      page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      // force lazy icons to load
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(300);

      console.log(`\n[${lang} @ ${w}px] ${BASE + url}`);
      if (bad.length) fail(`${lang}@${w}: failed requests ${bad.join(', ')}`);

      const sec = page.locator('.more-apps');
      if (await sec.count() !== 1) { fail(`${lang}@${w}: .more-apps section not found`); await ctx.close(); continue; }

      // Delivery check: the section's rules must be present in the stylesheet the page
      // actually fetched, and that URL must be cache-busted so a stale copy can't win.
      const delivery = await page.evaluate(() => {
        const link = [...document.querySelectorAll('link[rel=stylesheet]')].find(l => l.href.includes('catalog-site/site.css'));
        let rules = [];
        for (const ss of document.styleSheets) {
          if (!ss.href || !ss.href.includes('catalog-site/site.css')) continue;
          try { rules = [...ss.cssRules].flatMap(r => r.cssRules ? [...r.cssRules].map(x => x.selectorText) : [r.selectorText]); } catch (e) { return { error: String(e) }; }
        }
        return { href: link ? link.getAttribute('href') : null, selectors: rules.filter(Boolean) };
      });
      if (delivery.error) fail(`${lang}@${w}: cannot read delivered stylesheet (${delivery.error})`);
      if (!delivery.href || !/[?&]v=/.test(delivery.href)) fail(`${lang}@${w}: stylesheet link "${delivery.href}" has no ?v= cache buster — a stale cached copy will render the section unstyled`);
      else ok(`stylesheet link is cache-busted: ${delivery.href}`);
      const needed = ['.more-apps', '.more-app-list', '.more-app-icon', '.more-app-name', '.more-app-description'];
      const missing = needed.filter(s => !delivery.selectors.some(sel => sel.split(/[\s,>:]+/).includes(s.slice(1)) || sel.includes(s)));
      if (missing.length) fail(`${lang}@${w}: delivered stylesheet is missing rules for ${missing.join(', ')}`);
      else ok(`delivered stylesheet carries all ${needed.length} section rule groups`);

      const m = await page.evaluate(() => {
        const sec = document.querySelector('.more-apps');
        const links = [...sec.querySelectorAll('.more-app-list > li > a')];
        const cs = (e) => getComputedStyle(e);
        const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
        return {
          docW: document.documentElement.clientWidth,
          scrollW: document.documentElement.scrollWidth,
          sectionBox: box(sec),
          headingFont: cs(sec.querySelector('h2')).fontSize,
          listDisplay: cs(sec.querySelector('.more-app-list')).display,
          listCols: cs(sec.querySelector('.more-app-list')).gridTemplateColumns,
          count: links.length,
          items: links.map(a => {
            const icon = a.querySelector('.more-app-icon');
            const name = a.querySelector('.more-app-name');
            const desc = a.querySelector('.more-app-description');
            const badge = a.querySelector('.more-app-status');
            return {
              href: a.getAttribute('href'),
              aDisplay: cs(a).display,
              aDecoration: cs(a).textDecorationLine,
              aBox: box(a),
              iconTag: icon ? (icon.querySelector('img') ? 'img' : 'monogram') : null,
              iconBox: icon ? box(icon) : null,
              iconRadius: icon ? cs(icon).borderTopLeftRadius : null,
              nameText: name ? name.textContent.trim() : null,
              nameDisplay: name ? cs(name).display : null,
              nameBox: name ? box(name) : null,
              nameWeight: name ? cs(name).fontWeight : null,
              nameSize: name ? cs(name).fontSize : null,
              descText: desc ? desc.textContent.trim() : null,
              descDisplay: desc ? cs(desc).display : null,
              descBox: desc ? box(desc) : null,
              descColor: desc ? cs(desc).color : null,
              badgeText: badge ? badge.textContent.trim() : null,
              badgeBox: badge ? box(badge) : null,
            };
          }),
          brokenIcons: [...sec.querySelectorAll('img')].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
        };
      });

      // --- meaningful computed-style assertions ---
      if (m.count !== 6) fail(`${lang}@${w}: expected 6 app links, got ${m.count}`);
      if (m.scrollW > m.docW + 1) fail(`${lang}@${w}: horizontal overflow ${m.scrollW} > ${m.docW}`);
      if (m.brokenIcons.length) fail(`${lang}@${w}: broken icons ${m.brokenIcons.join(', ')}`);
      if (m.listDisplay !== 'grid') fail(`${lang}@${w}: .more-app-list display is "${m.listDisplay}", expected grid (stylesheet not applied?)`);
      else ok(`list is grid, columns: ${m.listCols}`);

      const expectCols = w <= 600 ? 1 : (w < 900 ? 2 : 3);
      const actualCols = m.listCols.split(' ').filter(Boolean).length;
      if (actualCols !== expectCols) fail(`${lang}@${w}: ${actualCols} grid columns, expected ${expectCols}`);
      else ok(`${actualCols} column(s) at ${w}px`);

      const iconSizes = new Set();
      for (const [i, it] of m.items.entries()) {
        const tag = `${lang}@${w} item${i} (${it.nameText})`;
        if (it.aDisplay !== 'flex' && it.aDisplay !== 'grid') fail(`${tag}: link display "${it.aDisplay}" — layout CSS missing`);
        if (it.aDecoration !== 'none') fail(`${tag}: link text-decoration "${it.aDecoration}" — expected none (unstyled default underline)`);
        if (!it.iconBox) fail(`${tag}: no .more-app-icon element`);
        else {
          iconSizes.add(`${it.iconBox.w}x${it.iconBox.h}`);
          if (it.iconBox.w < 28 || it.iconBox.w > 44) fail(`${tag}: icon ${it.iconBox.w}px outside 28-44px`);
        }
        if (!it.nameText) fail(`${tag}: missing name`);
        if (!it.descText) fail(`${tag}: missing description`);
        if (it.nameDisplay === 'inline') fail(`${tag}: name is display:inline — name and description will run together`);
        // name must sit on its own line above description (no concatenation)
        if (it.nameBox && it.descBox && it.descBox.y < it.nameBox.y + it.nameBox.h - 2) {
          fail(`${tag}: description baseline overlaps name (name y=${it.nameBox.y} h=${it.nameBox.h}, desc y=${it.descBox.y}) — looks concatenated`);
        }
        if (it.descColor === 'rgb(28, 36, 27)') fail(`${tag}: description uses full ink colour, expected muted`);
        if (it.aBox.h < 56) fail(`${tag}: row height ${it.aBox.h}px — below comfortable tap target`);
      }
      if (iconSizes.size > 1) fail(`${lang}@${w}: inconsistent icon sizes ${[...iconSizes].join(', ')}`);
      else ok(`all 6 icons consistent at ${[...iconSizes][0]}`);

      // featured trio must stay visually dominant: featured card icon larger than more-apps icon
      const dom = await page.evaluate(() => {
        const f = document.querySelector('.feat img');
        const m = document.querySelector('.more-app-icon');
        const h3 = document.querySelector('.feat h3');
        const h2 = document.querySelector('.more-apps h2');
        return {
          featIcon: f ? Math.round(f.getBoundingClientRect().width) : null,
          moreIcon: m ? Math.round(m.getBoundingClientRect().width) : null,
          featName: h3 ? parseFloat(getComputedStyle(h3).fontSize) : null,
          moreHeading: h2 ? parseFloat(getComputedStyle(h2).fontSize) : null,
        };
      });
      if (dom.featIcon && dom.moreIcon && dom.moreIcon >= dom.featIcon) fail(`${lang}@${w}: more-apps icon ${dom.moreIcon}px >= featured icon ${dom.featIcon}px — featured no longer dominant`);
      else ok(`featured icon ${dom.featIcon}px > more-apps icon ${dom.moreIcon}px`);
      if (dom.featName && dom.moreHeading && dom.moreHeading >= dom.featName) fail(`${lang}@${w}: more-apps heading ${dom.moreHeading}px >= featured app name ${dom.featName}px`);

      // hover + focus must produce a visible computed change
      if (m.count) {
        // Snapshot every property the hover rules touch, on the elements they target.
        const snapFn = () => {
          const a = document.querySelector('.more-app-list > li > a');
          const pick = (sel, props) => { const e = a.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); const o = {}; props.forEach(p => o[p] = c[p]); return o; };
          const c = getComputedStyle(a);
          return {
            row: { bg: c.backgroundColor, bc: c.borderTopColor, shadow: c.boxShadow },
            label: pick('.more-app-label', ['textDecorationLine', 'color']),
            desc: pick('.more-app-description', ['color']),
            icon: pick('.more-app-icon', ['borderTopColor']),
          };
        };
        const rest = await page.evaluate(snapFn);
        const first = page.locator('.more-app-list > li > a').first();
        await first.hover();
        await page.waitForTimeout(220);
        const hov = await page.evaluate(snapFn);
        const diffs = [];
        if (hov.label && rest.label && hov.label.textDecorationLine !== rest.label.textDecorationLine) diffs.push(`name underline (${rest.label.textDecorationLine} -> ${hov.label.textDecorationLine})`);
        if (hov.desc && rest.desc && hov.desc.color !== rest.desc.color) diffs.push(`description ${rest.desc.color} -> ${hov.desc.color}`);
        if (hov.icon && rest.icon && hov.icon.borderTopColor !== rest.icon.borderTopColor) diffs.push(`icon border ${rest.icon.borderTopColor} -> ${hov.icon.borderTopColor}`);
        if (hov.row.bg !== rest.row.bg) diffs.push(`row bg ${rest.row.bg} -> ${hov.row.bg}`);
        if (!diffs.length) fail(`${lang}@${w}: hover produces no computed change anywhere in the row`);
        else ok(`hover: ${diffs.join('; ')}`);
        // Subtle, not loud: the row must not grow a shadow or shift position.
        if (hov.row.shadow !== rest.row.shadow) fail(`${lang}@${w}: hover adds box-shadow — louder than the featured cards`);

        await page.evaluate(() => document.querySelector('.more-app-list > li > a').focus());
        await page.waitForTimeout(120);
        const foc = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return { style: c.outlineStyle, width: c.outlineWidth, color: c.outlineColor, cls: document.activeElement.className }; });
        if (foc.style === 'none' || parseFloat(foc.width) < 2) fail(`${lang}@${w}: focus outline missing/thin (${foc.style} ${foc.width})`);
        else ok(`focus-visible outline ${foc.style} ${foc.width} ${foc.color}`);
        await page.evaluate(() => document.activeElement.blur());
        await page.mouse.move(0, 0);
        await page.waitForTimeout(150);
      }

      // vertical rhythm: section sits below hero and above .paths with real breathing room
      // Measure real whitespace: last rule of the list -> top border of the next section,
      // and the heading -> first rule. Section padding counts as whitespace, so measure content edges.
      const rhythm = await page.evaluate(() => {
        const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const hero = r('.home-hero'), sec = r('.more-apps'), list = r('.more-app-list'), h2 = r('.more-apps h2'), paths = r('.paths');
        return {
          heroGap: sec && hero ? Math.round(sec.top - hero.bottom) : null,
          headGap: list && h2 ? Math.round(list.top - h2.bottom) : null,
          pathsGap: paths && list ? Math.round(paths.top - list.bottom) : null,
        };
      });
      if (rhythm.heroGap !== null && rhythm.heroGap < -1) fail(`${lang}@${w}: more-apps overlaps hero (gap ${rhythm.heroGap})`);
      if (rhythm.headGap === null || rhythm.headGap < 6) fail(`${lang}@${w}: heading sits ${rhythm.headGap}px off the first rule — cramped`);
      if (rhythm.pathsGap === null || rhythm.pathsGap < 40) fail(`${lang}@${w}: only ${rhythm.pathsGap}px of whitespace before the next section — cramped`);
      else ok(`spacing: ${rhythm.heroGap}px after hero, ${rhythm.headGap}px heading-to-rule, ${rhythm.pathsGap}px before next section`);

      await sec.screenshot({ path: path.join(OUT, `${lang}-${w}-section.png`) });
      await page.screenshot({ path: path.join(OUT, `${lang}-${w}-viewport.png`) });
      if (w === 1440 || w === 390) {
        await page.evaluate(() => document.querySelector('.more-apps').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(OUT, `${lang}-${w}-incontext.png`) });
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n==== ${LABEL}: ${issues.length} issue(s) ====`);
  issues.forEach(i => console.log(' - ' + i));
  console.log('screenshots: ' + OUT);
  process.exit(issues.length ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(2); });
