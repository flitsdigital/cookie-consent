# Flits Digital cookie consent voor Webflow

Herbruikbaar, klant-onafhankelijk cookie consent-script voor Webflow-sites. Werkt met **Google Consent Mode v2** en **Google Tag Manager**. De banner zelf is een Webflow-component (opmaak en teksten per klant); het script koppelt alleen via `data-`attributen.

Twee bestanden:

| Bestand | Waar | Wat |
|---|---|---|
| `dist/head.snippet.html` | Head, inline, vóór GTM | Consent default (alles denied) en herstel van een eerdere keuze. ~1,2 KB. |
| `dist/consent.min.js` | Footer, `defer`, via jsDelivr | Banner-logica, opslag, API. ~4 KB. |

## 1. Installatie in Webflow (5 stappen)

1. **Component plaatsen.** Zet de component *Global / Cookiebanner* uit de Library in de footer-component, zodat hij op elke pagina staat. De wrapper moet in Webflow standaard `display: none` hebben (anders flitst hij bij terugkerende bezoekers).
2. **Config + head-snippet.** Site settings → Custom code → **Head**. Eerst de config, daarna de inhoud van `dist/head.snippet.html`. Beide **boven** de GTM-snippet.
   ```html
   <script>
   window.FlitsConsent = { key: 'klant_consent', version: 1, days: 180 };
   </script>
   <!-- hier de inhoud van dist/head.snippet.html -->
   ```
