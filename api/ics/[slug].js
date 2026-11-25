import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TEAMS } from '../../teams.js';

// Endpoint dinàmic: /api/ics/<slug> -> serveix calendario_<idc>_<slug>.ics,
// generat per GitHub Actions i commitejat al repo. Un sol endpoint per a tots
// els equips (els antics /api/calendar.ics i /api/calendarfem15.ics segueixen
// existint per compatibilitat amb les subscripcions velles).
export default async function handler(req, res) {
  const slug = req.query.slug;
  const team = TEAMS.find((t) => t.slug === slug);
  if (!team) {
    res.status(404).send('Equip no trobat');
    return;
  }
  try {
    const ics = await readFile(join(process.cwd(), `calendario_${team.idc}_${team.slug}.ics`), 'utf8');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Disposition', `inline; filename="mollet-${team.slug}.ics"`);
    res.status(200).send(ics);
  } catch (err) {
    console.error(`ics ${slug} error:`, err);
    res.status(500).send('Error servint el calendari');
  }
}
