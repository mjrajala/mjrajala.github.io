const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath =
  process.argv[2] || path.join(root, "blog", "linkedin-posts.json");
const siteUrl = "https://aigen.fi";

const slugMap = {
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
  "Annoimme AI-agentin tehdä yrityksen veroilmoituksen":
    "/assets/blog/veroilmoitus-ai-agentti.jpg",
  "Mallivertailu on helppo tarina. Agenttityössä workflow ratkaisee.":
    "/assets/blog/agenttityo-workflow.jpg",
};

const fallbackImage = "/assets/logo-slogan.png";

const descriptions = {
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

const nav = `
  <nav class="nav" aria-label="Päänavigaatio">
    <div class="nav-container">
      <a href="/" class="nav-logo" aria-label="AI Generation etusivu"><img src="/assets/logo-black.png" alt="AI Generation" class="nav-logo-img" width="120" height="28"></a>
      <div class="nav-links">
        <a href="/#services">Palvelut</a>
        <a href="/#tools">EU-työkalut</a>
        <a href="/blog/" aria-current="page">Blogi</a>
        <a href="/#products">Tuotteet</a>
        <a href="/#about">Meistä</a>
        <a href="/#contact">Yhteystiedot</a>
        <a href="/en/" class="nav-lang" hreflang="en">EN</a>
      </div>
    </div>
  </nav>`;

const sharedCss = `
    :root {
      --bg: #ffffff;
      --bg-soft: #f6f7f8;
      --text: #171717;
      --text-muted: #5f6368;
      --accent: #171717;
      --border: #dedede;
      --card: #ffffff;
      --radius: 8px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    img { max-width: 100%; height: auto; }
    a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    .nav {
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 100;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .nav-container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
    }
    .nav-logo { display: flex; align-items: center; text-decoration: none; }
    .nav-logo-img { height: 28px; width: auto; max-width: 120px; }
    .nav-links { display: flex; gap: 30px; align-items: center; }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .nav-links a:hover,
    .nav-links a[aria-current="page"] { color: var(--text); }
    .nav-lang {
      font-size: 0.82rem;
      font-weight: 700;
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 4px;
      margin-left: 10px;
    }
    .site-footer {
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      padding: 32px 24px;
      font-size: 0.9rem;
    }
    .footer-content {
      max-width: 1120px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .footer-logo-img { height: 24px; width: auto; }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      align-items: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 650;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border);
      background: #fff;
      border-radius: 999px;
      padding: 0.28rem 0.65rem;
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
    }
    @media (max-width: 820px) {
      .nav-links { display: none; }
      .nav-container { padding: 0 20px; }
      .footer-content { flex-direction: column; text-align: center; }
    }`;

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(articleJsonLd(post, slug, image, relatedPosts))}</script>
  <style>
${sharedCss}
    .hero {
      padding: 136px 24px 44px;
      background: linear-gradient(180deg, #ffffff 0%, #f5f6f7 100%);
      border-bottom: 1px solid var(--border);
    }
    .hero-inner,
    .article,
    .related-inner {
      max-width: 900px;
      margin: 0 auto;
    }
    .breadcrumb {
      margin-bottom: 1rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .breadcrumb a { text-decoration: none; color: var(--text-muted); }
    h1 {
      max-width: 860px;
      font-size: clamp(2.05rem, 5vw, 3.55rem);
      line-height: 1.08;
      letter-spacing: 0;
      margin: 1rem 0;
    }
    .lead {
      color: var(--text-muted);
      font-size: 1.15rem;
      max-width: 760px;
      margin-top: 1rem;
    }
    .hero-image {
      max-width: 900px;
      margin: 28px auto 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-soft);
      aspect-ratio: 3 / 2;
      display: grid;
      place-items: center;
    }
    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: ${image === fallbackImage ? "contain" : "cover"};
      padding: ${image === fallbackImage ? "8%" : "0"};
    }
    .article {
      padding: 54px 24px 70px;
    }
    .article p,
    .article li {
      color: #2a2d2f;
      font-size: 1.04rem;
    }
    .article p + p { margin-top: 1.1rem; }
    .article ul {
      margin: 1.1rem 0 1.35rem;
      padding-left: 1.3rem;
    }
    .article li + li { margin-top: 0.45rem; }
    .source-box {
      margin-top: 2.3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .related {
      padding: 0 24px 76px;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    .related-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      text-decoration: none;
      background: #fff;
      transition: transform 0.2s, border-color 0.2s;
    }
    .related-card:hover { transform: translateY(-2px); border-color: #171717; }
    .related-card span { display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.35rem; }
    .related-card strong { display: block; line-height: 1.25; }
    @media (max-width: 820px) {
      .hero { padding: 108px 20px 36px; }
      .article { padding: 38px 20px 54px; }
      .related { padding: 0 20px 56px; }
      .related-grid { grid-template-columns: 1fr; }
      .hero-image { margin-top: 22px; }
      .article p,
      .article li { font-size: 1rem; }
    }
  </style>
</head>
<body>
${nav}
  <header class="hero">
    <div class="hero-inner">
      <div class="breadcrumb"><a href="/">Etusivu</a> / <a href="/blog/">Blogi</a></div>
      <div class="meta-row">
        <span>${esc(fiDate(datePublished))}</span>
        ${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("\n        ")}
      </div>
      <h1>${esc(post.title)}</h1>
      <p class="lead">${esc(desc)}</p>
      <figure class="hero-image">
        <img src="${image}" alt="${esc(post.title)}" width="1536" height="1024" fetchpriority="high" decoding="async">
      </figure>
    </div>
  </header>

  <main class="article">
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(listSchema)}</script>
  <style>
${sharedCss}
    .hero {
      padding: 144px 24px 58px;
      background: #fff;
      border-bottom: 1px solid var(--border);
    }
    .hero-inner,
    .blog-list {
      max-width: 1120px;
      margin: 0 auto;
    }
    .hero h1 {
      max-width: 840px;
      font-size: clamp(2.2rem, 5vw, 3.7rem);
      line-height: 1.05;
      letter-spacing: 0;
      margin: 1rem 0;
    }
    .hero p {
      max-width: 760px;
      color: var(--text-muted);
      font-size: 1.13rem;
    }
    .blog-list {
      padding: 54px 24px 78px;
      display: grid;
      grid-template-columns: 1.7fr 0.8fr;
      gap: 1.4rem;
      align-items: start;
    }
    .posts {
      display: grid;
      gap: 1rem;
    }
    .post-card {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1.2rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: #fff;
      text-decoration: none;
      transition: transform 0.2s, border-color 0.2s;
    }
    .post-card:hover { transform: translateY(-2px); border-color: #171717; }
    .post-thumb {
      aspect-ratio: 3 / 2;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-soft);
      overflow: hidden;
      display: grid;
      place-items: center;
    }
    .post-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .post-thumb img.logo { object-fit: contain; padding: 10%; }
    .post-card h2 { font-size: 1.28rem; line-height: 1.22; margin: 0.55rem 0 0.55rem; }
    .post-card p { color: var(--text-muted); }
    .aside {
      position: sticky;
      top: 88px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-soft);
      padding: 1.2rem;
    }
    .aside h2 { font-size: 1.05rem; margin-bottom: 0.65rem; }
    .aside p { color: var(--text-muted); font-size: 0.95rem; }
    .aside a { font-weight: 750; }
    @media (max-width: 900px) {
      .hero { padding: 110px 20px 42px; }
      .blog-list { grid-template-columns: 1fr; padding: 38px 20px 58px; }
      .post-card { grid-template-columns: 1fr; }
      .aside { position: static; }
    }
  </style>
