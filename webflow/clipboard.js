// Genereert webflow/clipboard.json: plak de inhoud in de Webflow Designer (cmd+v) en je hebt de component.
// Alle class-styling zit in de Webflow-classes via var(--cb-*); de variabelen + wat Webflow niet kan staan in component.css.
const { randomUUID } = require('crypto');
const fs = require('fs');

const styles = [], nodes = [];
const v = (n) => `@raw<|var(--cb-${n})|>`;
const style = (name, styleLess, variants = {}, comb = '') => { const s = { _id: randomUUID(), fake: false, type: 'class', name, namespace: '', comb, styleLess, variants, children: [], createdBy: '000000000000000000000000', origin: null, selector: null }; styles.push(s); return s; };
const combo = (parent, name, styleLess) => { const s = style(name, styleLess, {}, '&'); s.parentName = parent.name; parent.children.push(s._id); return s; };
const text = (val) => { const t = { _id: randomUUID(), text: true, v: val }; nodes.push(t); return t._id; };
const node = (type, tag, classes, children, data) => { const n = { _id: randomUUID(), type, tag, classes: classes.map((c) => c._id), children, data }; nodes.push(n); return n._id; };
const xattr = (obj) => Object.entries(obj).map(([name, value]) => ({ name, value }));
const div = (classes, children, data = {}) => node('Block', 'div', classes, children, { tag: 'div', text: false, ...data });
const txt = (classes, val) => node('Block', 'div', classes, [text(val)], { tag: 'div', text: true });
const link = (classes, val, attrs, block = '') => node('Link', 'a', classes, val === null ? [] : [text(val)], { button: false, block, link: { mode: 'external', url: '#' }, xattr: xattr(attrs) });

// --- classes -------------------------------------------------------------
const banner = style('cb-banner', `position: fixed; bottom: ${v('offset')}; left: ${v('offset')}; right: ${v('offset')}; z-index: ${v('z-index')}; max-width: ${v('max-width')}; margin-left: auto; margin-right: auto; display: none;`);
const card = style('cb-card', `padding-top: ${v('padding')}; padding-right: ${v('padding')}; padding-bottom: ${v('padding')}; padding-left: ${v('padding')}; color: ${v('color')}; background-color: ${v('color-background')}; border-radius: ${v('border-radius')}; box-shadow: ${v('shadow')};`);
const title = style('cb-title', `margin-top: 0px; margin-bottom: 0.5em; font-size: ${v('font-size-title')}; font-weight: 700; line-height: 1.2;`);
const textC = style('cb-text', `margin-top: 0px; margin-bottom: 1em; font-size: ${v('font-size')}; line-height: 1.5;`);
const linkC = style('cb-link', `display: inline-block; margin-bottom: 1em; color: ${v('color-accent')}; text-decoration: underline; font-size: ${v('font-size')};`);
const prefs = style('cb-prefs', `display: none; margin-bottom: 1em; border-top-style: solid; border-top-width: 1px; border-top-color: ${v('color-surface')};`);
const row = style('cb-row', `display: flex; justify-content: space-between; align-items: center; grid-column-gap: 1em; padding-top: 0.75em; padding-bottom: 0.75em; border-bottom-style: solid; border-bottom-width: 1px; border-bottom-color: ${v('color-surface')};`);
const rowContent = style('cb-row-content', `flex-grow: 1; flex-shrink: 1; flex-basis: 0%;`);
const rowTitle = style('cb-row-title', `font-size: ${v('font-size')}; font-weight: 700; line-height: 1.3;`);
const rowText = style('cb-row-text', `font-size: ${v('font-size-small')}; line-height: 1.4; opacity: 0.75;`);
const sw = style('cb-switch', `display: flex; align-items: center; flex-grow: 0; flex-shrink: 0; flex-basis: auto; width: ${v('switch-width')}; height: ${v('switch-height')}; padding-top: ${v('switch-padding')}; padding-right: ${v('switch-padding')}; padding-bottom: ${v('switch-padding')}; padding-left: ${v('switch-padding')}; background-color: ${v('color-switch-off')}; border-radius: 999px; cursor: pointer;`);
combo(sw, 'is-on', `background-color: ${v('color-accent')};`);
combo(sw, 'is-locked', `cursor: default; opacity: 0.6;`);
const knob = style('cb-knob', `flex-grow: 0; flex-shrink: 0; flex-basis: auto; width: @raw<|calc(var(--cb-switch-height) - 2 * var(--cb-switch-padding))|>; height: 100%; background-color: ${v('color-background')}; border-radius: 999px;`);
const actions = style('cb-actions', `display: flex; flex-wrap: wrap; justify-content: flex-end; grid-column-gap: 0.5em; grid-row-gap: 0.5em;`);
const btn = style('cb-btn', `display: flex; justify-content: center; align-items: center; min-height: 2.75em; padding-top: 0.75em; padding-right: 1.125em; padding-bottom: 0.75em; padding-left: 1.125em; color: ${v('color-accent-text')}; background-color: ${v('color-accent')}; border-radius: ${v('button-radius')}; font-size: ${v('font-size')}; font-weight: 700; line-height: 1; text-align: center; text-decoration: none; cursor: pointer;`, { tiny: { styleLess: 'flex-grow: 1; flex-shrink: 1; flex-basis: 40%;' } });
combo(btn, 'is-secondary', `color: ${v('color')}; background-color: ${v('color-surface')};`);

