#!/usr/bin/env node
// Prueba local: descarga partidos y vuelca el .ics a stdout (o a un archivo).
// Uso: node test-local.js            -> muestra el .ics en consola
//      node test-local.js > out.ics  -> guarda el archivo

import { fetchMatches } from './lib/parse.js';
import { buildIcal } from './lib/ical.js';

const matches = await fetchMatches();

if (matches.length === 0) {
  console.error('⚠️  No se encontraron partidos. Revisa config.js y el endpoint.');
  console.error('   Puede que el payload del POST necesite ajuste (ver README).');
  process.exit(1);
}

console.error(`✅ ${matches.length} partido(s) encontrado(s):`);
for (const m of matches) {
  console.error(`   ${m.date ?? '??'} — ${m.home} vs ${m.away} (${m.venue || 'lloc?'})`);
}
console.error('');

const ical = buildIcal(matches);
process.stdout.write(ical);
