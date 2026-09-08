import { fetchMatches } from '../lib/parse.js';
import { buildIcal } from '../lib/ical.js';

export default async function handler(req, res) {
  try {
    const matches = await fetchMatches();
    const ical = buildIcal(matches);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Disposition', 'inline; filename="mollet-hc-alevi.ics"');
    res.status(200).send(ical);
  } catch (err) {
    console.error('calendar.ics error:', err);
    res.status(500).send('Error generant el calendari');
  }
}
