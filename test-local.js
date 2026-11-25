#!/usr/bin/env node
// Prova local: obre el portal, descarrega els partits via l'API de sidgad i
// aboca el .ics a stdout (o a un fitxer).
// Ús: node test-local.js            -> mostra el .ics per consola
//     node test-local.js > out.ics  -> desa el fitxer
//     node test-local.js fem15      -> calendari del Fem 15 en comptes de l'Aleví

import { scrapeMatches } from './lib/sidgad.js';
import { buildIcal } from './lib/ical.js';
import { CONFIG as ALEVI } from './config.js';
import { CONFIG_FEM15 } from './config.fem15.js';

const cfg = process.argv[2] === 'fem15' ? CONFIG_FEM15 : ALEVI;

const matches = await scrapeMatches(cfg);

if (matches.length === 0) {
  console.error('⚠️  No s\'han trobat partits. Revisa el config (idc) i lib/sidgad.js.');
  process.exit(1);
}

console.error(`✅ ${matches.length} partit(s) trobat(s) [${cfg.calendarName}]:`);
for (const m of matches) {
  console.error(`   ${m.date ?? '??'} — ${m.home} vs ${m.away} (${m.venue || 'lloc?'})`);
}
console.error('');

process.stdout.write(buildIcal(matches, cfg));
