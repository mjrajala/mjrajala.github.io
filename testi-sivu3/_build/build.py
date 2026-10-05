#!/usr/bin/env python3
"""Build the complete Aigen preview site under /testi-sivu3/ (FI + EN).

Reads the original production pages in the repository root (read-only), converts guides and blog
articles into the new templates, wraps hand-written page fragments (_build/content/{fi,en}/*.inc)
in the shared shell, and writes static HTML into testi-sivu3/. Nothing outside testi-sivu3/ is written.

Usage:  python3 testi-sivu3/_build/build.py            (requires beautifulsoup4 + lxml)
Output: testi-sivu3/**/index.html and testi-sivu3/_build/build-report.json
"""
import html
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString

HERE = Path(__file__).resolve().parent
OUT = HERE.parent                      # testi-sivu3/
ROOT = OUT.parent                      # repository root (original site, read-only)
P = "/testi-sivu3"                     # URL prefix of the preview
CONTENT = HERE / "content"

# --------------------------------------------------------------------------------------------
# Site map: every page key exists in FI and EN. key -> {lang: path}
# --------------------------------------------------------------------------------------------
APP_IDS = ["ilmoo", "aigen-cbam", "draftpad", "tasapay", "gpsrdocs", "spawnpad", "clawspam"]

GUIDES = [  # key, fi source slug, en source slug, related app, group
    ("aiact", "ai-act-pk-yritys", "ai-act-for-smes", None, "eu"),
    ("pay", "palkka-avoimuusdirektiivi", "pay-transparency-directive", "tasapay", "eu"),
    ("cbam", "cbam-raportointi", "cbam-reporting", "aigen-cbam", "eu"),
    ("wb", "whistleblowing-kanava", "whistleblowing-channel", "ilmoo", "eu"),
    ("agent", "tekoalyagentti-yritykselle", "ai-agent-for-business", None, "ai"),
    ("auto", "tekoalyautomaatio-pk-yrityksille", "ai-automation-for-smes", None, "ai"),
]

PRODUCT_SOURCES = {  # app id -> original product page paths (fi, en)
    "ilmoo": ("/tuotteet/ilmoita/", "/en/products/ilmoita/"),
    "aigen-cbam": ("/tuotteet/cbam-tool/", "/en/products/cbam-tool/"),
    "tasapay": ("/tuotteet/tasapay/", "/en/products/tasapay/"),
    "gpsrdocs": ("/tuotteet/gpsrdocs/", "/en/products/gpsrdocs/"),
}

PAGES = {
    "home": {"fi": f"{P}/", "en": f"{P}/en/"},
    "apps": {"fi": f"{P}/sovellukset/", "en": f"{P}/en/apps/"},
    "custom": {"fi": f"{P}/raataloity-kehitys/", "en": f"{P}/en/custom-development/"},
    "company": {"fi": f"{P}/yritys/", "en": f"{P}/en/company/"},
    "guides": {"fi": f"{P}/oppaat/", "en": f"{P}/en/guides/"},
    "blog": {"fi": f"{P}/blog/", "en": f"{P}/en/blog/"},
}
for a in APP_IDS:
    PAGES[f"app-{a}"] = {"fi": f"{P}/sovellukset/{a}/", "en": f"{P}/en/apps/{a}/"}
for key, fi_slug, en_slug, _, _ in GUIDES:
    PAGES[f"guide-{key}"] = {"fi": f"{P}/oppaat/{fi_slug}/", "en": f"{P}/en/guides/{en_slug}/"}

SECTION_OF = {"home": None, "apps": "apps", "custom": "custom", "company": "company", "guides": "guides", "blog": "blog"}

# Original (live) page for each preview page – used for the single "current live page" link and the manifest.
LIVE = {"home": {"fi": "/", "en": "/en/"}, "guides": {"fi": "/oppaat/", "en": "/en/guides/"},
        "blog": {"fi": "/blog/", "en": "/en/blog/"}}
for a, (fi, en) in PRODUCT_SOURCES.items():
    LIVE[f"app-{a}"] = {"fi": fi, "en": en}
for key, fi_slug, en_slug, _, _ in GUIDES:
    LIVE[f"guide-{key}"] = {"fi": f"/{fi_slug}/", "en": f"/en/{en_slug}/"}

# --------------------------------------------------------------------------------------------
# Blog inventory (pairs from hreflang of the original FI articles)
# --------------------------------------------------------------------------------------------
def soup_of(path):
    return BeautifulSoup((ROOT / path.strip("/") / "index.html").read_text(encoding="utf-8"), "lxml")

BLOG = []  # dicts with key, fi slug, en slug
for d in sorted((ROOT / "blog").iterdir()):
    if not (d / "index.html").exists() or d.name == "artikkeli-pohja":
        continue
    s = soup_of(f"/blog/{d.name}/")
    en = s.find("link", rel="alternate", hreflang="en")["href"].replace("https://aigen.fi", "")
    en_slug = en.strip("/").split("/")[-1]
    key = f"post-{d.name}"
    BLOG.append({"key": key, "fi": d.name, "en": en_slug})
    PAGES[key] = {"fi": f"{P}/blog/{d.name}/", "en": f"{P}/en/blog/{en_slug}/"}
    LIVE[key] = {"fi": f"/blog/{d.name}/", "en": f"/en/blog/{en_slug}/"}

# --------------------------------------------------------------------------------------------
# Old URL -> new preview URL (for links inside migrated content) + aliases for mirrored old paths
# --------------------------------------------------------------------------------------------
URL_MAP = {}
for key, langs in LIVE.items():
    for lang, old in langs.items():
        URL_MAP[old] = PAGES[key][lang]

