/* Catalog page: search, audience views, task categories, status filter, sort, URL state, mobile filter panel.
   Works for FI and EN; language comes from <html lang>. */
(function () {
  "use strict";

  var UI = window.AigenUI;
  var root = document.getElementById("katalogi");
  if (!UI || !root) return;

  var LANG = UI.lang;
  var data = UI.catalog;
  var PAGE_SIZE = 24; // "Show more" appears only when a view has more apps than this
  var STATUS_RANK = { saatavilla: 0, beta: 1, tulossa: 2 };
  var DEFAULT_AUDIENCE = data.audiences[0].id;

  var S = {
    fi: {
      p: { q: "q", audience: "kohde", task: "tehtava", status: "tila", sort: "jarjestys", byName: "nimi" },
      count: function (n) { return n === 1 ? "1 sovellus" : n + " sovellusta"; },
      more: "Näytä lisää", allTasks: "Kaikki tehtävät", search: "Haku: ", remove: "Poista rajaus: ",
      none: "Ei tuloksia – sulje", show: "Näytä ",
      emptyQ: function (q) { return "Haulla ”" + q + "” ei löytynyt sovelluksia näillä valinnoilla."; },
      empty: "Näillä valinnoilla ei löytynyt sovelluksia.",
      other: function (n, label) { return "Näytä " + n + (n === 1 ? " osuma" : " osumaa") + " kohdasta " + label; }
    },
    en: {
      p: { q: "q", audience: "audience", task: "task", status: "status", sort: "sort", byName: "name" },
      count: function (n) { return n === 1 ? "1 app" : n + " apps"; },
      more: "Show more", allTasks: "All tasks", search: "Search: ", remove: "Remove filter: ",
      none: "No results – close", show: "Show ",
      emptyQ: function (q) { return "No apps match “" + q + "” with these filters."; },
      empty: "No apps match these filters.",
      other: function (n, label) { return "Show " + n + (n === 1 ? " match" : " matches") + " in " + label; }
    }
  }[LANG];

  var $ = function (id) { return document.getElementById(id); };
  var input = $("haku-kentta"), clearBtn = $("haku-tyhjenna"), list = $("sovellukset"), countEl = $("tulos-maara");
  var moreBtn = $("nayta-lisaa"), empty = $("tyhja"), emptyText = $("tyhja-teksti"), otherHint = $("muut-osumat");
  var activeList = $("aktiiviset"), catBox = $("tehtava-valinnat"), statusBox = $("tila-valinnat"), sortSel = $("jarjestys");
  var panel = $("suodattimet"), openBtn = $("avaa-suodattimet"), openBadge = $("suodatin-maara");
  var closeBtn = $("sulje-suodattimet"), applyBtn = $("nayta-tulokset");
  var resetBtns = document.querySelectorAll("[data-reset]");
  var audienceBtns = root.querySelectorAll("[data-audience]");

  function slugOf(item) { return item.slug[LANG]; }
  function fromSlug(list, slug) {
    for (var i = 0; i < list.length; i++) if (list[i].slug[LANG] === slug || list[i].id === slug) return list[i];
    return null;
  }

  /* ---------- State <-> URL ---------- */
  var state = readUrl();

  function readUrl() {
    var p = new URLSearchParams(location.search);
    var aud = fromSlug(data.audiences, p.get(S.p.audience) || "");
    var audience = aud ? aud.id : DEFAULT_AUDIENCE;
    var c = fromSlug(data.categories, p.get(S.p.task) || "");
    if (c) audience = c.audience; // a category link decides the view
    var statuses = (p.get(S.p.status) || "").split(",").map(function (s) { var st = fromSlug(data.statuses, s); return st && st.id; }).filter(Boolean);
    return {
      q: (p.get(S.p.q) || "").slice(0, 80),
      audience: audience,
      category: c ? c.id : "",
      statuses: statuses,
      sort: p.get(S.p.sort) === S.p.byName ? "nimi" : "suositellut",
      limit: PAGE_SIZE
    };
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q.trim()) p.set(S.p.q, state.q.trim());
    if (state.audience !== DEFAULT_AUDIENCE) p.set(S.p.audience, slugOf(UI.byId(data.audiences, state.audience)));
    if (state.category) p.set(S.p.task, slugOf(UI.byId(data.categories, state.category)));
    if (state.statuses.length) p.set(S.p.status, state.statuses.map(function (s) { return slugOf(UI.byId(data.statuses, s)); }).join(","));
    if (state.sort !== "suositellut") p.set(S.p.sort, S.p.byName);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  /* ---------- Search (current language only) ---------- */
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  var index = data.apps.map(function (app, order) {
    var t = UI.text(app);
    var cats = app.categories.map(function (id) { return UI.label(UI.byId(data.categories, id)); });
    return { app: app, order: order, name: norm(app.name), use: norm(t.useCase),
      text: norm([app.name, t.useCase, t.summary, t.keywords, cats.join(" "), t.language].join(" ")) };
  });

  function tokens(q) { return norm(q).split(/[\s,]+/).filter(Boolean); }
  // Words inflect (especially in Finnish), so a long token also matches by its stem ("päästöjen" -> "paasto").
  function hit(hay, t) {
    if (hay.indexOf(t) !== -1) return true;
    return t.length >= 5 && hay.indexOf(t.slice(0, Math.max(4, t.length - 3))) !== -1;
  }
  function score(entry, toks) {
    if (!toks.length) return 0;
    var s = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (!hit(entry.text, t)) return -1;
      if (entry.name.indexOf(t) === 0) s += 6; else if (hit(entry.name, t)) s += 4;
      if (hit(entry.use, t)) s += 3;
      s += 1;
    }
    return s;
  }
  function matches(opts) {
    var toks = tokens(state.q), out = [];
    index.forEach(function (e) {
      var a = e.app;
      if (opts.audience && a.audience !== opts.audience) return;
      if (opts.category && a.categories.indexOf(opts.category) === -1) return;
      if (opts.statuses && opts.statuses.length && opts.statuses.indexOf(a.status) === -1) return;
      var sc = score(e, toks);
      if (sc >= 0) out.push({ e: e, score: sc });
    });
    return out;
  }
  function sortResults(rows) {
    if (state.sort === "nimi") return rows.sort(function (a, b) { return a.e.app.name.localeCompare(b.e.app.name, LANG); });
    return rows.sort(function (a, b) {
      return (STATUS_RANK[a.e.app.status] - STATUS_RANK[b.e.app.status]) || (b.score - a.score) ||
        ((a.e.app.featured || 99) - (b.e.app.featured || 99)) || (a.e.order - b.e.order);
    });
  }

  /* ---------- Filter controls (rebuilt per audience, counts are faceted) ---------- */
  function option(type, name, value, text, count, checked) {
    var wrap = document.createElement("label");
    wrap.className = "choice";
    var inp = document.createElement("input");
    inp.type = type; inp.name = name; inp.value = value; inp.checked = checked;
    inp.disabled = count === 0 && !checked;
    var t = document.createElement("span"); t.className = "choice-label"; t.textContent = text;
    var n = document.createElement("span"); n.className = "choice-count"; n.textContent = count;
    wrap.appendChild(inp); wrap.appendChild(t); wrap.appendChild(n);
    if (inp.disabled) wrap.classList.add("is-disabled");
    return wrap;
  }

  function renderControls() {
    var ae = document.activeElement;
    var focused = ae && (ae.name === "tehtava" || ae.name === "tila") ? ae.name + ":" + ae.value : null;

    catBox.textContent = "";
    catBox.appendChild(option("radio", "tehtava", "", S.allTasks,
      matches({ audience: state.audience, statuses: state.statuses }).length, state.category === ""));
    data.categories.filter(function (c) { return c.audience === state.audience; }).forEach(function (c) {
      catBox.appendChild(option("radio", "tehtava", c.id, UI.label(c),
        matches({ audience: state.audience, category: c.id, statuses: state.statuses }).length, state.category === c.id));
    });

    statusBox.textContent = "";
    data.statuses.forEach(function (s) {
      var used = data.apps.some(function (a) { return a.audience === state.audience && a.status === s.id; });
      if (!used) return; // e.g. no beta apps in this view
      statusBox.appendChild(option("checkbox", "tila", s.id, UI.label(s),
        matches({ audience: state.audience, category: state.category, statuses: [s.id] }).length, state.statuses.indexOf(s.id) !== -1));
    });

    if (focused) {
      var parts = focused.split(":");
      var box = parts[0] === "tila" ? statusBox : catBox;
      var sel = box.querySelector('input[value="' + parts[1] + '"]');
      if (sel) sel.focus();
    }

    audienceBtns.forEach(function (btn) {
      var id = btn.getAttribute("data-audience");
      btn.setAttribute("aria-pressed", String(id === state.audience));
      var n = btn.querySelector("[data-audience-count]");
      if (n) n.textContent = matches({ audience: id }).length;
    });
  }

  /* ---------- Results ---------- */
  var announceTimer;
  function render() {
    renderControls();
    var rows = sortResults(matches({ audience: state.audience, category: state.category, statuses: state.statuses }));
    var total = rows.length;

    list.textContent = "";
    var frag = document.createDocumentFragment();
    rows.slice(0, state.limit).forEach(function (r) { frag.appendChild(UI.renderCard(r.e.app, 3)); });
    list.appendChild(frag);

    var remaining = total - Math.min(total, state.limit);
    moreBtn.hidden = remaining <= 0;
    moreBtn.textContent = S.more + " (" + remaining + ")";

    var label = S.count(total);
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { countEl.textContent = label; }, state.q ? 350 : 0);
    applyBtn.textContent = total === 0 ? S.none : S.show + label;

    var otherId = state.audience === "muut" ? "yritykset" : "muut";
    var otherHits = state.q.trim() ? matches({ audience: otherId }).length : 0;
    empty.hidden = total !== 0;
    list.hidden = total === 0;
    if (total === 0) emptyText.textContent = state.q.trim() ? S.emptyQ(state.q.trim()) : S.empty;
    otherHint.hidden = otherHits === 0;
    if (otherHits) {
      var b = otherHint.querySelector("button");
      b.textContent = S.other(otherHits, UI.label(UI.byId(data.audiences, otherId)));
      b.setAttribute("data-switch", otherId);
    }
    clearBtn.hidden = !state.q;
    renderActive();
    writeUrl();
  }

  function renderActive() {
    activeList.textContent = "";
    var items = [];
    if (state.q.trim()) items.push({ label: S.search + state.q.trim(), clear: function () { state.q = ""; input.value = ""; } });
    if (state.category) items.push({ label: UI.label(UI.byId(data.categories, state.category)), clear: function () { state.category = ""; } });
    state.statuses.forEach(function (s) {
      items.push({ label: UI.label(UI.byId(data.statuses, s)), clear: function () { state.statuses = state.statuses.filter(function (x) { return x !== s; }); } });
    });
    items.forEach(function (it) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip";
      var t = document.createElement("span"); t.textContent = it.label;
      var x = document.createElement("span"); x.className = "chip-x"; x.setAttribute("aria-hidden", "true"); x.textContent = "×";
      b.appendChild(t); b.appendChild(x);
      b.setAttribute("aria-label", S.remove + it.label);
      b.addEventListener("click", function () { it.clear(); state.limit = PAGE_SIZE; render(); input.focus(); });
      li.appendChild(b); activeList.appendChild(li);
    });
    activeList.parentElement.hidden = items.length === 0;
    var n = (state.category ? 1 : 0) + state.statuses.length;
    openBadge.textContent = n ? String(n) : "";
    openBadge.hidden = !n;
  }

  /* ---------- Events ---------- */
  var typing;
  input.value = state.q;
  input.addEventListener("input", function () {
    clearTimeout(typing);
    typing = setTimeout(function () { state.q = input.value; state.limit = PAGE_SIZE; render(); }, 90);
  });
  $("haku").addEventListener("submit", function (e) {
    e.preventDefault();
    state.q = input.value; render();
    if (window.matchMedia("(max-width: 899px)").matches) input.blur(); // close the phone keyboard to reveal results
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && input.value) { e.preventDefault(); input.value = ""; state.q = ""; render(); }
  });
  clearBtn.addEventListener("click", function () { input.value = ""; state.q = ""; render(); input.focus(); });
  catBox.addEventListener("change", function (e) {
    if (e.target.name === "tehtava") { state.category = e.target.value; state.limit = PAGE_SIZE; render(); }
  });
  statusBox.addEventListener("change", function (e) {
    if (e.target.name !== "tila") return;
    state.statuses = Array.prototype.map.call(statusBox.querySelectorAll("input:checked"), function (i) { return i.value; });
    state.limit = PAGE_SIZE; render();
  });
  sortSel.value = state.sort;
  sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });

  function switchAudience(id) {
    if (id === state.audience) return;
    state.audience = id; state.category = ""; state.statuses = []; state.limit = PAGE_SIZE; render();
  }
  audienceBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { switchAudience(btn.getAttribute("data-audience")); });
  });
  otherHint.querySelector("button").addEventListener("click", function (e) {
    switchAudience(e.currentTarget.getAttribute("data-switch"));
    var first = list.querySelector("a");
    if (first) first.focus();
  });
  resetBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      state.q = ""; input.value = ""; state.category = ""; state.statuses = []; state.sort = "suositellut";
      sortSel.value = "suositellut"; state.limit = PAGE_SIZE; render(); input.focus();
    });
  });
  moreBtn.addEventListener("click", function () {
    var before = state.limit;
    state.limit += PAGE_SIZE; render();
    var next = list.querySelectorAll(".app-link")[before];
    if (next) next.focus();
  });

  /* ---------- Mobile filter panel (same element, dialog behaviour under 900px) ---------- */
  var mq = window.matchMedia("(max-width: 899px)");
  function setPanel(open) {
    panel.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("panel-open", open);
    openBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true");
      closeBtn.focus();
    } else {
      panel.removeAttribute("role"); panel.removeAttribute("aria-modal");
      if (mq.matches) openBtn.focus();
    }
  }
  openBtn.addEventListener("click", function () { setPanel(true); });
  closeBtn.addEventListener("click", function () { setPanel(false); });
  applyBtn.addEventListener("click", function () {
    setPanel(false);
    var heading = $("tulokset-otsikko");
    if (heading) heading.scrollIntoView({ block: "start" });
  });
  panel.addEventListener("keydown", function (e) {
    if (!panel.classList.contains("is-open")) return;
    if (e.key === "Escape") { e.preventDefault(); setPanel(false); return; }
    if (e.key !== "Tab") return;
    var f = Array.prototype.filter.call(panel.querySelectorAll("button, input, select, a[href]"), function (n) {
      return !n.disabled && n.offsetParent !== null;
    });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  mq.addEventListener("change", function () { if (!mq.matches) setPanel(false); });

  root.classList.add("is-ready");
  render();
})();
