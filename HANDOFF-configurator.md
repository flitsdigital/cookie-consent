# Handoff: cookie-consent configurator (Next.js)

> Voor een nieuwe Claude Code-sessie in een nieuwe repo (`flitsdigital/cookie-consent-configurator`). Lees dit helemaal, bouw daarna. Vragen alleen bij echte tegenstrijdigheid; kies anders de default die hier staat.

## Wat er al is (niet aanpassen)

Repo: https://github.com/flitsdigital/cookie-consent — een klant-onafhankelijk cookie consent-script voor Webflow (Consent Mode v2 + GTM). Lokaal: `/Users/jordiklavers/Documents/Coding/flits-constent`.

Relevante bestanden daar:

| Bestand | Wat |
|---|---|
| `webflow/custom.css` | `:root { --cb-* }`-variabelen + wat Webflow niet kan (focus-visible, knob-animatie, reduced motion). **Dit is het bestand dat de configurator genereert.** |
| `webflow/classes.css` | De Webflow-classes als gewone CSS (`.cb-banner`, `.cb-card`, `.cb-btn`, `.cb-switch.is-on`, …). Verwijst naar `--cb-*`. Gegenereerd. |
| `webflow/component.html` | De banner-markup (data-/aria-attributen + classes). Gegenereerd. |
| `webflow/clipboard.json` | Webflow clipboard-payload (`@webflow/XscpData`). Plakken werkt alleen als het op de clipboard staat als MIME-type `application/json` (zie `demo/index.html`, knop "Copy to Webflow"). |
| `webflow/clipboard.js` | Bron van de drie bovenstaande bestanden. |
| `dist/head.snippet.html` | Head-snippet (inline, boven GTM). |
| `dist/consent.min.js` | Footer-script, via `https://cdn.jsdelivr.net/gh/flitsdigital/cookie-consent@1.0.0/dist/consent.min.js`. |
| `README.md`, `docs.md` | Installatie-instructies. |

De variabelen (exact deze namen, in deze volgorde):

```css
:root {
  --cb-color: #1b020d;                /* tekst */
  --cb-color-background: #fff;        /* kaart */
  --cb-color-surface: #f6f1f1;        /* secundaire knop, lijnen */
  --cb-color-accent: #ec4d94;         /* primaire knop, switch aan */
  --cb-color-accent-text: #1b020d;    /* tekst op accent */
  --cb-color-switch-off: #d9cfd3;
  --cb-color-focus: #1b020d;
  --cb-font-size: 15px;
  --cb-font-size-small: 13px;
  --cb-font-size-title: 20px;
  --cb-padding: 24px;
  --cb-offset: 16px;
  --cb-max-width: 560px;
  --cb-border-radius: 12px;
  --cb-button-radius: 8px;
  --cb-shadow: 0 12px 40px rgba(27, 2, 13, 0.18);
  --cb-switch-width: 44px;
  --cb-switch-height: 24px;
  --cb-switch-padding: 3px;
  --cb-z-index: 9999;
  --cb-ease: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Er is bewust **geen** `--cb-font-family`: de banner erft het font van de site. Voeg die niet toe.

Per-klant config (gaat in de head, vóór de snippet):

```html
<script>window.FlitsConsent = { key: 'KLANT_consent', version: 1, days: 180 };</script>
```

## Wat je bouwt

Een Next.js-app (App Router, TypeScript, geen database, deploy op Vercel) met één pagina:

1. **URL-veld.** Gebruiker plakt een website-URL (meestal `*.webflow.io` of een live domein).
2. **Extractie** (route handler `app/api/extract/route.ts`, server-side omdat CORS):
   - Fetch de HTML. Verzamel alle `<link rel="stylesheet">` en `<style>`-blokken, fetch de stylesheets (Webflow heeft er één: `…/css/<site>.webflow.<hash>.css`).
   - Parse met een CSS-parser (bv. `css-tree`) en haal op:
     - **Custom properties** uit `:root` / `html` / `body` (Webflow Variables staan op `:root` als `--_colors---primary` etc.), met waarde.
     - **Kleuren** uit alle declaraties (`color`, `background-color`, `border-color`) met telling hoe vaak ze voorkomen.
     - **Border-radius**-waarden met telling.
     - **Font-sizes** van `body`/`p` en `h2`/`h3`.
     - `body` `color` en `background-color`.
   - Return JSON: `{ variables: [{name, value}], colors: [{value, count}], radii: [{value, count}], fontSizes: {...}, body: {color, background} }`.
   - Time-out 10 s, alleen `http(s)`, max 5 stylesheets, max 2 MB per bestand. Foutmelding als de site niet bereikbaar is. Geen SSRF naar privé-IP's.
3. **Mapping naar `--cb-*`** (client-side, aanpasbaar):
   - `--cb-color` ← `body` color, anders donkerste veelvoorkomende kleur.
   - `--cb-color-background` ← `body` background, anders `#fff`.
   - `--cb-color-accent` ← meest voorkomende verzadigde kleur die niet zwart/wit/grijs is (of Webflow-variabele met `primary`/`accent`/`brand` in de naam als die er is).
   - `--cb-color-accent-text` ← `#fff` of `--cb-color`, welke van de twee ≥ 4,5:1 contrast heeft met het accent (voorkeur `#fff` als beide kunnen).
   - `--cb-color-surface` ← lichtste grijs/tint uit de kleuren, anders `color-mix(in srgb, var(--cb-color) 6%, var(--cb-color-background))`.
   - `--cb-color-switch-off` ← `color-mix(in srgb, var(--cb-color) 18%, var(--cb-color-background))`.
   - `--cb-color-focus` ← `--cb-color`.
   - `--cb-border-radius` ← meest voorkomende radius > 0, `--cb-button-radius` ← de op één na meest voorkomende of `calc(var(--cb-border-radius) / 1.5)`.
   - `--cb-font-size` ← `p`/`body` font-size; `--cb-font-size-title` ← `h3` font-size; `--cb-font-size-small` ← `calc(var(--cb-font-size) - 2px)`.
   - Rest: defaults uit de lijst hierboven.