FRAG_MAP = {
    ("/", "products"): PAGES["apps"]["fi"], ("/", "tools"): PAGES["apps"]["fi"],
    ("/", "other-products"): PAGES["apps"]["fi"] + "?kohde=muut",
    ("/", "services"): PAGES["custom"]["fi"], ("/", "about"): PAGES["company"]["fi"],
    ("/", "contact"): PAGES["company"]["fi"] + "#yhteys",
    ("/en/", "products"): PAGES["apps"]["en"], ("/en/", "tools"): PAGES["apps"]["en"],
    ("/en/", "other-products"): PAGES["apps"]["en"] + "?audience=other",
    ("/en/", "services"): PAGES["custom"]["en"], ("/en/", "about"): PAGES["company"]["en"],
    ("/en/", "contact"): PAGES["company"]["en"] + "#contact",
    ("/tuotteet/cbam-tool/", "cbam-video-heading"): PAGES["app-aigen-cbam"]["fi"] + "#video",
    ("/tuotteet/cbam-tool/", "capabilities"): PAGES["app-aigen-cbam"]["fi"] + "#ominaisuudet",
    ("/tuotteet/cbam-tool/", "limitations"): PAGES["app-aigen-cbam"]["fi"] + "#rajaukset",
    ("/tuotteet/cbam-tool/", "cbam-background"): PAGES["app-aigen-cbam"]["fi"] + "#mika-cbam",
    ("/en/products/cbam-tool/", "cbam-video-heading"): PAGES["app-aigen-cbam"]["en"] + "#video",
    ("/en/products/cbam-tool/", "capabilities"): PAGES["app-aigen-cbam"]["en"] + "#features",
    ("/en/products/cbam-tool/", "limitations"): PAGES["app-aigen-cbam"]["en"] + "#limits",
    ("/en/products/cbam-tool/", "cbam-background"): PAGES["app-aigen-cbam"]["en"] + "#what-is-cbam",
}
# Mirrored old paths under /testi-sivu3/ that differ from the new ones get a small redirect page.
ALIASES = {P + old: new for old, new in URL_MAP.items() if P + old != new}

SHARED_ASSETS = set()   # /assets/... files referenced read-only
REWRITES = []           # (page, old href, new href) for the manifest


class LinkError(Exception):
    pass


def map_href(href, page_key=""):
    """Map an href found in original content to its preview equivalent. Unknown internal paths fail the build."""
    if href is None:
        return href
    h = href.strip()
    h = re.sub(r"^https?://(www\.)?aigen\.fi", "", h)
    if h == "":
        h = "/"
    if re.match(r"^(mailto:|tel:|https?:)", h) or h.startswith("#"):
        return h
    if h.startswith("/assets/") or h in ("/favicon.ico", "/favicon.png"):
        SHARED_ASSETS.add(h.split("#")[0].split("?")[0])
        return h
    m = re.match(r"^([^?#]*)(\?[^#]*)?(#.*)?$", h)
    path, query, frag = m.group(1) or "/", m.group(2) or "", (m.group(3) or "")[1:]
    if not path.endswith("/") and "." not in path.split("/")[-1]:
        path += "/"
    if path.startswith(P + "/"):
        return h  # already a preview path
    if frag and (path, frag) in FRAG_MAP:
        new = FRAG_MAP[(path, frag)]
    elif path in URL_MAP:
        new = URL_MAP[path] + query + (f"#{frag}" if frag else "")
    else:
        raise LinkError(f"{page_key}: no preview target for {href!r}")
    REWRITES.append((page_key, href, new))
    return new


def url(key, lang):
    if key not in PAGES:
        raise LinkError(f"unknown page key {key}")
    return PAGES[key][lang]

# --------------------------------------------------------------------------------------------
# Shell
# --------------------------------------------------------------------------------------------
UI = {
    "fi": {
        "skip": "Siirry sisältöön", "preview": "Esikatselu 3", "not_live": "testiversio",
        "live": "Nykyinen live-sivu", "menu": "Valikko", "nav_label": "Päänavigaatio",
        "nav": [("apps", "Sovellukset"), ("custom", "Räätälöity kehitys"), ("guides", "Oppaat"), ("blog", "Blogi"), ("company", "Yritys")],
        "cta": "Ota yhteyttä", "cta_href": "company", "cta_frag": "#yhteys",
        "switch": "EN", "switch_label": "In English", "switch_lang": "en",
        "home_alt": "Aigen – etusivu", "crumb_home": "Etusivu", "crumbs": "Murupolku",
        "footer_tag": "Suomalainen ohjelmistoyritys. Sovelluksia ja räätälöityä automaatiota yrityksille Suomessa ja Euroopassa.",
        "f_apps": "Sovellukset", "f_all_apps": "Kaikki sovellukset", "f_other": "Pelit ja kokeilut",
        "f_guides": "Oppaat", "f_company": "Yritys", "f_about": "Meistä", "f_contact": "Ota yhteyttä",
        "f_blog": "Blogi", "f_custom": "Räätälöity kehitys", "footer_label": "Alatunniste",
        "copy": "© 2026 AI Generation Oy", "lang_name": "Suomeksi",
    },
    "en": {
        "skip": "Skip to content", "preview": "Preview 3", "not_live": "test version",
        "live": "Current live page", "menu": "Menu", "nav_label": "Main navigation",
        "nav": [("apps", "Apps"), ("custom", "Custom development"), ("guides", "Guides"), ("blog", "Blog"), ("company", "Company")],
        "cta": "Contact us", "cta_href": "company", "cta_frag": "#contact",
        "switch": "FI", "switch_label": "Suomeksi", "switch_lang": "fi",
        "home_alt": "Aigen – home", "crumb_home": "Home", "crumbs": "Breadcrumb",
        "footer_tag": "A Finnish software company. Apps and custom automation for businesses in Finland and across Europe.",
        "f_apps": "Apps", "f_all_apps": "All apps", "f_other": "Games and experiments",
        "f_guides": "Guides", "f_company": "Company", "f_about": "About us", "f_contact": "Contact us",
        "f_blog": "Blog", "f_custom": "Custom development", "footer_label": "Footer",
        "copy": "© 2026 AI Generation Oy", "lang_name": "In English",
    },
}

