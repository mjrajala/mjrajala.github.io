# Aigen production promotion — 2026-10-05

Local migration of the approved full testi-sivu3 website to the aigen.fi root. Markku authorized replacing production and retaining backups. Nothing was committed, pushed or published, and no external messages were sent.

## Implementation

Run `python3 scripts/promote-catalog.py` from this checkout. It reads **already generated** HTML, assets and the page/alias manifest in testi-sivu3. It never runs the preview generator and never reads the replaced root to build content. Output comprises 66 canonical FI/EN pages, 20 legacy aliases and seven real apps; no redesign or content rewrite.

Preview assets are copied into the owned `/assets/catalog-site/` namespace. The Ilmoo screenshot formerly stored beside its preview page is copied into that namespace's `media/` directory. Shared existing assets remain intact. HTML, JS and CSS URLs are rewritten for production; preview banners and live escape links are removed. Titles and Open Graph metadata have production branding and URLs. Canonical pages use index,follow, self canonicals and reciprocal fi/en/x-default alternates. Aliases use noindex,follow and target canonicals. The sitemap contains exactly 66 canonical URLs, excluding aliases, previews and build sources. Robots excludes previews, tooling and the old article template.

Organization and WebSite schema uses existing company name, URL and contact email. Original Article/BlogPosting metadata is frozen in `scripts/production-article-metadata.json`; relevant dates and available authors/images are retained. Guide Article schemas are also retained at their new URLs. No analytics or cookie banner was introduced.

Legacy aliases preserve queries and translate known old fragments, including CBAM capabilities/video sections. Their refresh fallback runs only without JavaScript to avoid racing the fragment-aware redirect. Legacy `main` and `main-nav` fragments map to `sisalto` and `paavalikko`. Root `#contact`, `#services`, `#about`, `#products` (also `#tools` and `#other-products`) redirect to company/contact, custom development, company and apps respectively; English home uses English destinations. Hash changes after initial load are handled too.

## Verification

Passed locally:

- 66 canonical pages, 20 aliases, 3,087 local HTML references and 287 fragments; canonical/indexability/language metadata and exact sitemap membership.
- All 148 baseline protected files byte-identical: testi-sivu/, testi-sivu2/, testi-sivu3/, existing shared assets, CNAME, .nojekyll and Google verification.
- All 66 main content text blocks identical to the approved generated preview.
- 28 BlogPosting date checks, original schema retention, no preview branding or URLs in production metadata, and 20 JS/CSS route/asset references resolved.
- Promotion rerun produces byte-identical output. Browser test scripts pass Node syntax checks. The production-aware Draftpad adaptation passes isolated fixture and real-feed ingestion tests without changing production content.

Static evidence: `docs/production-static-results.json`. Repeat with `python3 tests/production-static.py`; the session-specific preservation baseline additionally accepts `/private/tmp/aigen-production-baseline.json` as its argument. This temporary baseline is not a durable rollback backup.

**Independent browser verification passed.** Jarvis ran Chrome outside the coding sandbox on 2026-10-05, against this production checkout served on port 8768 with `AIGEN_TEST_BASE=http://127.0.0.1:8768`. Results:

- 286 production route/alias/fragment checks passed; no console or failed-response errors (`docs/production-browser-routes.json`).
- 88/88 FI/EN customer journeys passed, covering desktop/mobile search, filters and navigation (`docs/production-journey-results.txt`).
- 228 responsive/quality audits completed with 0 issues, covering layouts, images, console/network errors, contrast and keyboard focus (`docs/production-quality-results.txt`).
- Jarvis independently reran the production blog-builder fixture successfully: existing/new/draft posts, real nine-post feed, idempotence and invalid-image failure before writes; the original worktree remained unchanged (`docs/production-blog-builder-results.txt`).

The sandbox's localhost/Chrome restrictions were resolved for acceptance by Jarvis's external execution. Prior preview evidence and tests remained read-only; production results above belong to this worktree. Two harness defects were corrected before these passing runs: the FI CBAM anchor is `#ominaisuudet`, while EN uses `#features`; the quality preflight function now lives at module scope. Neither required a site change.

In an environment permitting localhost and Chrome:

```sh
python3 -m http.server 8768 --bind 127.0.0.1 --directory /Users/jarvis/codex-work/aigen-production-20261005
# In another terminal at the repository root:
AIGEN_TEST_BASE=http://127.0.0.1:8768 node tests/production-routes.cjs
AIGEN_TEST_BASE=http://127.0.0.1:8768 node tests/production-journeys.cjs
AIGEN_TEST_BASE=http://127.0.0.1:8768 node tests/production-quality.cjs
```

