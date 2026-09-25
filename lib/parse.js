import { CONFIG as DEFAULT_CONFIG } from './config.js';
import * as cheerio from 'cheerio';

const norm = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

export async function fetchMatches(CONFIG = DEFAULT_CONFIG) {
  const res = await fetch(CONFIG.sourceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: CONFIG.sourceReferer,
      Origin: CONFIG.sourceOrigin,
    },
    body: new URLSearchParams(CONFIG.sourceBody).toString(),
  });
  if (!res.ok) throw new Error(`POST ${CONFIG.sourceUrl} -> ${res.status}`);

  const text = await res.text();
  let raw;
  try {
    raw = JSON.parse(text); // si devuelve JSON
  } catch {
    raw = text; // si devuelve HTML
  }

  const all = extractMatches(raw, CONFIG);
  return all.filter((m) => matchesFilter(m, CONFIG));
}

function extractMatches(raw, CONFIG) {
  return typeof raw === 'string' ? extractFromHTML(raw, CONFIG) : extractFromJSON(raw);
}

function extractFromJSON(raw) {
  const list = raw.matches || raw.data || raw.partits || [];
  return list.map((m) => ({
    id: String(m.id ?? '') || fallbackId(m),
    date: buildDate(m.date ?? m.data, m.time ?? m.hora),
    home: m.home ?? m.local ?? '',
    away: m.away ?? m.visitant ?? '',
    category: m.category ?? m.categoria ?? '',
    competition: m.competition ?? m.competicio ?? '',
    venue: m.venue ?? m.pista ?? m.camp ?? '',
    status: m.status ?? m.estat ?? 'scheduled',
  }));
}

function extractFromHTML(html, CONFIG) {
  const $ = cheerio.load(html);

  // Build phase-id → phase-name map from the filter <select>
  const phaseNames = {};
  $('select.filter_fase_select option').each((_, opt) => {
    const val = $(opt).attr('value');
    if (val && val !== '0') phaseNames[val] = $(opt).text().trim();
  });

  const out = [];

  $('tr.team_class').each((_, tr) => {
    const $tr = $(tr);

    const gamedateAttr = $tr.attr('gamedate') || '';
    if (!gamedateAttr || !/^\d{8}$/.test(gamedateAttr)) return;

    const time = $tr.find('td[width="45"].tabla_standard_less').first().text().trim();

    const teams = $tr.find('div.no_mobile.nombre_junto_logo').map((_, el) => $(el).text().trim()).get();
    if (teams.length < 2) return;
    const [home, away] = teams;

    const tableClass = $tr.closest('table').attr('class') || '';
    const phaseMatch = tableClass.match(/content_fase_(\d+)/);
    const phaseId = phaseMatch ? phaseMatch[1] : '';
    const phaseName = phaseNames[phaseId] || '';

    const isoDate = `${gamedateAttr.slice(0, 4)}-${gamedateAttr.slice(4, 6)}-${gamedateAttr.slice(6, 8)}T${(time || '00:00').padStart(5, '0')}:00`;

    const isHome = CONFIG.teamMatches.some((t) => norm(home).includes(norm(t)));
    const opponent = isHome ? away : home;
    const venue = isHome
      ? CONFIG.homeVenue
      : (CONFIG.awayVenues?.[norm(opponent)] ?? '');

    out.push({
      id: `${norm(home)}-${norm(away)}`.replace(/\s+/g, '_'),
      date: isoDate,
      home,
      away,
      category: phaseName,
      competition: phaseName,
      venue,
      status: 'scheduled',
    });
  });

  return out;
}

const fallbackId = (m) =>
  `${m.date ?? m.data}-${norm(m.home ?? m.local)}-${norm(
    m.away ?? m.visitant
  )}`.replace(/\s+/g, '_');

function buildDate(date, time) {
  if (!date) return null;
  if (String(date).includes('T')) return date; // ya ISO
  const [d, mo, y] = String(date).split(/[/\-.]/);
  const [h = '00', mi = '00'] = String(time || '').split(':');
  if (!y) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(
    2,
    '0'
  )}T${h.padStart(2, '0')}:${mi.padStart(2, '0')}:00`;
}

function matchesFilter(m, CONFIG) {
  const hay = norm(`${m.home} ${m.away}`);
  const teamOk = CONFIG.teamMatches.some((t) => hay.includes(norm(t)));
  if (!teamOk) return false;
  if (CONFIG.categoryMatches.length) {
    const cat = norm(`${m.category} ${m.competition}`);
    if (!cat) return true; // si la fuente no da categoría, no filtres por ella
    return CONFIG.categoryMatches.some((c) => cat.includes(norm(c)));
  }
  return true;
}