GUIDE_TITLES = {}  # (key, lang) -> short title (from the original guide index cards)
GUIDE_DESC = {}
GUIDE_GROUPS = {}  # (group, lang) -> heading


def esc(s):
    return html.escape(s or "", quote=True)


def shell(key, lang, title, description, body, scripts=(), body_class=""):
    t = UI[lang]
    other = t["switch_lang"]
    section = SECTION_OF.get(key) or (
        "apps" if key.startswith("app-") else "guides" if key.startswith("guide-") else "blog" if key.startswith("post-") else None)
    live = LIVE.get(key, {}).get(lang) or ("/" if lang == "fi" else "/en/")
    nav_items = []
    for k, label in t["nav"]:
        cur = ' aria-current="page"' if k == key else (' aria-current="true"' if k == section else "")
        nav_items.append(f'<a href="{url(k, lang)}"{cur}>{esc(label)}</a>')
    nav = "".join(nav_items)
    js = "".join(f'\n  <script defer src="{P}/assets/{s}"></script>' for s in ("apps.js", "ui.js") + tuple(scripts))
    guides_links = "".join(f'<li><a href="{url("guide-" + g[0], lang)}">{esc(GUIDE_TITLES[(g[0], lang)])}</a></li>' for g in GUIDES)
    return f"""<!doctype html>
<html lang="{lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192">
  <script>document.documentElement.className = "js";</script>
  <link rel="stylesheet" href="{P}/assets/site.css">{js}
</head>
<body{f' class="{body_class}"' if body_class else ''}>
  <a class="skip-link" href="#sisalto">{t['skip']}</a>

  <div class="preview-strip">
    <div class="wrap">
      <span><b>{t['preview']}</b> · {t['not_live']}</span>
      <a href="{live}" data-live-escape>{t['live']} <span aria-hidden="true">↗</span></a>
    </div>
  </div>

  <header class="site-header">
    <div class="wrap header-row">
      <a class="logo" href="{url('home', lang)}"><img src="/assets/logo-black.png" alt="{t['home_alt']}" width="136" height="32"></a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="paavalikko">{t['menu']}</button>
      <nav id="paavalikko" class="main-nav" aria-label="{t['nav_label']}">
        {nav}
        <a class="lang-switch" href="{url(key, other)}" hreflang="{other}" lang="{other}" aria-label="{t['switch_label']}">{t['switch']}</a>
        <a class="nav-cta" href="{url(t['cta_href'], lang)}{t['cta_frag']}">{t['cta']}</a>
      </nav>
    </div>
  </header>

  <main id="sisalto" tabindex="-1">
{body}
  </main>

  <footer class="footer">
    <div class="wrap">
      <div class="footer-cols">
        <div class="footer-brand">
          <img src="/assets/logo-black.png" alt="AI Generation" width="102" height="24">
          <p>{t['footer_tag']}</p>
          <p><a href="mailto:contact@aigen.fi">contact@aigen.fi</a><br><a href="https://www.linkedin.com/company/ai-generation-oy/" rel="noopener">LinkedIn</a></p>
        </div>
        <nav aria-label="{t['f_apps']}">
          <h2>{t['f_apps']}</h2>
          <ul>
            <li><a href="{url('app-ilmoo', lang)}">Ilmoo</a></li>
            <li><a href="{url('app-aigen-cbam', lang)}">Aigen CBAM</a></li>
            <li><a href="{url('apps', lang)}">{t['f_all_apps']}</a></li>
            <li><a href="{url('apps', lang)}{'?kohde=muut' if lang == 'fi' else '?audience=other'}">{t['f_other']}</a></li>
          </ul>
        </nav>
        <nav aria-label="{t['f_guides']}">
          <h2><a href="{url('guides', lang)}">{t['f_guides']}</a></h2>
          <ul>{guides_links}</ul>
        </nav>
        <nav aria-label="{t['f_company']}">
          <h2>{t['f_company']}</h2>
          <ul>
            <li><a href="{url('custom', lang)}">{t['f_custom']}</a></li>
            <li><a href="{url('blog', lang)}">{t['f_blog']}</a></li>
            <li><a href="{url('company', lang)}">{t['f_about']}</a></li>
            <li><a href="{url('company', lang)}{t['cta_frag']}">{t['f_contact']}</a></li>
          </ul>
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="copy">{t['copy']}</p>
        <a href="{url(key, other)}" hreflang="{other}" lang="{other}">{UI[other]['lang_name']}</a>
      </div>
    </div>
  </footer>
</body>
</html>
"""


def breadcrumb(lang, items):
    """items: list of (label, href or None for current)."""
    t = UI[lang]
    lis = [f'<li><a href="{url("home", lang)}">{t["crumb_home"]}</a></li>']
    for label, href in items:
        lis.append(f'<li><a href="{href}">{esc(label)}</a></li>' if href else f'<li><span aria-current="page">{esc(label)}</span></li>')
    return f'<nav class="breadcrumb" aria-label="{t["crumbs"]}"><ol>{"".join(lis)}</ol></nav>'

# --------------------------------------------------------------------------------------------
# Content cleaning shared by guides and blog
# --------------------------------------------------------------------------------------------
CLASS_MAP = {
    "callout": "callout", "call": "callout", "timeline": "timeline-list", "source": "source", "risk-list": "cards",
    "risk-card": "card", "risk-prohibited": "card-red", "risk-high": "card-amber", "risk-transparent": "card-teal",
    "grid-2": "cards", "grid-3": "cards", "grid": "cards", "content-card": "card", "feature": "card", "panel": "card",
    "checklist": "checklist", "faq-list": "faq", "faq-item": "faq-item", "source-list": "source-list",
    "disclaimer": "disclaimer", "section-intro": "intro", "source-box": "source-box", "update-note": "update-note",
    "btn-primary": "button button-primary", "btn-secondary": "button", "cta": "actions", "hero-actions": "actions",
}
UNWRAP = {"container", "article-layout", "article-body", "hero-grid", "related-inner"}