Port 8767 belongs to the prior preview worktree and must not be used for production acceptance. Every browser suite checks production canonical metadata and absence of the preview strip before testing. `AIGEN_TEST_BASE` can change the local base URL. The journey and quality suites adapt the read-only reference tests under `/Users/jarvis/clawd/tmp/aigen-opus-fullsite`; the synthetic 50-app fixture is read from there and injected only into tests. Evidence is written inside this checkout. Route tests cover every canonical and alias at mobile/desktop widths, fragment/query redirects, legacy home hashes, console/network errors and header anchor clearance. Journey tests cover FI/EN search, categories/status/audience/sorting, empty/reset state, navigation, language counterparts and mobile menu/filter dialogs. Quality tests audit all pages at 390/1440 plus representative templates at 320/390/768/1440.

The production header uses sticky top:0; existing header-height variables already control filters, page navigation and anchor clearance. No extra preview-bar offset was carried over. The independent route suite passed measured anchor clearance checks at 390 and 1440 pixels for company contact, FI/EN CBAM features and the AI Act checklist.

## Future maintenance

Treat the generated preview as the frozen approved promotion input. Re-running promotion overwrites promoted root pages, so coordinate root edits with this script or maintain a separate production content pipeline. **Do not run testi-sivu3/_build/build.py against this replaced root:** it extracts content from the former root layout. To regenerate that preview deliberately, use an isolated checkout of the backed-up baseline, review the generated changes and then promote approved output.

`scripts/build-blog-from-draftpad.js` keeps the original JSON source argument/default, published-status filter, sort, slug mapping and content conversion. For a promoted production tree it now invokes `scripts/render-catalog-blog.py`, reusing frozen approved shells in `scripts/catalog-blog-templates/`. This replaces the initial stop-only guard: the existing CLI workflow is usable and cannot fall through to the legacy layout while the promotion marker is present. Python 3 and BeautifulSoup (`bs4`) are required; a missing dependency fails before writes. Legacy render exports remain for non-promoted checkouts and are not the supported production publishing path.

The adapter updates only feed-matched Finnish articles, the Finnish index and the canonical sitemap. It retains manually maintained articles/cards and English pages. Existing publication dates/authors and captions for unchanged images survive; changed images discard stale captions. New FI-only posts use current titles/dates, organization authorship from the original publishing workflow, a generic app-browse next step, and English blog-index navigation. They have fi/x-default alternates without an invented EN translation; add a real translation and reciprocal metadata separately. The sitemap extends the existing explicit canonical set and validates every member, excluding aliases/previews/tooling. All renders and sitemap checks complete before writes.

`python3 tests/production-blog-builder.py` exercises the actual CLI in a disposable `/private/tmp` copy: existing/new/draft posts, new titles/breadcrumbs and absence of stale template content, generic next step, preserved caption/author/publication date, escaped body, unchanged English/manual/protected pages, canonical sitemap extension, byte-idempotence, the real nine-post source feed, and invalid-image failure before writes. The real production content remains untouched. Re-running initial promotion later would overwrite automated blog changes; preserve them or update the promotion inputs deliberately before doing so.

## Rollback

Jarvis already retained baseline commit `858e5a0` on remote branch `backup/pre-catalog-20261005-2150` and archive `/Users/jarvis/clawd/backups/aigen/20261005-before-catalog/site-858e5a0.tar.gz`. This session did not modify those backups.

For rollback, first save the current migration diff and any later edits. Restore the baseline in a separate clean checkout or staging directory from that branch/commit or archive, inspect it and verify the baseline root plus preview/shared asset hashes. Replace the production tree using that reviewed baseline through the separately authorized deployment workflow. Remove only promotion-owned additions absent from baseline (new catalog routes/assets and migration tooling); avoid overlay-only extraction, which would leave new routes behind. Preserve later user changes intentionally. Recheck CNAME, .nojekyll, verification, old routes and assets before deployment. No rollback or external deployment was performed here.

## Handoff state

Local implementation, static preservation checks and independent mobile/desktop browser acceptance are complete. The usable production blog automation is adapted and tested. No commit, push or external publishing was performed; Jarvis handles deployment. Rollback backups remain intact. The session remains available after handoff.
