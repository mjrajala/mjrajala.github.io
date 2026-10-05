# Preview 3 build (testi-sivu3)

Static site generator for the `/testi-sivu3/` preview (FI + EN). Python 3.9+, `beautifulsoup4`, `lxml`.

    python3 testi-sivu3/_build/build.py

- Reads the original production pages in the repo root **read-only** (guides, blog articles, indexes).
- Hand-written pages are fragments in `content/{fi,en}/*.inc` (home, catalog, custom development, company, 7 app pages). `{{url:KEY}}` tokens resolve to preview paths, so links can't drift.
- Guides and blog articles are converted from the originals: body HTML is kept and only the classes and links are remapped. Unknown internal links fail the build, so no page can link back to the old site.
- App data (catalog, counts, related apps) lives in `../assets/apps.js` (FI + EN).
- Writes `testi-sivu3/**/index.html`, the redirect aliases for old paths under `/testi-sivu3/`, and `build-report.json`.
- Every page is `noindex,nofollow` and has no canonical/hreflang tags, analytics, consent banner or remote fonts. Each page has exactly one "current live page" link, in the preview strip.
