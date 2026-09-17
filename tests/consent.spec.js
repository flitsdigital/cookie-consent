const { test, expect } = require('@playwright/test');

const DEMO = '/demo/';
const KEY = 'demo_consent';
const banner = (page) => page.locator('[data-cb="banner"]');

// dataLayer: gtag-calls zijn `arguments`-objecten; maak er arrays van
const dl = (page) => page.evaluate(() => dataLayer.map((x) => (x.length !== undefined && !Array.isArray(x) ? Array.from(x) : x)));
const consentCalls = async (page, type) => (await dl(page)).filter((x) => Array.isArray(x) && x[0] === 'consent' && x[1] === type).map((x) => x[2]);
const updateEvents = async (page) => (await dl(page)).filter((x) => x && x.event === 'consent_update');

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
  await page.goto(DEMO);
});

test('1. eerste bezoek: banner zichtbaar, default denied, geen update', async ({ page }) => {
  await expect(banner(page)).toBeVisible();
  const [def] = await consentCalls(page, 'default');
  expect(def).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });
  expect(await consentCalls(page, 'update')).toHaveLength(0);
  expect(await updateEvents(page)).toHaveLength(0);
});

test('2. alles accepteren', async ({ page }) => {
  await page.click('[data-cb-action="accept"]');
  await expect(banner(page)).toBeHidden();
  expect(await consentCalls(page, 'update')).toEqual([{ ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' }]);
  expect(await updateEvents(page)).toEqual([{ event: 'consent_update', consent_analytics: true, consent_marketing: true }]);
  const stored = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
  expect(stored).toMatchObject({ v: 1, c: { analytics: true, marketing: true } });
});

test('3. herladen: banner blijft dicht, update vóór GTM', async ({ page }) => {
  await page.click('[data-cb-action="accept"]');
  await page.reload();
  await expect(banner(page)).toBeHidden();
  const layer = await dl(page);
  const upd = layer.findIndex((x) => Array.isArray(x) && x[1] === 'update');
  const gtm = layer.findIndex((x) => x && x.event === 'gtm.js');
  expect(upd).toBeGreaterThan(-1);
  expect(upd).toBeLessThan(gtm);
});

test('4. weigeren: alles denied', async ({ page }) => {
  await page.click('[data-cb-action="reject"]');
  await expect(banner(page)).toBeHidden();
  expect(await consentCalls(page, 'update')).toEqual([{ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }]);
  expect(await updateEvents(page)).toEqual([{ event: 'consent_update', consent_analytics: false, consent_marketing: false }]);
});

test('5. instellingen: alleen statistieken', async ({ page }) => {
  await expect(page.locator('[data-cb="prefs"]')).toBeHidden();
  await page.click('[data-cb-action="settings"]');
  await expect(page.locator('[data-cb="prefs"]')).toBeVisible();
  await expect(page.locator('[data-cb-action="settings"]')).toBeHidden();
  await page.click('[data-cb-toggle="analytics"]');
  await expect(page.locator('[data-cb-toggle="analytics"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-cb-toggle="analytics"]')).toHaveClass(/is-on/);
  await page.click('[data-cb-action="save"]');
  expect(await consentCalls(page, 'update')).toEqual([{ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }]);
});

test('6. footer-link opent voorkeuren met opgeslagen keuze', async ({ page }) => {
  await page.click('[data-cb-action="settings"]');
  await page.click('[data-cb-toggle="marketing"]');
  await page.click('[data-cb-action="save"]');
  await page.reload();
  await page.click('[data-cb-open]');
  await expect(banner(page)).toBeVisible();
  await expect(page.locator('[data-cb="prefs"]')).toBeVisible();
  await expect(page.locator('[data-cb-toggle="analytics"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[data-cb-toggle="marketing"]')).toHaveAttribute('aria-checked', 'true');
  // close-knop/Esc mag nu, want er is al een keuze; focus terug naar de opener
  await page.keyboard.press('Escape');
  await expect(banner(page)).toBeHidden();
  await expect(page.locator('[data-cb-open]')).toBeFocused();
});

test('7. andere versie of verlopen keuze toont de banner opnieuw', async ({ page }) => {
  const set = (o) => page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, o]);
  await set({ v: 2, t: Date.now(), c: { analytics: true, marketing: true } });
  await page.reload();
  await expect(banner(page)).toBeVisible();
  expect(await consentCalls(page, 'update')).toHaveLength(0);
  await set({ v: 1, t: Date.now() - 181 * 864e5, c: { analytics: true, marketing: true } });
  await page.reload();
  await expect(banner(page)).toBeVisible();
  expect(await consentCalls(page, 'update')).toHaveLength(0);
});

test('8. oud Hondsrug-formaat wordt gelezen', async ({ page }) => {
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: 1, a: true, m: false, t: Date.now() })), KEY);
  await page.reload();
  await expect(banner(page)).toBeHidden();
  expect(await consentCalls(page, 'update')).toEqual([{ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }]);
  expect(await page.evaluate(() => FlitsConsent.get())).toEqual({ analytics: true, marketing: false });
});

test('9. intrekken van analytics verwijdert _ga-cookies', async ({ page, context }) => {
  await page.click('[data-cb-action="accept"]');
  await page.evaluate(() => { document.cookie = '_ga=GA1.1.1;path=/'; document.cookie = '_ga_ABC123=GS1.1;path=/'; document.cookie = 'keep=1;path=/'; });
  await page.click('[data-cb-open]');
  await page.click('[data-cb-toggle="analytics"]'); // aan → uit
  await page.click('[data-cb-action="save"]');
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).not.toContain('_ga');
  expect(names).not.toContain('_ga_ABC123');
  expect(names).toContain('keep');
});

test('10. toetsenbord: Tab naar toggle, Spatie schakelt', async ({ page }) => {
  await page.click('[data-cb-action="settings"]');
  await expect(page.locator('[data-cb-toggle="analytics"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-cb-toggle="marketing"]')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-cb-toggle="marketing"]')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cb-toggle="marketing"]')).toHaveAttribute('aria-checked', 'false');
  await expect(banner(page)).toBeVisible(); // Enter op een <a href="#"> mag niet navigeren of sluiten
});

test('11. geblokkeerde localStorage: geen fouten, cookie-fallback', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e));
  await page.goto(DEMO);
  await expect(banner(page)).toBeVisible();
  await page.click('[data-cb-action="accept"]');
  await expect(banner(page)).toBeHidden();
  await page.reload();
  await expect(banner(page)).toBeHidden();
  expect(await consentCalls(page, 'update')).toHaveLength(1);
  expect(errors).toEqual([]);
  await context.close();
});

test('API: set/has/on en flits:consent-event', async ({ page }) => {
  await page.click('[data-cb-action="reject"]');
  const got = await page.evaluate(() => new Promise((resolve) => {
    const out = {};
    document.addEventListener('flits:consent', (e) => { out.event = e.detail; });
    FlitsConsent.on((c) => { out.on = c; });
    FlitsConsent.set({ analytics: true });
    out.has = [FlitsConsent.has('analytics'), FlitsConsent.has('marketing')];
    resolve(out);
  }));
  expect(got).toEqual({ event: { analytics: true, marketing: false }, on: { analytics: true, marketing: false }, has: [true, false] });
  await expect(banner(page)).toBeHidden();
});
