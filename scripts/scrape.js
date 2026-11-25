// Scraper que corre a GitHub Actions (no a Vercel: Puppeteer no hi cap).
//
// Per cada equip: obre el portal de FECAPA un sol cop, demana el calendari a
// l'API nova de sidgad, genera el .ics al repo i detecta canvis respecte a
// l'estat anterior (desat en un JSON commitejat). Si hi ha canvis, avisa per
// Telegram. GitHub Actions s'encarrega de commitejar els fitxers resultants.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { scrapeMatches, openPortal } from '../lib/sidgad.js';
import { buildIcal } from '../lib/ical.js';
import { diffMatches, hasChanges } from '../lib/diff.js';
import { notifyTelegram, diffMessage } from '../lib/notify.js';
import { CONFIG as CONFIG_ALEVI } from '../config.js';
import { CONFIG_FEM15 } from '../config.fem15.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = join(ROOT, 'partidos');

const TEAMS = [
  { config: CONFIG_ALEVI, slug: 'alevi' },
  { config: CONFIG_FEM15, slug: 'fem15' },
];

async function readState(slug) {
  try {
    return JSON.parse(await readFile(join(stateDir, `${slug}.json`), 'utf8'));
  } catch {
    return [];
  }
}

async function run() {
  await mkdir(stateDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await openPortal(browser);

    for (const { config, slug } of TEAMS) {
      const current = await scrapeMatches(config, { page });
      console.log(`[${config.calendarName}] ${current.length} partits`);

      // .ics sempre al dia (encara que no hi hagi canvis de diff, el resultat
      // o la pista poden haver canviat i volem servir l'últim).
      await writeFile(join(ROOT, `calendario_${config.idc}.ics`), buildIcal(current, config), 'utf8');

      const prev = await readState(slug);
      const diff = diffMatches(prev, current);
      if (hasChanges(diff)) {
        console.log(`  canvis:`, { added: diff.added.length, removed: diff.removed.length, changed: diff.changed.length });
        const msg = diffMessage(diff.added, diff.removed, diff.changed, config.calendarName);
        await notifyTelegram(msg, []); // subscriptors via TELEGRAM_CHAT_ID (coma-separats a l'env)
      } else {
        console.log('  sense canvis');
      }

      await writeFile(join(stateDir, `${slug}.json`), JSON.stringify(current, null, 2), 'utf8');
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('scrape error:', err);
  process.exit(1);
});
