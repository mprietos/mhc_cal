// Scraper que corre a GitHub Actions (no a Vercel: Puppeteer no hi cap).
//
// Obre el portal de FECAPA un sol cop. Per cada competició (idc) demana el
// calendari UNA vegada i el reusa per a tots els equips de Mollet d'aquella
// lliga (A/B/C). Per cada equip: genera calendario_<idc>_<slug>.ics, detecta
// canvis respecte a partidos/<slug>.json i avisa per Telegram. A més genera un
// JSON agregat public/data/matches.json que alimenta la web i la vista
// coordinador. GitHub Actions commiteja els fitxers resultants.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { openPortal, sidgadFetch, mapGamesFor } from '../lib/sidgad.js';
import { buildIcal } from '../lib/ical.js';
import { diffMatches, hasChanges } from '../lib/diff.js';
import { notifyTelegram, diffMessage } from '../lib/notify.js';
import { TEAMS, toConfig } from '../teams.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = join(ROOT, 'partidos');
const dataDir = join(ROOT, 'public', 'data');

// Equips que mantenen un .ics amb nom antic perquè hi ha gent ja subscrita.
const LEGACY_ICS = { '4789': 'calendario_4789.ics', '4802': 'calendario_4802.ics' };

async function readState(slug) {
  try {
    return JSON.parse(await readFile(join(stateDir, `${slug}.json`), 'utf8'));
  } catch {
    return [];
  }
}

// Agrupa els equips per idc per no demanar el mateix calendari diverses vegades.
function groupByIdc(teams) {
  const map = new Map();
  for (const t of teams) {
    if (!map.has(t.idc)) map.set(t.idc, []);
    map.get(t.idc).push(t);
  }
  return map;
}

async function run() {
  await mkdir(stateDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const teamsMeta = [];
  const allMatches = [];

  try {
    const page = await openPortal(browser);
    const byIdc = groupByIdc(TEAMS);

    for (const [idc, teams] of byIdc) {
      const data = await sidgadFetch(page, 'calendar', { id: idc });
      console.log(`[idc ${idc}] calendari descarregat (${teams.length} equip/s)`);

      for (const team of teams) {
        const config = toConfig(team);
        const current = mapGamesFor(data, config);
        console.log(`  · ${team.calendarName}: ${current.length} partits`);

        // .ics per equip (nom nou) + nom antic si és legacy.
        const ics = buildIcal(current, config);
        await writeFile(join(ROOT, `calendario_${idc}_${team.slug}.ics`), ics, 'utf8');
        if (LEGACY_ICS[idc]) await writeFile(join(ROOT, LEGACY_ICS[idc]), ics, 'utf8');

        // Diff + Telegram.
        const prev = await readState(team.slug);
        const diff = diffMatches(prev, current);
        if (hasChanges(diff)) {
          console.log(`    canvis:`, { added: diff.added.length, removed: diff.removed.length, changed: diff.changed.length });
          const msg = diffMessage(diff.added, diff.removed, diff.changed, team.calendarName);
          await notifyTelegram(msg, []);
        }
        await writeFile(join(stateDir, `${team.slug}.json`), JSON.stringify(current, null, 2), 'utf8');

        // Metadades + acumulat per al JSON agregat.
        const now = new Date();
        const nextCount = current.filter((m) => m.date && new Date(m.date) >= now).length;
        teamsMeta.push({
          slug: team.slug,
          team: team.team,
          category: team.category,
          calendarName: team.calendarName,
          idc,
          icsUrl: `/api/ics/${team.slug}`,
          total: current.length,
          next: nextCount,
        });
        for (const m of current) allMatches.push({ ...m, slug: team.slug, category: team.category });
      }
    }
  } finally {
    await browser.close();
  }

  // Agregat: deduplica per id (els derbis interns surten a dos equips) i guarda
  // la llista de slugs de Mollet implicats a cada partit.
  const byId = new Map();
  for (const m of allMatches) {
    const prev = byId.get(m.id);
    if (prev) {
      if (!prev.teams.includes(m.slug)) prev.teams.push(m.slug);
    } else {
      const { slug, ...rest } = m;
      byId.set(m.id, { ...rest, teams: [m.slug] });
    }
  }
  const matches = [...byId.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  await writeFile(
    join(dataDir, 'matches.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), teams: teamsMeta, matches }, null, 2),
    'utf8'
  );
  console.log(`\nAgregat: ${teamsMeta.length} equips, ${matches.length} partits únics.`);
}

run().catch((err) => {
  console.error('scrape error:', err);
  process.exit(1);
});
