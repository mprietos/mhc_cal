import { CONFIG } from './config.js';
import * as cheerio from 'cheerio';

const norm = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

/**
 * Descarga y parsea los partidos de la fuente (sidgad, POST).
 * Endpoint real: https://www.server2.sidgad.es/fecapa/fecapa_cal_idc_<LEAGUE>_1.php
 *
 * ⚠️ AJUSTAR según el payload/respuesta reales (ver README):
 *   - CONFIG.sourceBody: parámetros del POST.
 *   - extractMatches(): mapear al formato interno.
 */
export async function fetchMatches() {
  const res = await fetch(CONFIG.sourceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (fecapa-cal)',
      'X-Requested-With': 'XMLHttpRequest',
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

  const all = extractMatches(raw);
  return all.filter(matchesFilter);
}

function extractMatches(raw) {
  return typeof raw === 'string' ? extractFromHTML(raw) : extractFromJSON(raw);
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

/**
 * ⚠️ AJUSTAR selectores a la tabla real que devuelva el .php.
 * Placeholder genérico: filas <tr> con celdas [fecha, hora, local, visitante, pista].
 */
function extractFromHTML(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('tr').each((_, tr) => {
    const c = $(tr)
      .find('td')
      .map((__, td) => $(td).text().trim())
      .get();
    if (c.length < 4) return;
    const [date, time, home, away, venue = ''] = c;
    if (!/\d/.test(date)) return; // salta cabeceras
    out.push({
      id: fallbackId({ data: date, local: home, visitant: away }),
      date: buildDate(date, time),
      home,
      away,
      category: '',
      competition: '',
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

function matchesFilter(m) {
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