3. **GTM-snippet** eronder, zoals gewoonlijk.
4. **Footer-script.** Site settings → Custom code → **Footer**:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/flitsdigital/cookie-consent@1.0.0/dist/consent.min.js" defer></script>
   ```
5. **Publiceren en testen** met de checklist hieronder.

## 2. Component-contract

De enige koppeling tussen Webflow en het script. In Webflow zijn dit *Custom attributes*. Classes zijn vrij.

| Attribuut | Waar | Verplicht | Functie |
|---|---|---|---|
| `data-cb="banner"` | wrapper | ja | De banner. Moet in Webflow standaard `display:none` hebben. |
| `data-cb="prefs"` | blok met schakelaars | ja | Wordt pas getoond na klik op Instellingen. |
| `data-cb-action="accept"` | knop | ja | Alles accepteren. |
| `data-cb-action="reject"` | knop | ja | Alles weigeren (even prominent als accepteren). |
| `data-cb-action="settings"` | knop | ja | Voorkeuren tonen. Verborgen zodra de voorkeuren open staan. |
| `data-cb-action="save"` | knop | ja | Keuze opslaan. Alleen zichtbaar als de voorkeuren open staan. |
| `data-cb-action="close"` | knop | nee | Sluiten zonder opslaan. Alleen zichtbaar/toegestaan als er al een eerdere keuze is. |
| `data-cb-toggle="<categorie>"` | schakelaar (link-block) | per categorie | Categorie-naam uit de config, bv. `analytics`, `marketing`, `preferences`. |
| `data-cb-open` | willekeurige link, bv. footer | nee | Opent de banner met de voorkeuren. Werkt op elke pagina, ook met meerdere links. |

Regels:

- Het script zet alleen `aria-checked` en de state-class (standaard `is-on`) op de toggles.
- Toggles moeten link-blocks zijn (`<a href="#">`): dan werken Tab, Spatie en Enter zonder extra attributen.
- Categorieën zonder toggle in de component worden genegeerd. Een toggle zonder categorie in de config geeft een `console.warn`.
- Zonder `settings`/`save`-knop werkt de eenvoudige variant (alleen accepteren/weigeren).
- Referentie-markup: [`webflow/component.html`](webflow/component.html). Plakbaar in de Designer: [`webflow/clipboard.json`](webflow/clipboard.json) (inhoud kopiëren, cmd+v op het canvas). Beide worden gegenereerd door `node webflow/clipboard.js`.

### Styling (Osmo-stijl)

Alle class-styling zit in de Webflow-classes en verwijst naar `--cb-*`-variabelen. In [`webflow/custom.css`](webflow/custom.css) staan de `:root`-variabelen plus wat Webflow niet kan (`:focus-visible`, `.cb-switch.is-on .cb-knob`, `prefers-reduced-motion`). Plak die in Site settings → Head in een `<style>`-tag. Kleuren of maten aanpassen = alleen variabelen wijzigen:

```css
:root { --cb-color-accent: #6840ff; --cb-color-accent-text: #fff; --cb-border-radius: 4px; }
```

Toegankelijkheid van de component: `role="dialog"` met `aria-labelledby`/`aria-describedby`, `<h2>`-titel, `role="switch"` + `aria-checked` + `aria-label` op de schakelaars, zichtbare focusring via `--cb-color-focus`, knoppen ≥ 41px hoog, standaard donkere tekst op de accentkleur (5:1). Let bij eigen kleuren op ≥ 4,5:1 contrast tussen `--cb-color-accent` en `--cb-color-accent-text`.

## 3. Configuratie

Eén object in de head, **vóór** de head-snippet. Alle waarden hebben een default; `window.FlitsConsent = { key: 'x_consent' }` is genoeg.

| Optie | Default | Betekenis |
|---|---|---|
| `key` | `'flits_consent'` | localStorage-/cookie-key. Uniek per klant. |
| `version` | `1` | Verhogen = iedereen krijgt de banner opnieuw. |
| `days` | `180` | Geldigheid van een keuze in dagen. |
| `categories` | `{ analytics: ['analytics_storage'], marketing: ['ad_storage','ad_user_data','ad_personalization'] }` | Categorie → Consent Mode v2-signalen. Voeg bv. `preferences: ['functionality_storage','personalization_storage']` toe. |
| `clearOnRevoke` | `{}` | Cookies die verwijderd worden als een categorie van aan naar uit gaat. Wildcard alleen als suffix (`_ga_*`). Verwijderd op het huidige host en op `.site.nl` (zonder `www`). |
| `onClass` | `'is-on'` | State-class op toggles. |
| `display` | `'block'` | `style.display`-waarde waarmee de banner getoond wordt (`'flex'` als de wrapper flex is). |
| `clarity` | `false` | Roept `clarity('consentv2', …)` aan bij een update. Normaal regel je dit in GTM. |
| `metaPixel` | `false` | Roept `fbq('consent','grant'|'revoke')` aan bij marketing. Normaal regel je dit in GTM. |
| `debug` | `false` | `console.warn` als de component ontbreekt. |

```html
<script>
window.FlitsConsent = {
  key: 'gbh_consent',
  version: 1,
  days: 180,
  categories: {
    analytics: ['analytics_storage'],
    marketing: ['ad_storage', 'ad_user_data', 'ad_personalization']
  },
  clearOnRevoke: {
    analytics: ['_ga', '_ga_*', '_clck', '_clsk'],
    marketing: ['_gcl_*', '_fbp', '_fbc']
  }
};
</script>
```

### Gedrag

- **Default:** alle signalen uit alle categorieën `denied`; `functionality_storage` en `security_storage` `granted` (tenzij je ze zelf in een categorie zet); `wait_for_update: 500`; `ads_data_redaction` en `url_passthrough` aan.
- **Opslag:** `{ v, t, c: { analytics: true, marketing: false } }` in localStorage. Geblokkeerd? Dan een first-party cookie `<key>`, en anders alleen geheugen (keuze vervalt bij herladen). Het oude Hondsrug-formaat `{v:1,a,m,t}` wordt nog gelezen.
- **Terugkerende bezoeker:** de head-snippet vuurt `gtag('consent','update')` en het dataLayer-event al vóór GTM laadt. De banner blijft dicht.
- **dataLayer-event** `consent_update` met `consent_<categorie>: true/false` per categorie (`consent_analytics` en `consent_marketing` blijven bestaan voor bestaande GTM-triggers).
- **DOM-event** `flits:consent` op `document`, `event.detail` = keuze.
- **Intrekken:** gaat een categorie van aan naar uit, dan worden de cookies uit `clearOnRevoke` verwijderd en volgt een update. Al geladen tags (GA4, Clarity, Pixel) draaien door tot de pagina herlaadt; wil je dat hard afdwingen, doe dan `FlitsConsent.on(() => location.reload())`.
- **Global Privacy Control:** bij `navigator.globalPrivacyControl === true` wordt de banner gewoon getoond; alle toggles staan (net als zonder GPC) standaard uit. Er wordt niet automatisch geweigerd.
- **Toegankelijkheid:** toggles werken met Spatie en Enter; na openen gaat de focus naar de eerste knop (na Instellingen naar de eerste toggle); Esc en `close` sluiten alleen als er al een keuze is; na sluiten gaat de focus terug naar het element dat de banner opende.
- **Robuust:** ontbreekt de component, dan stopt het script stil (met `debug: true` een `console.warn`). Ontbreekt de head-snippet, dan altijd een `console.warn`.

### API

```js
FlitsConsent.open();                 // banner met voorkeuren tonen (= window.openCookieSettings())
FlitsConsent.get();                  // { analytics: true, marketing: false } of null
FlitsConsent.set({ analytics: true });  // keuze aanpassen zonder banner
FlitsConsent.reset();                // keuze wissen en banner tonen
FlitsConsent.has('marketing');       // true/false
FlitsConsent.on(function (c) { … }); // callback bij elke opgeslagen keuze
```

## 4. GTM-instructies

1. **Consent Overview aanzetten:** Admin → Container Settings → *Enable consent overview*.
2. **GA4 en Google Ads** gebruiken de ingebouwde consent checks van Consent Mode. Geen extra instelling nodig; laat de tags gewoon op *All Pages* vuren.
3. **Meta Pixel en Microsoft Clarity** hebben geen ingebouwde checks. Kies één van twee:
   - In de tag onder *Consent Settings* → *Require additional consent for tag to fire*: `ad_storage` (Pixel) resp. `analytics_storage` (Clarity). GTM houdt de tag dan vast tot de update binnen is.
   - Of een Custom Event-trigger op `consent_update` met de dataLayer-variabele `consent_marketing` resp. `consent_analytics` gelijk aan `true`. Dit is nodig als de tag ook meteen na een klik op *Accepteren* moet vuren zonder herlaad.

## 5. Testchecklist (Network-tabblad)

1. Open de site in een incognito-venster, filter op `collect?`. Vóór toestemming bevat elke GA4-hit `gcs=G100` (alles denied). Na *Alles accepteren* wordt dat `gcs=G111`.
2. Vóór toestemming: **geen** requests naar `facebook.com/tr` en **geen** requests naar `clarity.ms`.
3. Na *Weigeren*: nog steeds `G100`, geen Pixel/Clarity.
4. Herlaad na accepteren: banner blijft dicht, eerste `collect?` heeft direct `G111`.
5. Console: `dataLayer` bevat `consent_update` met `consent_analytics`/`consent_marketing`.

## 6. jsDelivr

- Gebruik **altijd een versie-tag**: `…/cookie-consent@1.0.0/dist/consent.min.js`. Nooit `@main`.
- `@main` (en branches) worden door jsDelivr tot 12 uur of langer gecachet; een push is dus niet direct zichtbaar. Tags zijn onveranderlijk en worden permanent gecachet.
- Moet een URL toch ververst worden: open `https://purge.jsdelivr.net/gh/flitsdigital/cookie-consent@1.0.0/dist/consent.min.js`.
- `dist/` staat in git, want jsDelivr serveert rechtstreeks uit de tag.

## 7. Upgrade-pad voor Hondsrug

1. Config in de head, boven alles:
   ```html
   <script>window.FlitsConsent = { key: 'gbh_consent', version: 1, days: 180 };</script>
   ```
   180 dagen = de `15552e6` ms die de huidige code gebruikt; `version: 1` en dezelfde key zorgen dat bestaande bezoekers de banner niet opnieuw zien (het oude formaat wordt gelezen en bij de eerstvolgende keuze omgezet).
2. Vervang de oude inline head-code (van `window.dataLayer=…` t/m `})();`) door de inhoud van `dist/head.snippet.html`. GTM blijft eronder staan.
3. Vervang in de footer `…glasbewassing-de-hondsrug@main/cookies.js` door `https://cdn.jsdelivr.net/gh/flitsdigital/cookie-consent@1.0.0/dist/consent.min.js` (met `defer`).
4. Publiceren, testchecklist doorlopen.

## Ontwikkelen

```bash
npm install && npx playwright install chromium
npm test            # bouwt dist/ en draait de Playwright-tests tegen demo/
npm run build       # alleen bouwen
```

Demo: `python3 -m http.server 4173` en open <http://localhost:4173/demo/>.

### Release

```bash
npm run release -- 1.0.0
```

Dat bouwt, draait de tests, zet de versie in `package.json` en `CHANGELOG.md` (de kop *Unreleased* wordt `1.0.0 - datum`), commit en maakt de tag `v1.0.0`. Werkboom moet schoon zijn. Daarna zelf pushen:

```bash
git push && git push --tags
```

Nieuwe changelog-regels komen altijd onder `## Unreleased`.
