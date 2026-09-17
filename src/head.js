/* Flits Digital cookie consent – head.js
 * Inline plakken in <head>, ná window.FlitsConsent-config en VÓÓR GTM. ES5, geen afhankelijkheden. */
(function (w, d) {
  var F = w.FlitsConsent = w.FlitsConsent || {};
  F.key = F.key || 'flits_consent';
  F.version = F.version || 1;
  F.days = F.days || 180;
  F.categories = F.categories || {
    analytics: ['analytics_storage'],
    marketing: ['ad_storage', 'ad_user_data', 'ad_personalization']
  };
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }

  // Consent Mode v2 default: alle categorie-signalen denied, functionality/security granted (tenzij in een categorie)
  var def = {}, k;
  for (k in F.categories) F.categories[k].forEach(function (s) { def[s] = 'denied'; });
  if (!def.functionality_storage) def.functionality_storage = 'granted';
  if (!def.security_storage) def.security_storage = 'granted';
  def.wait_for_update = 500;
  gtag('consent', 'default', def);
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // Opgeslagen keuze: localStorage → cookie (geheugen-fallback leeft alleen in consent.js). null als afwezig, andere versie of verlopen.
  F.read = function () {
    var raw = null, s;
    try { raw = localStorage.getItem(F.key); } catch (e) {}
    if (!raw) try { raw = decodeURIComponent((d.cookie.match('(?:^|; )' + F.key + '=([^;]*)') || [])[1] || ''); } catch (e) {}
    try { s = JSON.parse(raw); } catch (e) {}
    if (!s || s.v !== F.version || Date.now() - s.t > F.days * 864e5) return null;
    if (s.c) return s.c;
    if ('a' in s) return { analytics: !!s.a, marketing: !!s.m }; // oud Hondsrug-formaat {v,a,m,t}
    return null;
  };

  // Keuze → gtag('consent','update') + dataLayer-event. Gedeeld met consent.js.
  F.push = function (c) {
    var u = {}, ev = { event: 'consent_update' }, k;
    for (k in F.categories) {
      ev['consent_' + k] = !!c[k];
      F.categories[k].forEach(function (s) { u[s] = c[k] ? 'granted' : 'denied'; });
    }
    gtag('consent', 'update', u);
    w.dataLayer.push(ev);
  };

  try { var c = F.read(); if (c) F.push(c); } catch (e) {}
})(window, document);
