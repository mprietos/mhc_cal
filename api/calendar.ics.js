import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONFIG } from '../config.js';

// El .ics el genera GitHub Actions (Puppeteer no cap a una funció serverless),
// el commiteja al repo i aquí només el servim.
export default async function handler(req, res) {
  try {
    const ical = await readFile(join(process.cwd(), `calendario_${CONFIG.idc}.ics`), 'utf8');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Disposition', 'inline; filename="mollet-hc-alevi.ics"');
    res.status(200).send(ical);
  } catch (err) {
    console.error('calendar.ics error:', err);
    res.status(500).send('Error servint el calendari');
  }
}
