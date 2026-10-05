/* Shared UI: mobile menu, app card renderer, homepage counts, related apps. No dependencies. */
(function () {
  "use strict";

  var catalog = window.AIGEN_CATALOG || { apps: [], categories: [], statuses: [], audiences: [] };
  var CATALOG_URL = "/testi-sivu3/sovellukset/";

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function linkLabel(app) {
    if (app.status === "tulossa") return "Lue suunnitelmasta";
    if (app.link === "external") return app.href.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (app.link === "detail") return "Katso sovellus";
    return "Lue lisää";
  }

  /* One card = one link (stretched over the card). Used by the catalog and related lists. */
  function renderCard(app, headingLevel) {
    var li = el("li", "app-card status-" + app.status);
    li.setAttribute("data-app", app.id);

    var top = el("div", "app-top");
    var icon = el("span", "app-icon");
    icon.setAttribute("aria-hidden", "true");
    if (app.icon) {
      var img = el("img");
      img.src = app.icon;
      img.alt = "";
      img.width = 48;
      img.height = 48;
      img.loading = "lazy";
      img.decoding = "async";
      icon.appendChild(img);
    } else {
      icon.className += " app-monogram";
      icon.textContent = app.name.charAt(0);
    }
    top.appendChild(icon);
    var status = byId(catalog.statuses, app.status);
    top.appendChild(el("span", "status-badge status-badge-" + app.status, status ? status.label : app.status));
    li.appendChild(top);

    li.appendChild(el("p", "app-use", app.useCase));

    var h = el("h" + (headingLevel || 3), "app-name");
    var a = el("a", "app-link", app.name);
    a.href = app.href;
    if (app.link === "external") a.rel = "noopener";
    h.appendChild(a);
    li.appendChild(h);

    li.appendChild(el("p", "app-summary", app.summary));

    var meta = el("p", "app-meta");
    var labels = app.categories.map(function (id) {
      var c = byId(catalog.categories, id);
      return c ? c.label : id;
    });
    if (app.language) labels.push(app.language);
    meta.textContent = labels.join(" · ");
    li.appendChild(meta);

    var foot = el("div", "app-foot");
    var price = el("p", "app-price");
    if (app.price) {
      price.appendChild(el("b", null, app.price.amount));
      price.appendChild(document.createTextNode(" " + app.price.unit));
      if (app.price.note) price.appendChild(el("small", null, app.price.note));
    } else if (app.status === "tulossa") {
      price.appendChild(el("span", "price-muted", "Ei vielä saatavilla"));
    }
    foot.appendChild(price);
    var go = el("span", "app-go", linkLabel(app));
    go.setAttribute("aria-hidden", "true");
    foot.appendChild(go);
    li.appendChild(foot);

    if (app.link === "external") {
      var sr = el("span", "visually-hidden", " (" + linkLabel(app) + ", toinen sivusto)");
      a.appendChild(sr);
    } else if (app.status === "tulossa") {
      a.appendChild(el("span", "visually-hidden", " (tulossa, ei vielä saatavilla)"));
    }
    return li;
  }

  window.AigenUI = { catalog: catalog, renderCard: renderCard, byId: byId, CATALOG_URL: CATALOG_URL };

  /* Mobile menu */
  var button = document.querySelector(".menu-button");
  var nav = document.getElementById("paavalikko");
  if (button && nav) {
    var setOpen = function (open) {
      button.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    button.addEventListener("click", function () {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); button.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !button.contains(e.target)) setOpen(false);
    });
  }

  /* Counts next to category links and "all apps" links: [data-count-category], [data-count-audience] */
  document.querySelectorAll("[data-count-category]").forEach(function (node) {
    var id = node.getAttribute("data-count-category");
    var n = catalog.apps.filter(function (a) { return a.categories.indexOf(id) !== -1; }).length;
    node.textContent = String(n);
  });
  document.querySelectorAll("[data-count-audience]").forEach(function (node) {
    var id = node.getAttribute("data-count-audience");
    var n = catalog.apps.filter(function (a) { return !id || a.audience === id; }).length;
    node.textContent = String(n);
  });

  /* Related apps on detail pages: <ul data-related="ilmoo"> */
  document.querySelectorAll("[data-related]").forEach(function (list) {
    var current = byId(catalog.apps, list.getAttribute("data-related"));
    if (!current) return;
    var related = catalog.apps.filter(function (a) {
      return a.id !== current.id && a.audience === current.audience &&
        a.categories.some(function (c) { return current.categories.indexOf(c) !== -1; });
    }).slice(0, 3);
    if (!related.length) { list.closest("section").hidden = true; return; }
    list.textContent = "";
    related.forEach(function (app) { list.appendChild(renderCard(app, 3)); });
  });
})();
