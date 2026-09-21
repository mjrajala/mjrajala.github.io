const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const sourcePath =
  process.argv[2] || path.join(root, "blog", "linkedin-posts.json");
const siteUrl = "https://aigen.fi";

const slugMap = {
  "Tekoälyn suurin riski ei ole hallusinaatiot. Se on huono johtaminen.":
    "tekoalyn-suurin-riski-huono-johtaminen",
  "Kilpailutin vakuutukset viideltä yhtiöltä enkä avannut yhtäkään tarjousta itse":
    "vakuutusten-kilpailutus-ai-agentilla",
  "Annoimme AI-agentin tehdä yrityksen veroilmoituksen":
    "ai-agentti-veroilmoitus",
  "Agentit tekevät monivaiheisesta selvitystyöstä 5 minuutin workflow’n":
    "agentit-selvitystyo-workflow",
  "Mallivertailu on helppo tarina. Agenttityössä workflow ratkaisee.":
    "agenttityossa-workflow-ratkaisee",
  "Tekoäly lakkasi olemasta hakukone. Useimmat eivät huomanneet.":
    "tekoaly-ei-ole-hakukone",
  "Tekoälyagentit eivät ole meille demoja. Ne ovat osa arkea.":
    "tekoalyagentit-arjessa",
};

const imageMap = {
  "AI-agenttien suurin ongelma ei ole älykkyys. Se on muisti.":
    "/assets/blog/ai-agenttien-muistikerros.png",
  "Tekoälyn suurin riski ei ole hallusinaatiot. Se on huono johtaminen.":
    "/assets/blog/tekoalyn-riski-huono-johtaminen.png",
  "Kilpailutin vakuutukset viideltä yhtiöltä enkä avannut yhtäkään tarjousta itse":
    "/assets/blog/vakuutusten-kilpailutus-ai-agentilla.png",
  "Annoimme AI-agentin tehdä yrityksen veroilmoituksen":
    "/assets/blog/veroilmoitus-ai-agentti.jpg",
  "Mallivertailu on helppo tarina. Agenttityössä workflow ratkaisee.":
    "/assets/blog/agenttityo-workflow.jpg",
};

const fallbackImage = "/assets/logo-slogan.png";

const descriptions = {
  "AI-agenttien suurin ongelma ei ole älykkyys. Se on muisti.":
    "AI-agenttien käytännön pullonkaula ei ole enää pelkkä älykkyys, vaan nopea, luotettava ja käyttäjän korjattavissa oleva muistikerros.",
  "Tekoälyn suurin riski ei ole hallusinaatiot. Se on huono johtaminen.":
    "Tekoälyn suurin riski ei ole vain hallusinointi, vaan se, että organisaatiot käyttävät sitä kuin vastauskonetta eivätkä johda sen tekemää työtä.",
  "Kilpailutin vakuutukset viideltä yhtiöltä enkä avannut yhtäkään tarjousta itse":
    "Käytännön esimerkki siitä, miten AI-agentti muutti viisi vakuutustarjousta ja ehdot yhdeksi selkeäksi vertailuksi.",
  "Annoimme AI-agentin tehdä yrityksen veroilmoituksen":
    "Mitä tapahtuu, kun AI-agentti viedään oikeaan viranomaislomakkeeseen, kirjanpidon lukuihin ja monivaiheiseen back office -työhön.",
  "Agentit tekevät monivaiheisesta selvitystyöstä 5 minuutin workflow’n":
    "Käytännön esimerkki siitä, miten tekoälyagentti muuttaa hitaan vero- ja datatyön nopeaksi, tarkistettavaksi workflowksi.",
  "Mallivertailu on helppo tarina. Agenttityössä workflow ratkaisee.":
    "Miksi yrityksen kannattaa katsoa mallihypen ohi ja rakentaa agentille selkeä työnkulku, lähteet, rajat ja lopputulos.",
  "Tekoäly lakkasi olemasta hakukone. Useimmat eivät huomanneet.":
    "AI-agentit eivät ole enää vain vastauskoneita. Hyvin rajattu agentti tekee tehtäviä, seuraa muutoksia ja poistaa toistuvaa kitkaa.",
  "Tekoälyagentit eivät ole meille demoja. Ne ovat osa arkea.":
    "AI Generationin käytännön oppeja OpenClaw- ja Hermes-agenteista, mallikerroksista, työkaluista ja luotettavuudesta.",
};

