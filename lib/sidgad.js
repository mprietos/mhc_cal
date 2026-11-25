// Accés a l'API JSON nova de FECAPA (api.sidgad.com/fecapa/v1/hp/...).
//
// El novembre de 2026 la FECAPA va estrenar un portal nou
// (https://www.hoqueipatins.fecapa.cat/) que demana les dades a una API JSON
// protegida amb un token de sessió efímer. El servidor valida el domini i el
// token signat, així que no es pot cridar l'API amb un simple fetch (retorna
// {"status":"INVALID DOMAIN"}). La manera robusta és fer-ho des de dins de la
// mateixa pàgina del portal, amb la funció global window.sidgadFetch(recurs,
// params), que ja gestiona el token.
//
// Recurs que fem servir: calendar{id} -> { games: [...] }.

import puppeteer from 'puppeteer';
import { CONFIG as DEFAULT_CONFIG } from './config.js';

const PORTAL_URL = 'https://www.hoqueipatins.fecapa.cat/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const norm = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();

const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const isPlaceholder = (v) => {
  const s = clean(v);
  return !s || s === '--' || s === '_';
};

// Obre el portal i espera que window.sidgadFetch estigui disponible.
async function openPortal(browser, { timeoutMs = 60000 } = {}) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  await page.waitForFunction(() => typeof window.sidgadFetch === 'function', { timeout: 30000 });
  return page;
}

// Crida un recurs de l'API des de dins de la pàgina, amb reintent: si el token
// ha caducat (INVALID TOKEN) força'n un de nou i torna-ho a provar.
async function sidgadFetch(page, resource, params = {}, { retries = 2 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await page.evaluate(
      async (r, p) => {
        try {
          return { ok: true, data: await window.sidgadFetch(r, p) };
        } catch (e) {
          return { ok: false, error: String((e && e.message) || e) };
        }
      },
      resource,
      params
    );
    if (res.ok) return res.data;
    lastErr = new Error(`sidgad ${resource} ${JSON.stringify(params)}: ${res.error}`);
    await page
      .evaluate(() => {
        try { sessionStorage.removeItem('sg_tok'); } catch {}
        try {
          if (typeof window.sidgadPedirPermiso === 'function') return window.sidgadPedirPermiso();
        } catch {}
        return null;
      })
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw lastErr;
}

// Converteix la resposta de `calendar` a la nostra estructura de partits.
// Ignora les files especials FASE/JORNADA i els partits sense equips.
function mapGames(data, CONFIG) {
  const games = Array.isArray(data?.games) ? data.games : [];
  const out = [];

  for (const g of games) {
    const day = clean(g?.dia_partido).toUpperCase();
    if (day === 'FASE' || day === 'JORNADA') continue;

    const home = clean(g?.home_name);
    const away = clean(g?.away_name);
    if (!home || !away || isPlaceholder(home) || isPlaceholder(away)) continue;

    const dateM = clean(g.dia_partido).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dateM) continue;
    const timeM = clean(g.hora_partido).match(/^(\d{1,2}):(\d{2})$/);
    const [, d, mo, y] = dateM;
    const hh = timeM ? timeM[1].padStart(2, '0') : '00';
    const mm = timeM ? timeM[2] : '00';
    const isoDate = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${hh}:${mm}:00`;

    const isHome = CONFIG.teamMatches.some((t) => norm(home).includes(norm(t)));
    const opponent = isHome ? away : home;
    const venue = !isPlaceholder(g.pista)
      ? clean(g.pista)
      : isHome
        ? CONFIG.homeVenue
        : (CONFIG.awayVenues?.[norm(opponent)] ?? '');

    const result = clean(g.result).match(/^(\d{1,3})\s*[:\-]\s*(\d{1,3})$/);

    out.push({
      id: `${norm(home)}-${norm(away)}`.replace(/\s+/g, '_'),
      date: isoDate,
      home,
      away,
      category: '',
      competition: CONFIG.calendarName,
      venue,
      status: result ? 'played' : 'scheduled',
    });
  }

  return out;
}

function matchesFilter(m, CONFIG) {
  const hay = norm(`${m.home} ${m.away}`);
  const teamOk = CONFIG.teamMatches.some((t) => hay.includes(norm(t)));
  if (!teamOk) return false;
  if (CONFIG.categoryMatches.length) {
    const cat = norm(`${m.category} ${m.competition}`);
    if (!cat) return true;
    return CONFIG.categoryMatches.some((c) => cat.includes(norm(c)));
  }
  return true;
}

// Punt d'entrada: obre un navegador headless, demana el calendari de CONFIG.idc
// i retorna els partits de l'equip seguit. Pots reusar una `page` ja oberta
// passant-la per processar diverses lligues sense reobrir el portal.
export async function scrapeMatches(CONFIG = DEFAULT_CONFIG, { page } = {}) {
  if (page) {
    const data = await sidgadFetch(page, 'calendar', { id: CONFIG.idc });
    return mapGames(data, CONFIG).filter((m) => matchesFilter(m, CONFIG));
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const p = await openPortal(browser);
    const data = await sidgadFetch(p, 'calendar', { id: CONFIG.idc });
    return mapGames(data, CONFIG).filter((m) => matchesFilter(m, CONFIG));
  } finally {
    await browser.close();
  }
}

export { openPortal, sidgadFetch, PORTAL_URL };
