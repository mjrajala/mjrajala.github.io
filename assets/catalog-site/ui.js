/* Shared UI: mobile menu, app card renderer, counts, related apps, blog tag filter, click-to-load video.
   Language comes from <html lang>. No dependencies, no tracking. */
(function () {
  "use strict";

  var catalog = window.AIGEN_CATALOG || { apps: [], categories: [], statuses: [], audiences: [] };
  var LANG = document.documentElement.lang === "en" ? "en" : "fi";

  var T = {
    fi: {
      view: "Katso sovellus", plan: "Lue suunnitelmasta", notYet: "Ei vielä saatavilla",
      srComing: " (tulossa, ei vielä saatavilla)", catalog: "/sovellukset/"
    },
    en: {
      view: "View app", plan: "Read the plan", notYet: "Not available yet",
      srComing: " (coming, not available yet)", catalog: "/en/apps/"
    }
  }[LANG];

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function label(item) { return item ? item[LANG] : ""; }
  function text(app) { return app[LANG] || app.fi; }

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }

  /* One card = one link (stretched over the card). Used by the catalog and related lists. */
  function renderCard(app, headingLevel) {
    var t = text(app);
    var li = el("li", "app-card status-" + app.status);
    li.setAttribute("data-app", app.id);

    var top = el("div", "app-top");
    var icon = el("span", "app-icon");
    icon.setAttribute("aria-hidden", "true");
    if (app.icon) {
      var img = el("img");
      img.src = app.icon; img.alt = ""; img.width = 48; img.height = 48;
      img.loading = "lazy"; img.decoding = "async";
      icon.appendChild(img);
    } else {
      icon.className += " app-monogram";
      icon.textContent = app.name.charAt(0);
    }
    top.appendChild(icon);
    top.appendChild(el("span", "status-badge status-badge-" + app.status, label(byId(catalog.statuses, app.status))));
    li.appendChild(top);

    li.appendChild(el("p", "app-use", t.useCase));
    var h = el("h" + (headingLevel || 3), "app-name");
    var a = el("a", "app-link", app.name);
    a.href = app.path[LANG];
    h.appendChild(a);
    if (app.status === "tulossa") a.appendChild(el("span", "visually-hidden", T.srComing));
    li.appendChild(h);
    li.appendChild(el("p", "app-summary", t.summary));

    var meta = app.categories.map(function (id) { return label(byId(catalog.categories, id)); });
    if (t.language) meta.push(t.language);
    li.appendChild(el("p", "app-meta", meta.join(" · ")));

    var foot = el("div", "app-foot");
    var price = el("p", "app-price");
    if (t.price) {
      price.appendChild(el("b", null, t.price.amount));
      price.appendChild(document.createTextNode(" " + t.price.unit));
      if (t.price.note) price.appendChild(el("small", null, t.price.note));
    } else if (app.status === "tulossa") {
      price.appendChild(el("span", "price-muted", T.notYet));
    }
    foot.appendChild(price);
    var go = el("span", "app-go", app.status === "tulossa" ? T.plan : T.view);
    go.setAttribute("aria-hidden", "true");
    foot.appendChild(go);
    li.appendChild(foot);
    return li;
  }

  window.AigenUI = { catalog: catalog, lang: LANG, renderCard: renderCard, byId: byId, label: label, text: text };

  /* Mobile menu */
  var button = document.querySelector(".menu-button");
  var nav = document.getElementById("paavalikko");
  if (button && nav) {
    var setOpen = function (open) {
      button.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    button.addEventListener("click", function () { setOpen(button.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); button.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !button.contains(e.target)) setOpen(false);
    });
  }

  /* Counts: [data-count-category="id"], [data-count-audience="id" or ""] */
  document.querySelectorAll("[data-count-category]").forEach(function (node) {
    var id = node.getAttribute("data-count-category");
    node.textContent = String(catalog.apps.filter(function (a) { return a.categories.indexOf(id) !== -1; }).length);
  });
  document.querySelectorAll("[data-count-audience]").forEach(function (node) {
    var id = node.getAttribute("data-count-audience");
    node.textContent = String(catalog.apps.filter(function (a) { return !id || a.audience === id; }).length);
  });

  /* Related apps on detail pages: <ul data-related="ilmoo"> */
  document.querySelectorAll("[data-related]").forEach(function (list) {
    var current = byId(catalog.apps, list.getAttribute("data-related"));
    if (!current) return;
    var related = catalog.apps.filter(function (a) {
      return a.id !== current.id && a.audience === current.audience &&
        a.categories.some(function (c) { return current.categories.indexOf(c) !== -1; });
    });
    if (!related.length) {
      related = catalog.apps.filter(function (a) { return a.id !== current.id && a.audience === current.audience; });
    }
    related = related.slice(0, 3);
    if (!related.length) { list.hidden = true; return; }
    list.textContent = "";
    related.forEach(function (app) { list.appendChild(renderCard(app, 3)); });
  });

  /* Blog tag filter: buttons [data-tag] inside .tag-filter, cards [data-tags] */
  var tagBar = document.querySelector(".tag-filter");
  if (tagBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tags]"));
    var status = document.getElementById("tag-status");
    tagBar.hidden = false;
    tagBar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-tag]");
      if (!b) return;
      var tag = b.getAttribute("data-tag");
      tagBar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var shown = 0;
      cards.forEach(function (c) {
        var on = !tag || c.getAttribute("data-tags").split("|").indexOf(tag) !== -1;
        c.hidden = !on; if (on) shown++;
      });
      if (status) status.textContent = (LANG === "en" ? shown + (shown === 1 ? " article" : " articles") : shown + (shown === 1 ? " kirjoitus" : " kirjoitusta"));
    });
  }

  /* Table of contents: open on wide screens, collapsed on phones */
  if (window.matchMedia("(min-width: 900px)").matches) {
    document.querySelectorAll("details[data-open-wide]").forEach(function (d) { d.open = true; });
  }

  /* Click-to-load video: <div class="video" data-video-id="..."> with a button; nothing loads before the click. */
  document.querySelectorAll("[data-video-id]").forEach(function (box) {
    var btn = box.querySelector("button");
    if (!btn) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + box.getAttribute("data-video-id") + "?autoplay=1";
      f.title = box.getAttribute("data-video-title") || "Video";
      f.allow = "encrypted-media; fullscreen; picture-in-picture; autoplay";
      f.allowFullscreen = true;
      f.loading = "lazy";
      box.textContent = "";
      box.appendChild(f);
      f.focus();
    });
  });
})();