const keywords = [
  "tekoälyagentit",
  "AI-agentit",
  "agenttitekoäly",
  "automaatio",
  "AI Generation Oy",
  "Aigen",
  "OpenClaw",
  "Hermes",
];

function renderNav(route) {
  const existingPath = path.join(root, route.replace(/^\//, ""), "index.html");
  let html = "<a class=\"skip-link\" href=\"#main\">Siirry sisältöön</a><header class=\"site-header\"><nav aria-label=\"Päänavigaatio\" class=\"nav-container\">\n<a class=\"nav-logo\" href=\"/\"><img alt=\"AI Generation\" height=\"36\" src=\"/assets/logo-black.png\" width=\"152\"/></a>\n<button aria-controls=\"main-nav\" aria-expanded=\"false\" class=\"menu-toggle\" type=\"button\">Valikko <span aria-hidden=\"true\">＋</span></button>\n<div class=\"nav-links\" id=\"main-nav\"><a href=\"/tuotteet/cbam-tool/\">Aigen CBAM</a><a href=\"/#services\">Palvelut</a><a href=\"/#tools\">Tuotteet</a><a href=\"/#tools\">Oppaat ja työkalut</a><a href=\"/blog/\">Blogi</a><a href=\"/#about\">Meistä</a><a class=\"nav-contact\" href=\"/#contact\">Ota yhteyttä <svg class=\"arrow-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M7 17 17 7M7 7h10v10\"/></svg></a></div>\n<div aria-label=\"Kieli\" class=\"nav-language\"><a aria-current=\"page\" href=\"/blog/\" hreflang=\"fi\" lang=\"fi\">FI</a><span aria-hidden=\"true\">/</span><a href=\"/en/blog/\" hreflang=\"en\" lang=\"en\">EN</a></div></nav></header>";
  html = html.replace(/href="[^"]+" hreflang="fi"/, `href="${esc(route)}" hreflang="fi"`);
  if (fs.existsSync(existingPath)) {
    const existing = fs.readFileSync(existingPath, "utf8");
    for (const language of ["fi", "en"]) {
      const alternate = (existing.match(/<link\b[^>]*>/g) || []).find(tag => tag.includes(`hreflang="${language}"`));
      const href = alternate?.match(/href="([^"]+)"/)?.[1];
      if (href) {
        const destination = new URL(href, siteUrl).pathname;
        html = html.replace(new RegExp(`href="[^"]+" hreflang="${language}"`), `href="${esc(destination)}" hreflang="${language}"`);
      }
    }
  }
  return html;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function fiDate(value) {
  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function cleanContent(post) {
  const title = post.title.trim();
  return post.content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== title)
    .filter((part) => part !== "AI Generation Oy")
    .filter((part) => !/^hashtag#/i.test(part));
}

function renderContent(post) {
  const blocks = cleanContent(post);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1 && lines.every((line) => /^[-→]/.test(line))) {
        const items = lines
          .map((line) => line.replace(/^[-→]\s*/, ""))
          .map((line) => `<li>${esc(line)}</li>`)
          .join("\n");
        return `<ul>\n${items}\n</ul>`;
      }
      if (lines.length > 1) {
        return lines.map((line) => `<p>${esc(line)}</p>`).join("\n");
      }
      return `<p>${esc(block)}</p>`;
    })
    .join("\n\n");
}

