import ICalModule from 'ical-generator';
import { CONFIG } from './config.js';

const ical = ICalModule.default ?? ICalModule;

export function buildIcal(matches) {
  const cal = ical({
    name: CONFIG.calendarName,
    timezone: CONFIG.timezone,
    prodId: { company: 'fecapa-cal', product: 'calendar', language: 'CA' },
  });

  for (const m of matches) {
    if (!m.date) continue;
    const start = new Date(m.date);
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    const description = [
      m.competition && `Competició: ${m.competition}`,
      m.category && `Categoria: ${m.category}`,
      m.status && m.status !== 'scheduled' && `Estat: ${m.status}`,
    ]
      .filter(Boolean)
      .join('\n');

    cal.createEvent({
      uid: `${m.id}@fecapa-cal`,
      start,
      end,
      summary: `${m.home} vs ${m.away}`,
      location: m.venue || undefined,
      description: description || undefined,
    });
  }

  return cal.toString();
}