</head>
<body>
${nav}
  <header class="hero">
    <div class="hero-inner">
      <div class="tag">Aigen Blogi</div>
      <h1>AI-agentit, automaatio ja oikea työ yrityksen arjessa.</h1>
      <p>Julkaistuja kirjoituksia siitä, miten AI-agentit muuttuvat demoista käyttökelpoisiksi työnkuluiksi: veroihin, raportointiin, tiedonhakuun, kilpailijaseurantaan ja luotettavuuden rakentamiseen.</p>
    </div>
  </header>

  <main class="blog-list">
    <section class="posts" aria-label="Blogikirjoitukset">
      ${posts
        .map((post, index) => {
          const image = postImage(post);
          const isFallback = image === fallbackImage;
          return `<a class="post-card" href="/blog/${postSlug(post)}/">
        <div class="post-thumb"><img class="${isFallback ? "logo" : ""}" src="${image}" alt="${esc(post.title)}" width="1536" height="1024" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>
        <div>
          <div class="meta-row"><span>${esc(fiDate(post.publishedAt || post.createdAt))}</span><span class="tag">LinkedIn</span></div>
          <h2>${esc(post.title)}</h2>
          <p>${esc(descriptions[post.title] || excerpt(post))}</p>
        </div>
      </a>`;
        })
        .join("\n      ")}
    </section>

    <aside class="aside">
      <h2>Mistä nämä tekstit tulevat?</h2>
      <p>Nämä ovat AI Generation Oy:n julkaistuja LinkedIn-sisältöjä, nostettuna blogiin pysyväksi hakukoneystävälliseksi sisällöksi kuvien, metadatan, canonical-linkkien ja schema-merkintöjen kanssa.</p>
      <p style="margin-top:0.8rem;"><a href="/#contact">Kysy, miten sama tehdään omalle yritykselle.</a></p>
    </aside>
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

function renderSitemap(posts) {
  const staticUrls = [
    ["/", "daily", "1.0"],
    ["/blog/", "weekly", "0.9"],
    ["/tuotteet/tasapay/", "monthly", "0.8"],
    ["/tuotteet/cbam-tool/", "monthly", "0.8"],
    ["/tuotteet/ilmoita/", "monthly", "0.8"],
    ["/tuotteet/gpsrdocs/", "monthly", "0.8"],
  ];
  const articleUrls = posts.map((post) => [
    `/blog/${postSlug(post)}/`,
    "monthly",
    "0.85",
    isoDate(post.updatedAt || post.publishedAt || post.createdAt),
  ]);
  const allUrls = [
    ...staticUrls.map(([loc, changefreq, priority]) => [
      loc,
      changefreq,
      priority,
      isoDate(new Date()),
    ]),
    ...articleUrls,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ([loc, changefreq, priority, lastmod]) => `  <url>
    <loc>${absolute(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

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
  fs.writeFileSync(path.join(dir, "index.html"), renderArticle(post, posts));
}

fs.writeFileSync(path.join(root, "blog", "index.html"), renderIndex(posts));
fs.writeFileSync(path.join(root, "sitemap.xml"), renderSitemap(posts));

console.log(`Built ${posts.length} blog posts from Draftpad published LinkedIn data.`);