function excerpt(post, max = 172) {
  const text = cleanContent(post).join(" ").replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function postSlug(post) {
  return slugMap[post.title] || post.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function postImage(post) {
  return imageMap[post.title] || fallbackImage;
}

function imageMeta(imagePath) {
  const assetPath = path.join(root, imagePath.replace(/^\//, ""));
  const fallback = { width: 1536, height: 1024, className: "" };

  if (!fs.existsSync(assetPath)) return fallback;

  const buffer = fs.readFileSync(assetPath);
  let width = fallback.width;
  let height = fallback.height;

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        height = buffer.readUInt16BE(offset + 5);
        width = buffer.readUInt16BE(offset + 7);
        break;
      }
      offset += 2 + length;
    }
  }

  return {
    width,
    height,
    className: height > width ? "portrait" : "",
    frameClass: height > width ? "portrait-frame" : "",
  };
}

function absolute(pathname) {
  return `${siteUrl}${pathname}`;
}

function articleJsonLd(post, slug, image, relatedPosts) {
  const url = absolute(`/blog/${slug}/`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        description: descriptions[post.title] || excerpt(post),
        image: [absolute(image)],
        datePublished: isoDate(post.publishedAt || post.createdAt),
        dateModified: isoDate(post.updatedAt || post.publishedAt || post.createdAt),
        inLanguage: "fi-FI",
        isPartOf: { "@id": `${siteUrl}/blog/#blog` },
        mainEntityOfPage: url,
        author: { "@id": `${siteUrl}/#organization` },
        publisher: { "@id": `${siteUrl}/#organization` },
        keywords: [...new Set([...(post.hashtags || []), ...keywords])].join(", "),
        relatedLink: relatedPosts.map((item) => absolute(`/blog/${item.slug}/`)),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Etusivu", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blogi", item: `${siteUrl}/blog/` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "AI Generation Oy",
        url: siteUrl,
        logo: `${siteUrl}/assets/logo-black.png`,
      },
    ],
  };
}

function renderArticle(post, posts) {
  const slug = postSlug(post);
  const image = postImage(post);
  const imageInfo = imageMeta(image);
  const url = absolute(`/blog/${slug}/`);
  const title = `${post.title} | Aigen Blogi`;
  const desc = descriptions[post.title] || excerpt(post);
  const datePublished = post.publishedAt || post.createdAt;
  const relatedPosts = posts
    .filter((item) => postSlug(item) !== slug)
    .slice(0, 3)
    .map((item) => ({ ...item, slug: postSlug(item) }));
  const tags = [...new Set([...(post.hashtags || []), "AI-agentit"])].slice(0, 4);

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64">
  <link rel="icon" type="image/png" href="/favicon.png" sizes="192x192">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc([...new Set([...(post.hashtags || []), ...keywords])].join(", "))}">
  <meta name="author" content="AI Generation Oy">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#ffffff">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fi_FI">
  <meta property="og:site_name" content="AI Generation Oy">
  <meta property="og:title" content="${esc(post.title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${absolute(image)}">
  <meta property="og:image:alt" content="${esc(post.title)}">
  <meta property="article:published_time" content="${new Date(datePublished).toISOString()}">
  <meta property="article:modified_time" content="${new Date(post.updatedAt || datePublished).toISOString()}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(post.title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${absolute(image)}">
  <script type="application/ld+json">${JSON.stringify(articleJsonLd(post, slug, image, relatedPosts))}</script>
  <link rel="stylesheet" href="/assets/aigen-preview.css">
  <script defer src="/assets/aigen-preview.js"></script>

  <meta name="google-site-verification" content="-WtFkMpIXZlK3wpWNQvvrmWk1nLpZdkneqXFo_pVtn0">
  <!-- Google tag (gtag.js) -->
<script>
    if (["aigen.fi", "www.aigen.fi"].includes(location.hostname)) {
    const analytics = document.createElement("script");
    analytics.async = true;
    analytics.src = "https://www.googletagmanager.com/gtag/js?id=G-YFF8RBFBP3";
    document.head.appendChild(analytics);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "G-YFF8RBFBP3");
    }
  </script>
</head>
<body class="aigen-preview blog-article-page">
${renderNav(`/blog/${slug}/`)}
  <header class="blog-hero">
    <div class="hero-inner">
      <div class="breadcrumb"><a href="/">Etusivu</a> / <a href="/blog/">Blogi</a></div>
      <div class="meta-row">
        <span>${esc(fiDate(datePublished))}</span>
        ${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("\n        ")}
      </div>
      <h1>${esc(post.title)}</h1>
      <p class="lead">${esc(desc)}</p>
      <figure class="hero-image ${imageInfo.frameClass}">
        <img class="${imageInfo.className}" src="${image}" alt="${esc(post.title)}" width="${imageInfo.width}" height="${imageInfo.height}" fetchpriority="high" decoding="async">
      </figure>
    </div>
  </header>

  <main class="article" id="main" tabindex="-1">