4. **Editor.** Elke variabele als veld (color picker voor kleuren, tekst voor de rest) met een dropdown "kies uit gevonden waarden" (de geëxtraheerde kleuren/radii met hun telling en een swatch). Toon per kleurcombinatie de contrastratio en een AA-badge (accent/accent-text, color/background, color/surface).
5. **Live preview.** Rechts de banner, gerenderd met `classes.css` + `component.html` uit de source-repo en de actuele `:root`-waarden. Toggle tussen "gesloten" (alleen knoppen) en "instellingen open" (`[data-cb="prefs"]` zichtbaar, banner `display:block`), en een mobiel/desktop-schakelaar. Optioneel: de site zelf als achtergrond in een `<iframe>` (werkt niet bij `X-Frame-Options`; dan een neutrale achtergrond in `--cb-color-background`-tint).
6. **Output** (kopieerknoppen, allemaal in één "Exporteren"-paneel):
   - `custom.css`: de volledige inhoud van `webflow/custom.css` met de `:root`-waarden vervangen door de gekozen waarden, in een `<style>`-tag (klaar voor Site settings → Head).
   - Head-code: config-script (met veld voor `key`, default afgeleid van de domeinnaam, bv. `veenstra_consent`) + inhoud van `dist/head.snippet.html`.
   - Footer-code: `<script src="https://cdn.jsdelivr.net/gh/flitsdigital/cookie-consent@<versie>/dist/consent.min.js" defer></script>`. Versie = de laatste tag van de source-repo (haal op via `https://api.github.com/repos/flitsdigital/cookie-consent/tags`, fallback `1.0.0`).
   - "Copy to Webflow": zet `clipboard.json` op de clipboard met `clipboardData.setData('application/json', …)` (exact zoals `demo/index.html` in de source-repo; `navigator.clipboard.write` met een JSON-blob werkt niet in Webflow).
   - De teksten in de banner mogen in de configurator ook aangepast worden (titel, tekst, knoplabels, categorie-omschrijvingen); pas dan de tekstnodes in de clipboard-JSON aan vóór het kopiëren (`nodes[].text === true` → `v`).
7. **Deelbare state:** alle gekozen waarden in de URL-querystring (`?url=…&cb-color-accent=%23ec4d94…`), zodat een link naar een collega genoeg is. Geen opslag.

## Bronbestanden binnenhalen

Kopieer niet met de hand. Eén npm-script dat de vier bestanden uit de source-repo ophaalt naar `public/consent/`:

```json
"sync": "for f in webflow/custom.css webflow/classes.css webflow/component.html webflow/clipboard.json dist/head.snippet.html; do curl -sfL https://raw.githubusercontent.com/flitsdigital/cookie-consent/main/$f -o public/consent/$(basename $f); done"
```

Draai het in `prebuild`. Zo is de source-repo de enige bron van waarheid.

## Stack en stijl

- Next.js (laatste stabiele), App Router, TypeScript, Tailwind voor de configurator-UI zelf. Geen UI-library, geen state-library, geen database, geen auth.
- Dependencies beperken tot: `css-tree` (parsen), eventueel `culori` (contrast/kleuren). Meer alleen als het echt niet anders kan.
- Preview: gewone HTML in een `<div>` met de twee CSS-bestanden ge-scoped via `@scope` of een iframe met `srcdoc` (iframe heeft de voorkeur: geen stijl-lekkage van Tailwind naar de banner).
- Nederlands in de UI.
- Eén pagina, weinig bestanden. Geen abstracties voor één gebruik.

## Testen

- Unit (Vitest): mapping-functie met een paar fixtures (een Webflow-CSS met variabelen; een site zonder variabelen; een site met alleen zwart/wit).
- Eén Playwright-test: URL invullen (mock de extract-route), preview toont accentkleur, "Copy to Webflow" zet `application/json` op de clipboard.

## Definition of done

1. `https://<app>.vercel.app` → URL van `https://veenstra-edelmetaal.webflow.io/` plakken → binnen 5 s staan de kleuren van die site in de preview.
2. Export-paneel geeft de drie codeblokken + Copy to Webflow; plakken in de Designer levert de component op.
3. `custom.css`-output is byte-voor-byte gelijk aan de source-versie behalve de `:root`-waarden.
4. README met: wat het is, `npm run sync`, `npm run dev`, deploy.

## Niet doen

- Geen wijzigingen in de source-repo vanuit deze sessie; ontbreekt er iets, noteer het als TODO voor die repo.
- Geen eigen banner-CSS of -markup schrijven; alles komt uit `public/consent/`.
- Geen extra `--cb-*`-variabelen bedenken.
