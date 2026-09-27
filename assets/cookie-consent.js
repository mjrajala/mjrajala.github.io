(() => {
  'use strict';
  const key = 'aigen.analytics-consent.v1';
  const measurementId = 'G-YFF8RBFBP3';
  const disabled = `ga-disable-${measurementId}`;
  let started = false;
  let choice = readChoice();
  window[disabled] = choice !== 'accepted';

  function readChoice() {
    try {
      if (sessionStorage.getItem(key) === 'rejected') return 'rejected';
      const value = localStorage.getItem(key);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch (_) { return null; }
  }

  function clearCookies() {
    const domains = ['', location.hostname];
    const parts = location.hostname.split('.');
    while (parts.length > 1) {
      domains.push(`.${parts.join('.')}`);
      parts.shift();
    }
    const paths = new Set(['/']);
    const segments = location.pathname.split('/');
    while (segments.length) {
      const path = segments.join('/') || '/';
      paths.add(path);
      paths.add(path.endsWith('/') ? path : `${path}/`);
      segments.pop();
    }
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$)|_gac_|_gcl_)/.test(name)) return;
      domains.forEach(domain => paths.forEach(path => {
        document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? `; domain=${domain}` : ''}; SameSite=Lax`;
      }));
    });
  }

  function startAnalytics() {
    if (started || choice !== 'accepted' || !['aigen.fi', 'www.aigen.fi'].includes(location.hostname)) return;
    started = true;
    window[disabled] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
    const script = document.createElement('script');
    script.id = 'aigen-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function stopAnalytics() {
    window[disabled] = true;
    window.gtag = () => {};
    if (window.dataLayer) window.dataLayer.length = 0;
    document.getElementById('aigen-analytics')?.remove();
    clearCookies();
  }

  if (choice === 'accepted') startAnalytics();
  else clearCookies();

  const en = document.documentElement.lang.startsWith('en');
  const copy = en ? {
    title: 'Analytics cookies',
    body: 'With your permission, we use Google Analytics to see how this site is used. It sets cookies in your browser. You can use the site without analytics and change your choice in Cookie settings at any time.',
    accept: 'Accept analytics', reject: 'Reject analytics', settings: 'Cookie settings',
    accepted: 'Analytics is on. Reject analytics to withdraw your consent.',
    rejected: 'Analytics is off.', undecided: 'Analytics is off until you accept.',
    error: 'Your browser could not save your choice. Analytics will stay off. You can close this window and use the site.', close: 'Close'
  } : {
    title: 'Analytiikkaevästeet',
    body: 'Käytämme luvallasi Google Analyticsia sivuston käytön mittaamiseen. Se tallentaa evästeitä selaimeesi. Voit käyttää sivustoa ilman analytiikkaa ja muuttaa valintaasi milloin tahansa Evästeasetuksista.',
    accept: 'Hyväksy analytiikka', reject: 'Hylkää analytiikka', settings: 'Evästeasetukset',
    accepted: 'Analytiikka on käytössä. Voit perua suostumuksesi hylkäämällä analytiikan.',
    rejected: 'Analytiikka ei ole käytössä.', undecided: 'Analytiikka ei käynnisty ilman lupaasi.',
    error: 'Selain ei voinut tallentaa valintaasi. Analytiikka pysyy pois käytöstä. Voit sulkea ikkunan ja käyttää sivustoa.', close: 'Sulje'
  };
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'consent-settings';
  settings.textContent = copy.settings;
  settings.setAttribute('aria-haspopup', 'dialog');
  settings.setAttribute('aria-controls', 'cookie-consent');
  const dialog = document.createElement('dialog');
  dialog.id = 'cookie-consent';
  dialog.setAttribute('aria-labelledby', 'consent-title');
  dialog.setAttribute('aria-describedby', 'consent-description consent-status');
  dialog.innerHTML = `<h2 id="consent-title"></h2><p id="consent-description"></p><p id="consent-status" role="status"></p><div class="consent-actions"><button type="button" data-choice="rejected"></button><button type="button" data-choice="accepted"></button></div><button type="button" class="consent-close"></button>`;
  dialog.querySelector('h2').textContent = copy.title;
  dialog.querySelector('#consent-description').textContent = copy.body;
  dialog.querySelector('[data-choice="accepted"]').textContent = copy.accept;
  dialog.querySelector('[data-choice="rejected"]').textContent = copy.reject;
  dialog.querySelector('.consent-close').textContent = copy.close;
  document.body.append(settings, dialog);
  const status = dialog.querySelector('#consent-status');
  function refresh() { status.textContent = choice ? copy[choice] : copy.undecided; }
  function open() { refresh(); if (!dialog.open) dialog.showModal(); }
  function close() { dialog.close(); settings.focus({ preventScroll: true }); }
  settings.addEventListener('click', open);
  dialog.querySelector('.consent-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button:not([disabled])')];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.querySelectorAll('[data-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const next = button.dataset.choice;
      const wasStarted = started;
      // Disable immediately, before storage or navigation, when consent is withdrawn.
      if (next === 'rejected') {
        stopAnalytics();
        // Preserve withdrawal for this tab if persistent storage stops working.
        try { sessionStorage.setItem(key, 'rejected'); } catch (_) {}
      }
      try {
        localStorage.setItem(key, next);
        sessionStorage.removeItem(key);
      }
      catch (_) {
        choice = null;
        stopAnalytics();
        status.textContent = copy.error;
        // Do not reload into an older accepted choice if storage is unavailable.
        return;
      }
      choice = next;
      close();
      if (next === 'accepted') startAnalytics();
      else if (wasStarted) location.reload();
    });
  });
  // Keep open tabs in sync, including a choice cleared via browser settings.
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = readChoice();
    if (choice !== 'accepted') {
      stopAnalytics();
      if (started) { location.reload(); return; }
    } else startAnalytics();
    refresh();
    if (!choice) open();
  });
  // A restored back/forward-cache page must recheck the stored choice.
  window.addEventListener('pageshow', event => {
    if (event.persisted && choice !== readChoice()) location.reload();
  });
  refresh();
  if (!choice) open();
})();
