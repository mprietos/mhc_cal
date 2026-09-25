import { kv } from '@vercel/kv';
import { fetchMatches } from '../lib/parse.js';
import { diffMatches, hasChanges } from '../lib/diff.js';
import { notifyTelegram, diffMessage } from '../lib/notify.js';
import { CONFIG as CONFIG_ALEVI } from '../lib/config.js';
import { CONFIG_FEM15 } from '../config.fem15.js';

const TEAMS = [
  {
    config: CONFIG_ALEVI,
    kvMatches: 'mollet_alevi_matches',
    kvSubscribers: 'telegram_subscribers',
  },
  {
    config: CONFIG_FEM15,
    kvMatches: 'mollet_fem15_matches',
    kvSubscribers: 'telegram_subscribers_fem15',
  },
];

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization ?? '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const results = await Promise.all(TEAMS.map(async ({ config, kvMatches, kvSubscribers }) => {
      const current = await fetchMatches(config);
      const prevRaw = await kv.get(kvMatches);
      const prev = prevRaw ?? [];

      const diff = diffMatches(prev, current);

      if (hasChanges(diff)) {
        console.log(`Canvis detectats [${config.calendarName}]:`, diff);
        const msg = diffMessage(diff.added, diff.removed, diff.changed, config.calendarName);
        const subscribers = (await kv.get(kvSubscribers)) ?? [];
        await notifyTelegram(msg, subscribers);
        await kv.set(kvMatches, current);
      } else {
        console.log(`Sense canvis [${config.calendarName}]`);
      }

      return {
        calendar: config.calendarName,
        matches: current.length,
        changes: hasChanges(diff),
        added: diff.added.length,
        removed: diff.removed.length,
        changed: diff.changed.length,
      };
    }));

    res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('cron error:', err);
    res.status(500).json({ error: String(err) });
  }
}
