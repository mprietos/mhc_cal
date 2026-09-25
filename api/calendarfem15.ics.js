import { fetchMatches } from '../lib/parse.js';
import { buildIcal } from '../lib/ical.js';
import { CONFIG_FEM15 } from '../config.fem15.js';

export default async function handler(req, res) {
  try {
    const matches = await fetchMatches(CONFIG_FEM15);
    const ical = buildIcal(matches, CONFIG_FEM15);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Disposition', 'inline; filename="mollet-hc-fem15.ics"');
    res.status(200).send(ical);
  } catch (err) {
    console.error('calendarfem15.ics error:', err);
    res.status(500).send('Error generant el calendari');
  }
}