def clean(node, page_key):
    """Rewrite classes/links of a content subtree in place; unwrap layout-only wrappers; drop decorative svg."""
    for c in node.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for x in node.find_all(["svg", "script", "style"]):
        x.decompose()
    for tag in node.find_all(True):
        if tag.name == "a" and tag.get("href"):
            tag["href"] = map_href(tag["href"], page_key)
        if tag.name == "img" and tag.get("src"):
            tag["src"] = map_href(tag["src"], page_key)
            tag["loading"] = tag.get("loading", "lazy")
        classes = tag.get("class") or []
        if tag.name in ("div", "section", "article") and classes and set(classes) <= UNWRAP and not tag.get("id"):
            tag.unwrap()
            continue
        new = []
        for c in classes:
            if c in UNWRAP:
                continue
            if c in CLASS_MAP:
                new.extend(CLASS_MAP[c].split())
            elif c == "btn":
                pass
        if new:
            tag["class"] = list(dict.fromkeys(new))
        elif "class" in tag.attrs:
            del tag["class"]
        for attr in ("style", "fetchpriority", "tabindex"):
            if attr in tag.attrs:
                del tag[attr]
    for tag in node.find_all("h2"):
        if "section-title" in (tag.get("class") or []):
            del tag["class"]
    return node


def slugify(s):
    s = s.lower()
    for a, b in (("ä", "a"), ("ö", "o"), ("å", "a")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]

# --------------------------------------------------------------------------------------------
# Guides
# --------------------------------------------------------------------------------------------
def load_guide_index():
    for lang, path in (("fi", "/oppaat/"), ("en", "/en/guides/")):
        s = soup_of(path)
        main = s.find("main")
        intro = main.select_one(".directory-intro")
        GUIDE_GROUPS[("intro", lang)] = {
            "eyebrow": intro.select_one(".eyebrow").get_text(strip=True),
            "h1": intro.find("h1").get_text(strip=True),
            "lead": intro.select_one(".lead").get_text(strip=True),
        }
        for sec in main.select("section.section"):
            heading = sec.find("h2").get_text(strip=True)
            for a in sec.select("a.card"):
                href = a["href"]
                for key, fi_slug, en_slug, _, group in GUIDES:
                    if href.strip("/").split("/")[-1] in (fi_slug, en_slug):
                        GUIDE_TITLES[(key, lang)] = a.find("h3").get_text(strip=True)
                        GUIDE_DESC[(key, lang)] = a.find("p").get_text(strip=True)
                        GUIDE_GROUPS[(group, lang)] = heading
    missing = [(g[0], l) for g in GUIDES for l in ("fi", "en") if (g[0], l) not in GUIDE_TITLES]
    if missing:
        raise SystemExit(f"guide index missing entries: {missing}")


G_TEXT = {
    "fi": {"guides": "Oppaat", "on_page": "Tällä sivulla", "related_app": "Tähän liittyvä sovellus",
           "more": "Muut oppaat", "all": "Kaikki oppaat", "custom_t": "Tarvitsetteko tähän oman toteutuksen?",
           "custom_p": "Rakennamme tekoälyautomaation yrityksenne omaan työnkulkuun ja dataan.",
           "custom_cta": "Räätälöity kehitys", "view": "Katso sovellus", "note": "Lyhyesti", "updated_src": "Alkuperäinen opas"},
    "en": {"guides": "Guides", "on_page": "On this page", "related_app": "Related app",
           "more": "More guides", "all": "All guides", "custom_t": "Need your own implementation?",
           "custom_p": "We build AI automation around your own workflow and data.",
           "custom_cta": "Custom development", "view": "View app", "note": "In short", "updated_src": "Original guide"},
}


def app_box(app_id, lang, heading):
    apps = load_apps()
    a = apps[app_id]
    t = a[lang]
    icon = (f'<img src="{a["icon"]}" alt="" width="44" height="44">' if a.get("icon")
            else f'<span class="app-monogram" aria-hidden="true">{a["name"][0]}</span>')
    status = {"saatavilla": ("Saatavilla", "Available"), "beta": ("Beta", "Beta"), "tulossa": ("Tulossa", "Coming")}[a["status"]]
    status = status[0] if lang == "fi" else status[1]
    return f"""<aside class="mini-app" aria-label="{esc(heading)}">
  <p class="mini-kicker">{esc(heading)}</p>
  <a class="mini-app-link" href="{a['path'][lang]}">{icon}<span><span class="mini-use">{esc(t['useCase'])}</span><strong>{esc(a['name'])}</strong><span class="status-badge status-badge-{a['status']}">{status}</span></span></a>
</aside>"""


_APPS = None


