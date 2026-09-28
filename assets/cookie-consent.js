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

  // Install before GA can cache transport references. Its delayed/pagehide
  // events can bypass ga-disable, so consent is checked again at send time.
  function blockedAnalyticsRequest(input) {
    let hostname;
    try {
      hostname = new URL(input instanceof Request ? input.url : input, location.href).hostname;
    } catch (_) { return false; }
    const analytics = /(^|\.)(google-analytics\.com|googletagmanager\.com|analytics\.google\.com)$/.test(hostname)
      || hostname === 'stats.g.doubleclick.net';
    return analytics && (window[disabled] || choice !== 'accepted' || readChoice() !== 'accepted');
  }
  const nativeFetch = window.fetch;
  window.fetch = function (...args) {
    if (blockedAnalyticsRequest(args[0])) return Promise.resolve(new Response(null, { status: 204 }));
    return Reflect.apply(nativeFetch, this, args);
  };
  const nativeBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function (...args) {
    // Report success without sending, so GA does not retry through a fallback.
    if (blockedAnalyticsRequest(args[0])) return true;
    return Reflect.apply(nativeBeacon, this, args);
  };
  const xhrUrls = new WeakMap();
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  const nativeAbort = XMLHttpRequest.prototype.abort;
  XMLHttpRequest.prototype.open = function (...args) {
    const result = Reflect.apply(nativeOpen, this, args);
    xhrUrls.set(this, args[1]);
    return result;
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (blockedAnalyticsRequest(xhrUrls.get(this))) {
      Reflect.apply(nativeAbort, this, []);
      return;
    }
    return Reflect.apply(nativeSend, this, args);
  };

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
    body: 'May we use Google Analytics cookies to measure site usage? You can change your choice in Cookie settings.',
    accept: 'Accept', reject: 'Reject', settings: 'Cookie settings',
    accepted: 'Analytics is on. Reject analytics to withdraw your consent.',
    rejected: 'Analytics is off.', undecided: '',
    error: 'Your browser could not save your choice. Analytics will stay off. You can close this banner and use the site.', close: 'Close'
  } : {
    title: 'Analytiikkaevästeet',
    body: 'Saammeko mitata sivuston käyttöä Google Analytics -evästeillä? Voit muuttaa valintaasi evästeasetuksista.',
    accept: 'Hyväksy', reject: 'Hylkää', settings: 'Evästeasetukset',
    accepted: 'Analytiikka on käytössä. Voit perua suostumuksesi hylkäämällä analytiikan.',
    rejected: 'Analytiikka ei ole käytössä.', undecided: '',
    error: 'Selain ei voinut tallentaa valintaasi. Analytiikka pysyy pois käytöstä. Voit sulkea ilmoituksen ja käyttää sivustoa.', close: 'Sulje'
  };
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'consent-settings';
  settings.textContent = copy.settings;
  settings.setAttribute('aria-controls', 'cookie-consent');
  const dialog = document.createElement('section');
  dialog.id = 'cookie-consent';
  dialog.hidden = true;
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
  function refresh() {
    // Keep a failed-save message when settings are reopened without a choice.
    if (choice || status.textContent !== copy.error) {
      status.textContent = choice ? copy[choice] : copy.undecided;
    }
    status.hidden = !status.textContent;
    dialog.querySelector('.consent-close').hidden = !status.textContent;
  }
  function open() {
    const fromSettings = document.activeElement === settings;
    refresh();
    dialog.hidden = false;
    settings.hidden = true;
    if (fromSettings) dialog.querySelector('[data-choice="rejected"]').focus({ preventScroll: true });
  }
  function close() {
    const restoreFocus = dialog.contains(document.activeElement);
    dialog.hidden = true;
    settings.hidden = false;
    if (restoreFocus) settings.focus({ preventScroll: true });
  }
  settings.addEventListener('click', open);
  dialog.querySelector('.consent-close').addEventListener('click', close);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
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
        refresh();
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
