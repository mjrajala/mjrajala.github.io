/* Catalog page: search, audience views, task categories, status filter, sort, URL state, mobile filter panel. */
(function () {
  "use strict";

  var UI = window.AigenUI;
  var root = document.getElementById("katalogi");
  if (!UI || !root) return;

  var data = UI.catalog;
  var PAGE_SIZE = 24; // "Näytä lisää" appears only when a view has more apps than this
  var STATUS_RANK = { saatavilla: 0, beta: 1, tulossa: 2 };
  var DEFAULT_AUDIENCE = data.audiences[0].id;

  var $ = function (id) { return document.getElementById(id); };
  var input = $("haku-kentta");
  var clearBtn = $("haku-tyhjenna");
  var list = $("sovellukset");
  var countEl = $("tulos-maara");
  var moreBtn = $("nayta-lisaa");
  var empty = $("tyhja");
  var emptyText = $("tyhja-teksti");
  var otherHint = $("muut-osumat");
  var activeList = $("aktiiviset");
  var catBox = $("tehtava-valinnat");
  var statusBox = $("tila-valinnat");
  var sortSel = $("jarjestys");
  var panel = $("suodattimet");
  var openBtn = $("avaa-suodattimet");
  var openBadge = $("suodatin-maara");
  var closeBtn = $("sulje-suodattimet");
  var applyBtn = $("nayta-tulokset");
  var resetBtns = document.querySelectorAll("[data-reset]");
  var audienceBtns = root.querySelectorAll("[data-audience]");

  /* ---------- State <-> URL ---------- */
  var state = readUrl();

  function readUrl() {
    var p = new URLSearchParams(location.search);
    var audience = p.get("kohde") === "muut" ? "muut" : DEFAULT_AUDIENCE;
    var cat = p.get("tehtava") || "";
    var c = UI.byId(data.categories, cat);
    if (!c) cat = "";
    else audience = c.audience; // a category link decides the view
    var statuses = (p.get("tila") || "").split(",").filter(function (s) { return STATUS_RANK.hasOwnProperty(s); });
    return {
      q: (p.get("q") || "").slice(0, 80),
      audience: audience,
      category: cat,
      statuses: statuses,
      sort: p.get("jarjestys") === "nimi" ? "nimi" : "suositellut",
      limit: PAGE_SIZE
    };
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q.trim()) p.set("q", state.q.trim());
    if (state.audience !== DEFAULT_AUDIENCE) p.set("kohde", state.audience);
    if (state.category) p.set("tehtava", state.category);
    if (state.statuses.length) p.set("tila", state.statuses.join(","));
    if (state.sort !== "suositellut") p.set("jarjestys", state.sort);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  /* ---------- Search ---------- */
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  var index = data.apps.map(function (app, order) {
    var cats = app.categories.map(function (id) { var c = UI.byId(data.categories, id); return c ? c.label : ""; });
    return {
      app: app,
      order: order,
      name: norm(app.name),
      use: norm(app.useCase),
      text: norm([app.name, app.useCase, app.summary, app.keywords, cats.join(" "), app.language].join(" "))
    };
  });

  function tokens(q) { return norm(q).split(/[\s,]+/).filter(Boolean); }

  // Finnish words inflect, so a long token also matches by its stem ("päästöjen" -> "paasto").
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
      if (entry.name.indexOf(t) === 0) s += 6;
      else if (hit(entry.name, t)) s += 4;
      if (hit(entry.use, t)) s += 3;
      s += 1;
    }
    return s;
  }

  function matches(opts) {
    var toks = tokens(state.q);
    var out = [];
    index.forEach(function (e) {
      var a = e.app;
      if (opts.audience && a.audience !== opts.audience) return;
      if (opts.category && a.categories.indexOf(opts.category) === -1) return;
      if (opts.statuses && opts.statuses.length && opts.statuses.indexOf(a.status) === -1) return;
      var sc = score(e, toks);
      if (sc < 0) return;
      out.push({ e: e, score: sc });
    });
    return out;
  }

  function sortResults(rows) {
    var byName = function (a, b) { return a.e.app.name.localeCompare(b.e.app.name, "fi"); };
    if (state.sort === "nimi") return rows.sort(byName);
    return rows.sort(function (a, b) {
      return (STATUS_RANK[a.e.app.status] - STATUS_RANK[b.e.app.status]) ||
        (b.score - a.score) ||
        ((a.e.app.featured || 99) - (b.e.app.featured || 99)) ||
        (a.e.order - b.e.order);
    });
  }

  /* ---------- Filter controls (rebuilt per audience, counts are faceted) ---------- */
  function categoryCount(id) {
    return matches({ audience: state.audience, category: id, statuses: state.statuses }).length;
  }
  function statusCount(id) {
    return matches({ audience: state.audience, category: state.category, statuses: [id] }).length;
  }

  function option(type, name, value, label, count, checked) {
    var wrap = document.createElement("label");
    wrap.className = "choice";
    var inp = document.createElement("input");
    inp.type = type;
    inp.name = name;
    inp.value = value;
    inp.checked = checked;
    inp.disabled = count === 0 && !checked;
    var text = document.createElement("span");
    text.className = "choice-label";
    text.textContent = label;
    var num = document.createElement("span");
    num.className = "choice-count";
    num.textContent = count;
    wrap.appendChild(inp);
    wrap.appendChild(text);
    wrap.appendChild(num);
    if (inp.disabled) wrap.classList.add("is-disabled");
    return wrap;
  }

  function renderControls() {
    var focusedValue = document.activeElement && document.activeElement.name === "tehtava" ? document.activeElement.value :
      (document.activeElement && document.activeElement.name === "tila" ? "tila:" + document.activeElement.value : null);

    catBox.textContent = "";
    catBox.appendChild(option("radio", "tehtava", "", "Kaikki tehtävät",
      matches({ audience: state.audience, statuses: state.statuses }).length, state.category === ""));
    data.categories.filter(function (c) { return c.audience === state.audience; }).forEach(function (c) {
      catBox.appendChild(option("radio", "tehtava", c.id, c.label, categoryCount(c.id), state.category === c.id));
    });

    statusBox.textContent = "";
    data.statuses.forEach(function (s) {
      var n = statusCount(s.id);
      // Hide statuses no app in this view uses at all (e.g. no beta apps yet).
      var anyInAudience = data.apps.some(function (a) { return a.audience === state.audience && a.status === s.id; });
      if (!anyInAudience) return;
      statusBox.appendChild(option("checkbox", "tila", s.id, s.label, n, state.statuses.indexOf(s.id) !== -1));
    });

    if (focusedValue != null) {
      var sel = focusedValue.indexOf("tila:") === 0 ?
        statusBox.querySelector('input[value="' + focusedValue.slice(5) + '"]') :
        catBox.querySelector('input[value="' + focusedValue + '"]');
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
    moreBtn.textContent = "Näytä lisää (" + remaining + ")";

    var label = total === 1 ? "1 sovellus" : total + " sovellusta";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { countEl.textContent = label; }, state.q ? 350 : 0);
    if (applyBtn) applyBtn.textContent = total === 0 ? "Ei tuloksia – sulje" : "Näytä " + label;

    // Other audience hits for the same search
    var otherId = state.audience === "muut" ? "yritykset" : "muut";
    var other = UI.byId(data.audiences, otherId);
    var otherHits = state.q.trim() ? matches({ audience: otherId }).length : 0;

    empty.hidden = total !== 0;
    list.hidden = total === 0;
    if (total === 0) {
      emptyText.textContent = state.q.trim() ?
        "Haulla ”" + state.q.trim() + "” ei löytynyt sovelluksia näillä valinnoilla." :
        "Näillä valinnoilla ei löytynyt sovelluksia.";
    }
    otherHint.hidden = otherHits === 0;
    if (otherHits) {
      otherHint.querySelector("button").textContent =
        "Näytä " + otherHits + (otherHits === 1 ? " osuma" : " osumaa") + " kohdasta " + other.label;
      otherHint.querySelector("button").setAttribute("data-switch", otherId);
    }

    clearBtn.hidden = !state.q;
    renderActive();
    writeUrl();
  }

  function renderActive() {
    activeList.textContent = "";
    var items = [];
    if (state.q.trim()) items.push({ label: "Haku: " + state.q.trim(), clear: function () { state.q = ""; input.value = ""; } });
    if (state.category) {
      var c = UI.byId(data.categories, state.category);
      items.push({ label: c.label, clear: function () { state.category = ""; } });
    }
    state.statuses.forEach(function (s) {
      var st = UI.byId(data.statuses, s);
      items.push({ label: st.label, clear: function () { state.statuses = state.statuses.filter(function (x) { return x !== s; }); } });
    });
    items.forEach(function (it) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.innerHTML = '<span></span><span class="chip-x" aria-hidden="true">×</span>';
      b.firstChild.textContent = it.label;
      b.setAttribute("aria-label", "Poista rajaus: " + it.label);
      b.addEventListener("click", function () { it.clear(); state.limit = PAGE_SIZE; render(); input.focus(); });
      li.appendChild(b);
      activeList.appendChild(li);
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
    if (e.target.name !== "tehtava") return;
    state.category = e.target.value; state.limit = PAGE_SIZE; render();
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

  function resetAll() {
    state.q = ""; input.value = ""; state.category = ""; state.statuses = []; state.sort = "suositellut";
    sortSel.value = "suositellut"; state.limit = PAGE_SIZE; render();
  }
  resetBtns.forEach(function (b) { b.addEventListener("click", function () { resetAll(); input.focus(); }); });

  moreBtn.addEventListener("click", function () {
    var before = state.limit;
    state.limit += PAGE_SIZE; render();
    var next = list.querySelectorAll(".app-link")[before];
    if (next) next.focus();
  });

  /* ---------- Mobile filter panel (same element, dialog behaviour under 900px) ---------- */
  var mq = window.matchMedia("(max-width: 899px)");
  var lastFocus = null;

  function setPanel(open) {
    if (open) {
      lastFocus = document.activeElement;
      panel.classList.add("is-open");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      document.documentElement.classList.add("panel-open");
      openBtn.setAttribute("aria-expanded", "true");
      closeBtn.focus();
    } else {
      panel.classList.remove("is-open");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      document.documentElement.classList.remove("panel-open");
      openBtn.setAttribute("aria-expanded", "false");
      if (lastFocus && mq.matches) openBtn.focus();
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