// --- structuur -----------------------------------------------------------
const switchRow = (label, desc, cat) => div([row], [
  div([rowContent], [txt([rowTitle], label), txt([rowText], desc)]),
  cat
    ? node('Link', 'a', [sw], [div([knob], [])], { button: false, block: 'inline', link: { mode: 'external', url: '#' }, xattr: xattr({ role: 'switch', 'aria-checked': 'false', 'aria-label': label, 'data-cb-toggle': cat }) })
    : div([sw, sw.children.map((id) => styles.find((s) => s._id === id))].flat(), [div([knob], [])], { xattr: xattr({ role: 'switch', 'aria-checked': 'true', 'aria-disabled': 'true', 'aria-label': label }) }),
]);

const root = div([banner], [
  div([card], [
    node('Heading', 'h2', [title], [text('Wij gebruiken cookies')], { attr: { id: 'cb-title' } }),
    node('Paragraph', 'p', [textC], [text('Wij gebruiken functionele cookies om de website goed te laten werken. Met uw toestemming gebruiken we ook cookies voor statistieken (Google Analytics en Microsoft Clarity) en advertenties (Google Ads en Meta).')], { attr: { id: 'cb-text' } }),
    node('Link', 'a', [linkC], [text('Lees ons privacybeleid')], { button: false, block: '', link: { mode: 'external', url: '/privacybeleid' } }),
    div([prefs], [
      switchRow('Noodzakelijk', 'Nodig om de website goed te laten werken. Staat altijd aan.', null),
      switchRow('Statistieken', 'Inzicht in hoe bezoekers de website gebruiken, via Google Analytics en Microsoft Clarity.', 'analytics'),
      switchRow('Marketing', 'Meten en tonen van advertenties via Google Ads en Meta (Facebook en Instagram).', 'marketing'),
    ], { xattr: xattr({ 'data-cb': 'prefs' }) }),
    div([actions], [
      link([btn, styles.find((s) => s.name === 'is-secondary')], 'Instellingen', { 'data-cb-action': 'settings' }),
      link([btn, styles.find((s) => s.name === 'is-secondary')], 'Keuze opslaan', { 'data-cb-action': 'save' }),
      link([btn], 'Weigeren', { 'data-cb-action': 'reject' }),
      link([btn], 'Alles accepteren', { 'data-cb-action': 'accept' }),
    ]),
  ]),
], { xattr: xattr({ 'data-cb': 'banner', role: 'dialog', 'aria-labelledby': 'cb-title', 'aria-describedby': 'cb-text' }) });

// root moet vooraan staan
nodes.unshift(nodes.splice(nodes.findIndex((n) => n._id === root), 1)[0]);
const payload = { type: '@webflow/XscpData', payload: { nodes, styles, assets: [], ix1: [], ix2: { interactions: [], events: [], actionLists: [] } }, meta: { droppedLinks: 0, dynBindRemovedCount: 0, dynListBindRemovedCount: 0, paginationRemovedCount: 0, universalBindingsRemovedCount: 0, unlinkedSymbolCount: 0, codeComponentsRemovedCount: 0, richTextComponentsStripped: false } };
fs.writeFileSync(__dirname + '/clipboard.json', JSON.stringify(payload));

// Dezelfde classes als gewone CSS (voor de demo / niet-Webflow-gebruik)
const media = { medium: '(max-width: 991px)', small: '(max-width: 767px)', tiny: '(max-width: 479px)' };
const raw = (s) => s.replace(/@raw<\|(.*?)\|>/g, '$1');
const sel = (s) => (s.parentName ? `.${s.parentName}.${s.name}` : `.${s.name}`);
let css = '/* Gegenereerd door webflow/clipboard.js: de Webflow-classes als CSS. Vereist custom.css. */\n';
styles.forEach((s) => { css += `${sel(s)} { ${raw(s.styleLess)} }\n`; });
styles.forEach((s) => Object.entries(s.variants).forEach(([k, vv]) => { css += `@media ${media[k]} { ${sel(s)} { ${raw(vv.styleLess)} } }\n`; }));
fs.writeFileSync(__dirname + '/classes.css', css);
// Referentie-markup zoals Webflow het publiceert (link-blocks krijgen w-inline-block)
const byId = Object.fromEntries(nodes.map((n) => [n._id, n]));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = (id, ind = '') => {
  const n = byId[id];
  if (n.text) return ind + esc(n.v) + '\n';
  const cls = n.classes.map((c) => styles.find((s) => s._id === c).name);
  if (n.type === 'Link' && n.data.block === 'inline') cls.push('w-inline-block');
  const a = [];
  if (n.type === 'Link') a.push(`href="${n.data.link.url}"`);
  (n.data.xattr || []).forEach((x) => a.push(`${x.name}="${x.value}"`));
  if (n.data.attr && n.data.attr.id) a.push(`id="${n.data.attr.id}"`);
  a.push(`class="${cls.join(' ')}"`);
  const inner = n.children.map((c) => html(c, ind + '  ')).join('');
  return `${ind}<${n.tag} ${a.join(' ')}>${inner.trim() && !inner.includes('<') ? inner.trim() : '\n' + inner + ind}</${n.tag}>\n`;
};
fs.writeFileSync(__dirname + '/component.html', '<!-- Gegenereerd door webflow/clipboard.js. Alleen de data-/aria-attributen zijn het contract; classes zijn vrij. -->\n' + html(root) + '<!-- Ergens in de footer: -->\n<a href="#" data-cb-open="true">Cookie-instellingen</a>\n');
console.log('webflow/clipboard.json:', nodes.length, 'nodes,', styles.length, 'styles; webflow/classes.css geschreven');
