# Changelog

## Unreleased

## 1.0.0 - 2026-09-17

- Eerste generieke versie, gebaseerd op de Hondsrug-implementatie.
- Configureerbaar via `window.FlitsConsent` (key, version, days, categories, clearOnRevoke, onClass, display).
- Nieuw opslagformaat `{v,t,c:{…}}`, oud formaat `{v,a,m,t}` wordt nog gelezen.
- Publieke API: `open/get/set/reset/has/on`, DOM-event `flits:consent`, `window.openCookieSettings`.
- Toetsenbord- en focusbeheer, Esc/close alleen na een eerdere keuze.
- Cookies opruimen bij intrekken (`clearOnRevoke`, wildcards).
- Fallback naar cookie en geheugen als localStorage geblokkeerd is.
- Optioneel: `clarity: true`, `metaPixel: true`.
