# Cookie consent op een Webflow-site zetten

Vijf stappen, ~10 minuten. Uitgebreide uitleg staat in [README.md](README.md).

## 1. Component plaatsen

Open de demo (`python3 -m http.server 4173` → <http://localhost:4173/demo/>), klik **Copy to Webflow**, selecteer in de Designer de footer-component en plak (cmd+v). Het JSON-bestand zelf kopiëren werkt niet: Webflow leest alleen clipboard-data van het type `application/json`. Maak er een component *Global / Cookiebanner* van.
Zet in de footer een link met custom attribute `data-cb-open` = `true` (bv. "Cookie-instellingen").

Plak daarnaast `webflow/custom.css` in Site settings → Custom code → Head, in een `<style>`-tag. Daarin staan de `--cb-*`-variabelen: kleuren en maten pas je dáár aan, niet in de classes.

## 2. Head-code

Site settings → Custom code → **Head**. Plak dit **boven** de GTM-snippet:

```html
<script>
window.FlitsConsent = { key: 'KLANT_consent', version: 1, days: 180 };
</script>
```

Vervang `KLANT` door een korte naam van de klant. Plak direct daaronder de inhoud van `dist/head.snippet.html`.

## 3. GTM-snippet

Laat de GTM-snippet staan (of plaats hem), onder de code van stap 2.

## 4. Footer-code

Site settings → Custom code → **Footer**:

```html
<script src="https://cdn.jsdelivr.net/gh/flitsdigital/cookie-consent@1.0.0/dist/consent.min.js" defer></script>
```

Altijd een versie-tag (`@1.0.0`), nooit `@main`.

## 5. Publiceren en testen

1. Incognito-venster openen → banner verschijnt.
2. Network-tab, filter `collect?` → `gcs=G100`. Geen requests naar `facebook.com/tr` of `clarity.ms`.
3. *Alles accepteren* → `gcs=G111`.
4. Herladen → banner blijft dicht.
5. Footer-link *Cookie-instellingen* → banner opent met voorkeuren.

## GTM

- Admin → Container Settings → *Enable consent overview* aanzetten.
- GA4 en Google Ads: niets extra's.
- Meta Pixel en Clarity: in de tag *Require additional consent* → `ad_storage` (Pixel) / `analytics_storage` (Clarity).

## Extra's

- Meer categorieën (bv. `preferences`): voeg `categories` toe aan de config en een toggle met `data-cb-toggle="preferences"` in de component.
- Cookies opruimen bij intrekken: `clearOnRevoke: { analytics: ['_ga', '_ga_*', '_clck', '_clsk'], marketing: ['_gcl_*', '_fbp', '_fbc'] }`.
- Iedereen opnieuw laten kiezen: `version` verhogen.
