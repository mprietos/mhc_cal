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
    const matchTime = new Date(m.date);
    const start = new Date(matchTime.getTime() - 60 * 60 * 1000); // 1h abans del partit
    const end = new Date(matchTime.getTime() + 90 * 60 * 1000);

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
