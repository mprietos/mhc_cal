import { kv } from '@vercel/kv';
import { fetchMatches } from '../lib/parse.js';
import { diffMatches, hasChanges } from '../lib/diff.js';
import { notifyTelegram, diffMessage } from '../lib/notify.js';

const KV_KEY = 'mollet_alevi_matches';
const KV_SUBSCRIBERS = 'telegram_subscribers';

export default async function handler(req, res) {
  // Protección básica: solo POST o header de Vercel Cron
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization ?? '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const current = await fetchMatches();
    const prevRaw = await kv.get(KV_KEY);
    const prev = prevRaw ?? [];

    const diff = diffMatches(prev, current);

    if (hasChanges(diff)) {
      console.log('Canvis detectats:', diff);
      const msg = diffMessage(diff.added, diff.removed, diff.changed);
      const subscribers = (await kv.get(KV_SUBSCRIBERS)) ?? [];
      await notifyTelegram(msg, subscribers);
      await kv.set(KV_KEY, current);
    } else {
      console.log('Sense canvis');
    }

    res.status(200).json({
      ok: true,
      matches: current.length,
      changes: hasChanges(diff),
      added: diff.added.length,
      removed: diff.removed.length,
      changed: diff.changed.length,
    });
  } catch (err) {
    console.error('cron error:', err);
    res.status(500).json({ error: String(err) });
  }
}