${renderContent(post)}

    <div class="source-box">
      <strong>Lähde:</strong> AI Generation Oy:n julkaistu LinkedIn-päivitys Draftpadista. Sivun teksti on muokattu blogimuotoon samasta julkaistusta sisällöstä.
    </div>
  </main>

  <section class="related" aria-labelledby="related-title">
    <div class="related-inner">
      <h2 id="related-title">Lisää Aigenin blogista</h2>
      <div class="related-grid">
        ${relatedPosts
          .map(
            (item) => `<a class="related-card" href="/blog/${item.slug}/">
          <span>${esc(fiDate(item.publishedAt || item.createdAt))}</span>
          <strong>${esc(item.title)}</strong>
        </a>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-content">
      <img src="/assets/logo-black.png" alt="AI Generation" class="footer-logo-img" width="120" height="28" loading="lazy">
      <span>© 2026 AI Generation Oy · Aigen Blogi</span>
    </div>
  </footer>
</body>
</html>
`;
}

function renderIndex(posts) {
  const featured = posts[0];
  const desc =
    "Aigenin blogi tekoälyagenteista, automaatiosta, EU-compliancesta ja käytännön tavoista kehittää yrityksen arjen prosesseja.";
  const listSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${siteUrl}/blog/#blog`,
        name: "Aigen Blogi",
        description: desc,
        url: `${siteUrl}/blog/`,
        inLanguage: "fi-FI",
        publisher: { "@id": `${siteUrl}/#organization` },
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: absolute(`/blog/${postSlug(post)}/`),
          datePublished: isoDate(post.publishedAt || post.createdAt),
          image: absolute(postImage(post)),
        })),
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "AI Generation Oy",
        url: siteUrl,
        logo: `${siteUrl}/assets/logo-black.png`,
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64">
  <link rel="icon" type="image/png" href="/favicon.png" sizes="192x192">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aigen Blogi | AI-agentit, automaatio ja EU-compliance</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(keywords.join(", "))}">
  <meta name="author" content="AI Generation Oy">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#ffffff">
  <link rel="canonical" href="${siteUrl}/blog/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fi_FI">
  <meta property="og:title" content="Aigen Blogi">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${siteUrl}/blog/">
  <meta property="og:site_name" content="AI Generation Oy">
  <meta property="og:image" content="${absolute(postImage(featured))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Aigen Blogi">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${absolute(postImage(featured))}">
  <script type="application/ld+json">${JSON.stringify(listSchema)}</script>
  <link rel="stylesheet" href="/assets/aigen-preview.css">
  <script defer src="/assets/aigen-preview.js"></script>

  <meta name="google-site-verification" content="-WtFkMpIXZlK3wpWNQvvrmWk1nLpZdkneqXFo_pVtn0">
  <!-- Google tag (gtag.js) -->
<script>
    if (["aigen.fi", "www.aigen.fi"].includes(location.hostname)) {
    const analytics = document.createElement("script");
    analytics.async = true;
    analytics.src = "https://www.googletagmanager.com/gtag/js?id=G-YFF8RBFBP3";
    document.head.appendChild(analytics);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "G-YFF8RBFBP3");
    }
  </script>
</head>
<body class="aigen-preview blog-index-page">
${renderNav("/blog/")}
  <header class="blog-hero">
    <div class="hero-inner">
      <div class="tag">Aigen Blogi</div>
      <h1>AI-agentit, automaatio ja oikea työ yrityksen arjessa.</h1>
      <p>Julkaistuja kirjoituksia siitä, miten AI-agentit muuttuvat demoista käyttökelpoisiksi työnkuluiksi: veroihin, raportointiin, tiedonhakuun, kilpailijaseurantaan ja luotettavuuden rakentamiseen.</p>
    </div>
  </header>

  <main class="blog-list" id="main" tabindex="-1">
    <section class="posts" aria-label="Blogikirjoitukset">
      ${posts
        .map((post, index) => {
          const image = postImage(post);
          const isFallback = image === fallbackImage;
          const imageInfo = imageMeta(image);
          const imageClass = [isFallback ? "logo" : "", imageInfo.className].filter(Boolean).join(" ");
          return `<a class="post-card" href="/blog/${postSlug(post)}/">
        <div class="post-thumb"><img class="${imageClass}" src="${image}" alt="${esc(post.title)}" width="${imageInfo.width}" height="${imageInfo.height}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>
        <div>
          <div class="meta-row"><span>${esc(fiDate(post.publishedAt || post.createdAt))}</span><span class="tag">LinkedIn</span></div>
          <h2>${esc(post.title)}</h2>
          <p>${esc(descriptions[post.title] || excerpt(post))}</p>
        </div>
      </a>`;
        })
        .join("\n      ")}
    </section>

  </main>

  <footer class="site-footer">
    <div class="footer-content">
      <img src="/assets/logo-black.png" alt="AI Generation" class="footer-logo-img" width="120" height="28" loading="lazy">
      <span>© 2026 AI Generation Oy · Aigen Blogi</span>
    </div>
  </footer>
