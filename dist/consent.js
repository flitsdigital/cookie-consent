/* Flits Digital cookie consent – consent.js
 * Laden met defer via jsDelivr op een versie-tag. Vereist head.js (window.FlitsConsent.read/push). */
(function (w, d) {
  var F = w.FlitsConsent;
  if (!F || !F.read) { console.warn('[FlitsConsent] head-snippet ontbreekt, zie README'); return; }
  var onClass = F.onClass || 'is-on', display = F.display || 'block';
  var revoke = F.clearOnRevoke || {}, cats = Object.keys(F.categories), listeners = [], opener = null, shown = false;
  var mem = null, readStored = F.read; // geheugen als localStorage én cookies geblokkeerd zijn
  F.read = function () { return mem || readStored(); };
  var b = d.querySelector('[data-cb="banner"]');
  function q(sel) { return b && b.querySelector(sel); }
  var p = q('[data-cb="prefs"]'), btn = {};
  ['accept', 'reject', 'settings', 'save', 'close'].forEach(function (a) { btn[a] = q('[data-cb-action="' + a + '"]'); });

  // Opslag: localStorage → first-party cookie → geheugen
  function write(c) {
    var raw = JSON.stringify({ v: F.version, t: Date.now(), c: c });
    mem = c;
    try { localStorage.setItem(F.key, raw); return; } catch (e) {}
    try { d.cookie = F.key + '=' + encodeURIComponent(raw) + ';max-age=' + F.days * 86400 + ';path=/;SameSite=Lax'; } catch (e) {}
  }
  // Cookies verwijderen op huidig host en op .site.nl (waar GA/Clarity ze zetten). Wildcard alleen als suffix: _ga_*
  function clearCookies(patterns) {
    var domains = ['', '.' + location.hostname.replace(/^www\./, '')];
    d.cookie.split(';').forEach(function (ck) {
      var name = ck.split('=')[0].trim();
      if (!name || !patterns.some(function (p) { return p.slice(-1) === '*' ? name.indexOf(p.slice(0, -1)) === 0 : name === p; })) return;
      domains.forEach(function (dom) { d.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + (dom ? ';domain=' + dom : ''); });
    });
  }

  function toggle(k) { return q('[data-cb-toggle="' + k + '"]'); }
  function isOn(el) { return el.getAttribute('aria-checked') === 'true'; }
  function setOn(el, v) { el.setAttribute('aria-checked', v ? 'true' : 'false'); el.classList.toggle(onClass, v); }
  function show(el, v) { if (el) el.style.display = v ? '' : 'none'; }
  function prefs(open) { if (p) p.style.display = open ? 'block' : 'none'; show(btn.save, open); show(btn.settings, !open); }
  function all(v) { var c = {}; cats.forEach(function (k) { c[k] = v; }); return c; }
  function fromToggles() { var c = {}; cats.forEach(function (k) { var t = toggle(k); c[k] = !!t && isOn(t); }); return c; }

  function open(withPrefs) {
    if (!b) return;
    var c = F.read(); // ponytail: GPC → toggles staan zonder keuze al standaard uit
    show(btn.close, !!c);
    c = c || {};
    cats.forEach(function (k) { var t = toggle(k); if (t) setOn(t, !!c[k]); });
    prefs(!!(withPrefs && p));
    opener = d.activeElement;
    b.style.display = display;
    shown = true;
    var first = [].filter.call(b.querySelectorAll('[data-cb-action]'), function (el) { return el.style.display !== 'none'; })[0];
    if (first) first.focus();
  }
  function hide() {
    b.style.display = 'none';
    shown = false;
    if (opener) opener.focus();
    opener = null;
  }
  function save(c) {
    var prev = F.read() || {}, out = {};
    cats.forEach(function (k) { out[k] = !!c[k]; });
    write(out);
    cats.forEach(function (k) { if (prev[k] && !out[k] && revoke[k]) clearCookies(revoke[k]); });
    F.push(out);
    if (F.clarity && w.clarity) w.clarity('consentv2', { ad_Storage: out.marketing ? 'granted' : 'denied', analytics_Storage: out.analytics ? 'granted' : 'denied' });
    if (F.metaPixel && w.fbq) w.fbq('consent', out.marketing ? 'grant' : 'revoke');
    d.dispatchEvent(new CustomEvent('flits:consent', { detail: out }));
    listeners.forEach(function (fn) { fn(out); });
    if (b) hide();
  }

  // Publieke API
  F.open = function () { open(true); };
  F.get = F.read;
  F.set = function (c) { save(Object.assign({}, F.read() || {}, c)); };
  F.reset = function () {
    try { localStorage.removeItem(F.key); } catch (e) {}
    d.cookie = F.key + '=;max-age=0;path=/';
    mem = null;
    open(false);
  };
  F.has = function (k) { return !!(F.read() || {})[k]; };
  F.on = function (fn) { listeners.push(fn); };
  w.openCookieSettings = F.open;

  d.addEventListener('click', function (e) {
    if (e.target.closest('[data-cb-open]')) { e.preventDefault(); open(true); }
  });
  if (!b) { if (F.debug) console.warn('[FlitsConsent] geen [data-cb="banner"] gevonden'); return; }

  [].forEach.call(b.querySelectorAll('[data-cb-toggle]'), function (t) {
    var k = t.getAttribute('data-cb-toggle');
    if (cats.indexOf(k) < 0) console.warn('[FlitsConsent] toggle "' + k + '" staat niet in categories');
  });
  b.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cb-action],[data-cb-toggle]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-cb-toggle')) return setOn(t, !isOn(t));
    var a = t.getAttribute('data-cb-action');
    if (a === 'accept') save(all(true));
    else if (a === 'reject') save(all(false));
    else if (a === 'settings') { prefs(true); var first = q('[data-cb-toggle]'); if (first) first.focus(); }
    else if (a === 'save') save(fromToggles());
    else if (a === 'close' && F.read()) hide();
  });
  b.addEventListener('keydown', function (e) {
    var t = e.target.closest('[data-cb-toggle]');
    if (t && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setOn(t, !isOn(t)); }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && shown && F.read()) hide();
  });

  prefs(false);
  if (!F.read()) open(false);
})(window, document);