def load_apps():
    """Parse assets/apps.js (JSON-like object literal) once."""
    global _APPS
    if _APPS is None:
        src = (OUT / "assets" / "apps.js").read_text(encoding="utf-8")
        obj = src[src.index("window.AIGEN_CATALOG = ") + len("window.AIGEN_CATALOG = "):].strip().rstrip(";")
        obj = re.sub(r"(?m)^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', obj)  # quote keys
        obj = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', obj)
        data = json.loads(obj)
        _APPS = {a["id"]: a for a in data["apps"]}
        _APPS["_data"] = data
    return _APPS


def build_guide(key, fi_slug, en_slug, app_id, group, lang):
    slug = fi_slug if lang == "fi" else en_slug
    src = f"/{slug}/" if lang == "fi" else f"/en/{slug}/"
    page_key = f"guide-{key}"
    s = soup_of(src)
    main = s.find("main")
    for x in main.select("nav.page-links, aside.toc"):
        x.decompose()
    hero = main.select_one("section.product-hero, section.hero")
    eyebrow = hero.select_one(".eyebrow").get_text(strip=True)
    h1 = hero.find("h1").get_text(strip=True)
    lead = hero.select_one(".lead")
    update = hero.select_one(".update-note")
    actions = hero.select_one(".hero-actions, .cta")
    summary = hero.select_one("aside")
    for part in (lead, update, actions, summary):
        if part is not None:
            part.extract()
            clean(part, page_key)
    hero.decompose()
    clean(main, page_key)
    # Body: everything left in main. Give every h2 an anchor; prefer the id of its section.
    body = main
    toc = []
    for h2 in body.find_all("h2"):
        sec = h2.find_parent("section")
        anchor = sec.get("id") if sec is not None and sec.get("id") and sec.find("h2") is h2 else None
        if not anchor:
            anchor = h2.get("id") or slugify(h2.get_text())
            h2["id"] = anchor
        toc.append((anchor, h2.get_text(" ", strip=True)))
    body_html = "".join(str(c) for c in body.contents).strip()
    gt = G_TEXT[lang]
    actions_html = ""
    if actions is not None:
        actions["class"] = ["actions"]
        actions_html = str(actions)
    summary_html = ""
    if summary is not None:
        h = summary.find(["h2", "h3"])
        heading = h.get_text(strip=True) if h else gt["note"]
        if h:
            h.decompose()
        inner = "".join(str(c) for c in summary.contents).strip()
        summary_html = f'<aside class="doc-summary" aria-labelledby="summary-title"><h2 id="summary-title">{esc(heading)}</h2>{inner}</aside>'
    toc_html = "".join(f'<li><a href="#{a}">{esc(t)}</a></li>' for a, t in toc)
    side = f'<nav class="doc-toc" aria-label="{gt["on_page"]}"><details data-open-wide><summary class="mini-kicker">{gt["on_page"]} <span aria-hidden="true">({len(toc)})</span></summary><ol>{toc_html}</ol></details></nav>'
    if app_id:
        side += app_box(app_id, lang, gt["related_app"])
    else:
        side += f'<aside class="mini-app mini-custom"><p class="mini-kicker">{gt["custom_cta"]}</p><p>{gt["custom_p"]}</p><a class="arrow-link" href="{url("custom", lang)}">{gt["custom_cta"]}</a></aside>'
    others = [g for g in GUIDES if g[0] != key]
    others.sort(key=lambda g: (g[4] != group,))
    more = "".join(
        f'<li><a class="guide-card" href="{url("guide-" + g[0], lang)}"><span class="mini-kicker">{esc(GUIDE_GROUPS[(g[4], lang)])}</span><strong>{esc(GUIDE_TITLES[(g[0], lang)])}</strong><span>{esc(GUIDE_DESC[(g[0], lang)])}</span></a></li>'
        for g in others[:3])
    body = f"""    <article class="doc">
      <header class="doc-hero">
        <div class="wrap doc-hero-grid">
          <div>
            {breadcrumb(lang, [(gt['guides'], url('guides', lang)), (GUIDE_TITLES[(key, lang)], None)])}
            <p class="kicker">{esc(eyebrow)}</p>
            <h1>{esc(h1)}</h1>
            {str(lead) if lead is not None else ''}
            {str(update) if update is not None else ''}
            {actions_html}
          </div>
          {summary_html}
        </div>
      </header>
      <div class="wrap doc-layout">
        <div class="doc-side">{side}</div>
        <div class="doc-body prose">
{body_html}
        </div>
      </div>
    </article>
    <section class="more-guides" aria-labelledby="more-title">
      <div class="wrap">
        <div class="related-head"><h2 id="more-title">{gt['more']}</h2><a class="arrow-link" href="{url('guides', lang)}">{gt['all']}</a></div>
        <ul class="guide-grid">{more}</ul>
      </div>
    </section>"""
    title = s.title.get_text(strip=True).replace(" | Aigen", "")
    desc = (s.find("meta", attrs={"name": "description"}) or {}).get("content", "")
    return shell(page_key, lang, f"{title} | Aigen – {UI[lang]['preview']}", desc, body), {"title": title, "h1": h1, "toc": toc}


def build_guides_index(lang):
    intro = GUIDE_GROUPS[("intro", lang)]
    groups = []
    for group in ("eu", "ai"):
        items = "".join(
            f'<li><a class="guide-card" href="{url("guide-" + g[0], lang)}"><strong>{esc(GUIDE_TITLES[(g[0], lang)])}</strong><span>{esc(GUIDE_DESC[(g[0], lang)])}</span>'
            + (f'<span class="guide-app">{"Sovellus" if lang == "fi" else "App"}: {load_apps()[g[3]]["name"]}</span>' if g[3] else "")
            + "</a></li>"
            for g in GUIDES if g[4] == group)
        groups.append(f'<section class="guide-group" aria-labelledby="g-{group}"><h2 id="g-{group}">{esc(GUIDE_GROUPS[(group, lang)])}</h2><ul class="guide-grid">{items}</ul></section>')
    blog_t = ("Ajankohtaisemmat kirjoitukset löytyvät blogista." if lang == "fi" else "For shorter, timely pieces, read the blog.")
    blog_l = ("Siirry blogiin" if lang == "fi" else "Go to the blog")
    body = f"""    <div class="wrap page-head">
      {breadcrumb(lang, [(G_TEXT[lang]['guides'], None)])}
      <p class="kicker">{esc(intro['eyebrow'])}</p>
      <h1>{esc(intro['h1'])}</h1>
      <p class="lead">{esc(intro['lead'])}</p>
    </div>
    <div class="wrap guides-index">
      {''.join(groups)}
      <p class="guides-blog">{blog_t} <a class="arrow-link" href="{url('blog', lang)}">{blog_l}</a></p>
    </div>"""
    s = soup_of("/oppaat/" if lang == "fi" else "/en/guides/")
    desc = (s.find("meta", attrs={"name": "description"}) or {}).get("content", "")
    return shell("guides", lang, f"{intro['h1']} | Aigen – {UI[lang]['preview']}", desc, body)

# --------------------------------------------------------------------------------------------
# Blog
# --------------------------------------------------------------------------------------------
B_TEXT = {
    "fi": {"blog": "Blogi", "updated": "Päivitetty", "related": "Lisää Aigenin blogista", "all": "Kaikki kirjoitukset",
           "next": "Seuraava askel", "tags": "Aiheet", "all_tags": "Kaikki", "published": "Julkaistu"},
    "en": {"blog": "Blog", "updated": "Updated", "related": "More from the Aigen blog", "all": "All articles",
           "next": "Next step", "tags": "Topics", "all_tags": "All", "published": "Published"},
}
# Relevant next step per article (app or guide or custom development), chosen from the article's topic.
POST_NEXT = {
    "aigen-cbam-avattu": ("app", "aigen-cbam"),
    "chatgpt-work-kirjautuu-ilman-salasanaa": ("page", "guide-agent"),
    "teslan-grok-katulamppujen-vikailmoitus": ("page", "guide-agent"),
    "grok-bot-tekoalyagentti-tyokaverina": ("page", "guide-agent"),
    "mallit-kehittyvat-tekstin-tunnistaa": ("app", "draftpad"),
}
NEXT_TEXT = {
    "fi": {"guide-agent": ("Opas: tekoälyagentti yritykselle", "Miten agentti käyttää työkaluja sovituissa rajoissa ja ihmisen valvonnassa."),
           "custom": ("Räätälöity kehitys", "Rakennamme tekoälyagentin tai automaation yrityksenne omaan työnkulkuun.")},
    "en": {"guide-agent": ("Guide: AI agent for business", "How an agent uses tools within agreed limits and human review."),
           "custom": ("Custom development", "We build an AI agent or automation around your own workflow.")},
}


def parse_post(lang, slug):
    src = f"/blog/{slug}/" if lang == "fi" else f"/en/blog/{slug}/"
    s = soup_of(src)
    hero = s.select_one("header.blog-hero")
    main = s.select_one("main.article")
    mr = hero.select_one(".meta-row")
    if mr is not None:  # current article markup: first time/span is the date
        date_text = mr.find(["time", "span"]).get_text(" ", strip=True)
    else:               # older markup: <div class="meta"><span class="tag">…</span> 16.8.2026</div>
        mr = hero.select_one(".meta")
        date_text = " ".join(t.strip() for t in mr.find_all(string=True, recursive=False) if t.strip())
    tags = [t.get_text(strip=True) for t in mr.select(".tag")]
    pub = (s.find("meta", property="article:published_time") or {}).get("content", "")
    mod = (s.find("meta", property="article:modified_time") or {}).get("content", "")
    fig = hero.select_one("figure")
    img = fig.find("img") if fig else hero.find("img")
    cap = fig.find("figcaption") if fig else None
    related = []
    rel = s.select_one("section.related")
    if rel:
        for a in rel.select("a.related-card"):
            related.append(a["href"])
    return {
        "src": src, "slug": slug, "lang": lang, "title": s.title.get_text(strip=True), "h1": hero.find("h1").get_text(" ", strip=True),
        "lead": hero.select_one(".lead").get_text(" ", strip=True) if hero.select_one(".lead") else "",
        "description": (s.find("meta", attrs={"name": "description"}) or {}).get("content", ""),
        "date_text": date_text, "published": pub[:10], "modified": mod[:10], "tags": tags,
        "image": {"src": img["src"], "alt": img.get("alt", ""), "w": img.get("width"), "h": img.get("height")} if img else None,
        "caption": cap.get_text(" ", strip=True) if cap else "",
        "main": main, "related": related,
    }


TOPICS = {  # index/filter topic groups; article pages keep their original tags
    "fi": {"ai-agentit": "Tekoälyagentit", "agentit": "Tekoälyagentit", "tekoälyagentit": "Tekoälyagentit", "aiagentit": "Tekoälyagentit",
           "tekoäly": "Tekoäly", "ai": "Tekoäly", "automaatio": "Automaatio", "workflow": "Automaatio", "orchestration": "Automaatio",
           "maahantuonti": "CBAM", "grok bot": "Grok", "grok": "Grok"},
    "en": {"ai agents": "AI agents", "agents": "AI agents", "ai": "AI", "automation": "Automation", "workflow": "Automation",
           "imports": "CBAM", "grok bot": "Grok", "grok": "Grok"},
}


def topics(tags, lang):
    out = []
    for t in tags:
        n = TOPICS[lang].get(t.lower(), t[:1].upper() + t[1:])
        if n not in out:
            out.append(n)
    return out


def load_blog_index(lang):
    s = soup_of("/blog/" if lang == "fi" else "/en/blog/")
    hero = s.select_one("header.blog-hero")
    cards = []
    for a in s.select("main a.post-card"):
        cards.append({"href": a["href"], "alt": a.find("img").get("alt", "") if a.find("img") else "",
                      "excerpt": a.find("p").get_text(" ", strip=True) if a.find("p") else ""})
    return {"tag": hero.select_one(".tag").get_text(strip=True), "h1": hero.find("h1").get_text(" ", strip=True),
            "intro": hero.find("p").get_text(" ", strip=True),
            "description": (s.find("meta", attrs={"name": "description"}) or {}).get("content", ""), "cards": cards}


def post_key_for(href):
    h = href.replace("https://aigen.fi", "")
    for b in BLOG:
        if h in (f"/blog/{b['fi']}/", f"/en/blog/{b['en']}/"):
            return b["key"]
    raise LinkError(f"unknown blog href {href}")


def build_post(b, lang, posts):
    p = posts[(b["key"], lang)]
    page_key = b["key"]
    bt = B_TEXT[lang]
    main = clean(p["main"], page_key)
    body_html = "".join(str(c) for c in main.contents).strip()
    date_html = f'<time datetime="{p["published"]}">{esc(p["date_text"])}</time>' if p["published"] else esc(p["date_text"])
    tags = "".join(f'<li>{esc(t)}</li>' for t in p["tags"])
    fig = ""
    if p["image"]:
        im = p["image"]
        src = map_href(im["src"], page_key)
        cap = f"<figcaption>{esc(p['caption'])}</figcaption>" if p["caption"] else ""
        square = str(im["w"]) == str(im["h"])
        fig = f'<figure class="post-figure{" is-square" if square else ""}"><img src="{src}" alt="{esc(im["alt"])}" width="{im["w"]}" height="{im["h"]}">{cap}</figure>'
    # related: original related list when present, else newest other posts sharing a tag, else newest.
    rel_keys = [post_key_for(h) for h in p["related"]]
    if not rel_keys:
        same = [k for (k, l), q in posts.items() if l == lang and k != b["key"] and set(q["tags"]) & set(p["tags"])]
        rest = [k for (k, l), q in posts.items() if l == lang and k != b["key"] and k not in same]
        order = sorted(same, key=lambda k: posts[(k, lang)]["published"], reverse=True) + sorted(rest, key=lambda k: posts[(k, lang)]["published"], reverse=True)
        rel_keys = order[:3]
    rel = "".join(
        f'<li><a class="post-mini" href="{url(k, lang)}"><span>{esc(posts[(k, lang)]["date_text"].split(" · ")[0])}</span><strong>{esc(posts[(k, lang)]["h1"])}</strong></a></li>'
        for k in rel_keys[:3])
    kind, target = POST_NEXT.get(b["fi"], ("page", "custom"))
    if kind == "app":
        nxt = app_box(target, lang, bt["next"])
    else:
        t, d = NEXT_TEXT[lang][target]
        nxt = f'<aside class="mini-app mini-custom" aria-label="{bt["next"]}"><p class="mini-kicker">{bt["next"]}</p><p><strong>{esc(t)}</strong><br>{esc(d)}</p><a class="arrow-link" href="{url(target, lang)}">{esc(t)}</a></aside>'
    body = f"""    <article class="post">
      <header class="post-hero wrap-narrow">
        {breadcrumb(lang, [(bt['blog'], url('blog', lang))])}
        <p class="post-meta">{date_html}</p>
        <ul class="post-tags" aria-label="{bt['tags']}">{tags}</ul>
        <h1>{esc(p['h1'])}</h1>
        {f'<p class="lead">{esc(p["lead"])}</p>' if p['lead'] else ''}
      </header>
      {f'<div class="wrap-figure">{fig}</div>' if fig else ''}
      <div class="wrap-narrow prose post-body">
{body_html}
      </div>
      <div class="wrap-narrow post-next">{nxt}</div>
    </article>
    <section class="related-posts" aria-labelledby="related-title">
      <div class="wrap">
        <div class="related-head"><h2 id="related-title">{bt['related']}</h2><a class="arrow-link" href="{url('blog', lang)}">{bt['all']}</a></div>
        <ul class="post-mini-grid">{rel}</ul>
      </div>
    </section>"""
    return shell(page_key, lang, f"{p['title']} – {UI[lang]['preview']}", p["description"], body)


def build_blog_index(lang, posts):
    idx = load_blog_index(lang)
    bt = B_TEXT[lang]
    cards = []
    tag_count = {}
    for c in idx["cards"]:
        k = post_key_for(c["href"])
        p = posts[(k, lang)]
        tops = topics(p["tags"], lang)
        for t in tops:
            tag_count[t] = tag_count.get(t, 0) + 1
        im = p["image"]
        thumb = (f'<div class="post-thumb"><img src="{map_href(im["src"], "blog")}" alt="{esc(c["alt"] or im["alt"])}" width="{im["w"]}" height="{im["h"]}" loading="lazy" decoding="async"></div>' if im else "")
        date_html = f'<time datetime="{p["published"]}">{esc(p["date_text"].split(" · ")[0])}</time>'
        cards.append(f"""<li class="post-card" data-tags="{esc('|'.join(tops))}">
  {thumb}
  <div class="post-card-body">
    <p class="post-meta">{date_html} · {esc(' · '.join(tops))}</p>
    <h2><a href="{url(k, lang)}">{esc(p['h1'])}</a></h2>
    <p>{esc(c['excerpt'])}</p>
  </div>
</li>""")
    if len(cards) != len(BLOG):
        raise SystemExit(f"blog index {lang} lists {len(cards)} posts, expected {len(BLOG)}")
    top = [kv for kv in sorted(tag_count.items(), key=lambda kv: (-kv[1], kv[0])) if kv[1] > 1][:6]
    chips = f'<button type="button" data-tag="" aria-pressed="true">{bt["all_tags"]}</button>' + "".join(
        f'<button type="button" data-tag="{esc(t)}" aria-pressed="false">{esc(t)} <span class="n">{n}</span></button>' for t, n in top)
    count = f"{len(cards)} kirjoitusta" if lang == "fi" else f"{len(cards)} articles"
    body = f"""    <div class="wrap page-head">
      {breadcrumb(lang, [(bt['blog'], None)])}
      <p class="kicker">{esc(idx['tag'])}</p>
      <h1>{esc(idx['h1'])}</h1>
      <p class="lead">{esc(idx['intro'])}</p>
    </div>
    <div class="wrap blog-index">
      <div class="tag-filter" role="group" aria-label="{bt['tags']}" hidden>{chips}</div>
      <p class="tag-status" id="tag-status" aria-live="polite">{count}</p>
      <ul class="post-list">
{chr(10).join(cards)}
      </ul>
    </div>"""
    return shell("blog", lang, f"{idx['h1']} | Aigen – {UI[lang]['preview']}", idx["description"], body)

# --------------------------------------------------------------------------------------------
# Hand-written fragments
# --------------------------------------------------------------------------------------------
def render_fragment(name, lang, key, posts):
    path = CONTENT / lang / f"{name}.inc"
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\s+(\{.*?\})\s*-->\s*", raw, re.S)
    if not m:
        raise SystemExit(f"{path}: missing meta header")
    meta = json.loads(m.group(1))
    body = raw[m.end():]

    def sub_url(mm):
        parts = mm.group(1).split(":")
        k, l = (parts[1], parts[0]) if len(parts) == 2 else (parts[0], lang)
        return url(k, l)
    body = re.sub(r"\{\{url:([a-z0-9:-]+)\}\}", sub_url, body)
    body = body.replace("{{crumb_home}}", UI[lang]["crumb_home"])
    if "<!--@latest-posts-->" in body:
        latest = sorted([q for (k, l), q in posts.items() if l == lang], key=lambda q: q["published"], reverse=True)[:3]
        cards = "".join(
            f'<li><a class="post-mini" href="{url(next(b["key"] for b in BLOG if b[lang] == q["slug"]), lang)}"><span>{esc(q["date_text"].split(" · ")[0])}</span><strong>{esc(q["h1"])}</strong></a></li>'
            for q in latest)
        body = body.replace("<!--@latest-posts-->", f'<ul class="post-mini-grid">{cards}</ul>')
    if "<!--@guide-cards-->" in body:
        cards = "".join(
            f'<li><a class="guide-card" href="{url("guide-" + g[0], lang)}"><span class="mini-kicker">{esc(GUIDE_GROUPS[(g[4], lang)])}</span><strong>{esc(GUIDE_TITLES[(g[0], lang)])}</strong><span>{esc(GUIDE_DESC[(g[0], lang)])}</span></a></li>'
            for g in GUIDES)
        body = body.replace("<!--@guide-cards-->", f'<ul class="guide-grid">{cards}</ul>')
    if re.search(r"\{\{|<!--@", body):
        raise SystemExit(f"{path}: unresolved placeholder")
    return shell(key, lang, meta["title"], meta["description"], body.rstrip(), tuple(meta.get("scripts", [])))


def alias_page(old, new):
    src_path = old[len(P):]
    frag = {f: target.split("#")[1] for (path, f), target in FRAG_MAP.items() if path == src_path and "#" in target and target.split("#")[0] == new}
    fmap = json.dumps(frag)
    return f"""<!doctype html>
<html lang="{'en' if '/en/' in old else 'fi'}">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <title>{'Moved' if '/en/' in old else 'Siirtynyt'} – Aigen preview</title>
  <meta http-equiv="refresh" content="0; url={new}">
  <script>var m = {fmap}, h = location.hash.slice(1); location.replace("{new}" + location.search + (h ? "#" + (m[h] || h) : ""));</script>
</head>
<body>
  <p><a href="{new}">{new}</a></p>
</body>
</html>
"""

# --------------------------------------------------------------------------------------------
def main():
    load_guide_index()
    written = {}

    def write(path, content):
        f = OUT / path[len(P) + 1:] / "index.html" if path != P + "/" else OUT / "index.html"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text("\n".join(line.rstrip() for line in content.splitlines()) + "\n", encoding="utf-8")
        written[path] = str(f.relative_to(ROOT))

    posts = {}
    for b in BLOG:
        for lang in ("fi", "en"):
            posts[(b["key"], lang)] = parse_post(lang, b[lang])

    for lang in ("fi", "en"):
        for name, key in (("home", "home"), ("apps", "apps"), ("custom", "custom"), ("company", "company")):
            write(url(key, lang), render_fragment(name, lang, key, posts))
        for a in APP_IDS:
            write(url(f"app-{a}", lang), render_fragment(f"app-{a}", lang, f"app-{a}", posts))
        write(url("guides", lang), build_guides_index(lang))
        for key, fi_slug, en_slug, app_id, group in GUIDES:
            html_, _ = build_guide(key, fi_slug, en_slug, app_id, group, lang)
            write(url(f"guide-{key}", lang), html_)
        write(url("blog", lang), build_blog_index(lang, posts))
        for b in BLOG:
            write(url(b["key"], lang), build_post(b, lang, posts))

    for old, new in ALIASES.items():
        f = OUT / old[len(P) + 1:] / "index.html"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(alias_page(old, new), encoding="utf-8")

    report = {
        "pages": {k: v for k, v in sorted(PAGES.items())},
        "live_sources": LIVE,
        "aliases": ALIASES,
        "shared_assets": sorted(SHARED_ASSETS),
        "link_rewrites": REWRITES,
        "blog_pairs": BLOG,
        "posts": {f"{k}:{l}": {"src": q["src"], "published": q["published"], "modified": q["modified"],
                              "date_text": q["date_text"], "tags": q["tags"], "image": q["image"], "caption": q["caption"]}
                  for (k, l), q in posts.items()},
        "written": written,
    }
    (HERE / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(written)} pages, {len(ALIASES)} aliases, {len(SHARED_ASSETS)} shared assets, {len(REWRITES)} link rewrites")


if __name__ == "__main__":
    try:
        main()
    except LinkError as e:
        sys.exit(f"LINK ERROR: {e}")
