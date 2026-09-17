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

Vervang `KLANT` door een korte naam van de klant. Plak **direct daaronder** dit blok (dit is `dist/head.snippet.html`; zonder dit blok doet de banner niets):

```html
<script>(function(r,d){var e=r.FlitsConsent=r.FlitsConsent||{};e.key=e.key||"flits_consent",e.version=e.version||1,e.days=e.days||180,e.categories=e.categories||{analytics:["analytics_storage"],marketing:["ad_storage","ad_user_data","ad_personalization"]},r.dataLayer=r.dataLayer||[];function s(){r.dataLayer.push(arguments)}var n={},c;for(c in e.categories)e.categories[c].forEach(function(a){n[a]="denied"});n.functionality_storage||(n.functionality_storage="granted"),n.security_storage||(n.security_storage="granted"),n.wait_for_update=500,s("consent","default",n),s("set","ads_data_redaction",!0),s("set","url_passthrough",!0),e.read=function(){var a=null,t;try{a=localStorage.getItem(e.key)}catch(o){}if(!a)try{a=decodeURIComponent((d.cookie.match("(?:^|; )"+e.key+"=([^;]*)")||[])[1]||"")}catch(o){}try{t=JSON.parse(a)}catch(o){}return!t||t.v!==e.version||Date.now()-t.t>e.days*864e5?null:t.c?t.c:"a"in t?{analytics:!!t.a,marketing:!!t.m}:null},e.push=function(a){var t={},o={event:"consent_update"},i;for(i in e.categories)o["consent_"+i]=!!a[i],e.categories[i].forEach(function(f){t[f]=a[i]?"granted":"denied"});s("consent","update",t),r.dataLayer.push(o)};try{var u=e.read();u&&e.push(u)}catch(a){}})(window,document);</script>
```

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