</body>
</html>
`;
}

function xmlEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function walkIndexFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name.startsWith("review")) return [];

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkIndexFiles(entryPath);
    if (entry.isFile() && entry.name === "index.html") return [entryPath];
    return [];
  });
}

function locForIndexFile(filePath) {
  const relative = path.relative(root, filePath).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/index\.html$/, "")}`;
}

function shouldIncludeInSitemap(filePath) {
  return !fs.readFileSync(filePath, "utf8").match(/<meta\s+name=["']robots["'][^>]*noindex/i);
}

function lastModifiedDate(filePath) {
  const relative = path.relative(root, filePath);

  try {
    const result = execFileSync("git", ["log", "-1", "--format=%cs", "--", relative], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (result) return result;
  } catch {
    // Fall back to file mtime when git metadata is unavailable.
  }

  return isoDate(fs.statSync(filePath).mtime);
}

function sitemapHints(loc) {
  if (loc === "/") return { changefreq: "daily", priority: "1.0" };
  if (loc === "/blog/") return { changefreq: "weekly", priority: "0.9" };
  if (loc === "/en/") return { changefreq: "monthly", priority: "0.8" };
  if (loc.includes("/blog/")) return { changefreq: "weekly", priority: "0.7" };
  return { changefreq: "monthly", priority: "0.8" };
}

function sitemapSortKey(item) {
  if (item.loc === "/") return "00";
  if (item.loc === "/blog/") return "01";
  if (item.loc === "/en/") return "02";
  if (item.loc.startsWith("/blog/")) return `10${item.loc}`;
  if (item.loc.startsWith("/en/blog/")) return `11${item.loc}`;
  if (item.loc.startsWith("/en/")) return `20${item.loc}`;
  return `30${item.loc}`;
}

function renderSitemap() {
  const allUrls = walkIndexFiles(root)
    .filter(shouldIncludeInSitemap)
    .map((filePath) => {
      const loc = locForIndexFile(filePath);
      return {
        loc,
        lastmod: lastModifiedDate(filePath),
        ...sitemapHints(loc),
      };
    })
    .sort((a, b) => sitemapSortKey(a).localeCompare(sitemapSortKey(b)));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${xmlEsc(absolute(loc))}</loc>
    <lastmod>${xmlEsc(lastmod)}</lastmod>
    <changefreq>${xmlEsc(changefreq)}</changefreq>
    <priority>${xmlEsc(priority)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function preserveExistingSeo(filePath, generated) {
  if (!fs.existsSync(filePath)) return generated;
  const oldHead = fs.readFileSync(filePath, "utf8").match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  if (!oldHead) return generated;
  const seoTags = /<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b(?=[^>]*\brel=["'](?:canonical|alternate|icon)["'])[^>]*>|<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi;
  const tags = oldHead.match(seoTags) || [];
  return generated.replace(/<head>([\s\S]*?)<\/head>/i, (_, head) => `<head>\n${tags.join("\n")}\n${head.replace(seoTags, "")}\n</head>`);
}

function build() {
  const posts = JSON.parse(fs.readFileSync(sourcePath, "utf8"))
    .filter((post) => post.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.updatedAt || b.createdAt) -
        new Date(a.publishedAt || a.updatedAt || a.createdAt)
    );

  for (const post of posts) {
    const slug = postSlug(post);
    const dir = path.join(root, "blog", slug);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "index.html");
    fs.writeFileSync(filePath, preserveExistingSeo(filePath, renderArticle(post, posts)));
  }

  const indexPath = path.join(root, "blog", "index.html");
  fs.writeFileSync(indexPath, preserveExistingSeo(indexPath, renderIndex(posts)));
  fs.writeFileSync(path.join(root, "sitemap.xml"), renderSitemap(posts));

  console.log(`Built ${posts.length} blog posts from Draftpad published LinkedIn data.`);
}

if (require.main === module) build();
module.exports = { renderArticle, renderIndex, renderSitemap, preserveExistingSeo, walkIndexFiles };
