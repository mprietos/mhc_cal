import { kv } from '@vercel/kv';

const KV_SUBSCRIBERS = 'telegram_subscribers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const update = req.body;
  const message = update?.message;
  if (!message) return res.status(200).end();

  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  const firstName = message.chat.first_name || '';

  if (text === '/start') {
    const subscribers = (await kv.get(KV_SUBSCRIBERS)) ?? [];
    if (!subscribers.includes(chatId)) {
      subscribers.push(chatId);
      await kv.set(KV_SUBSCRIBERS, subscribers);
    }
    await sendMessage(chatId,
      `👋 Hola ${firstName}!\n\nEts subscrit/a al calendari del <b>Mollet HC A · Aleví</b>.\n\nRebraràs una notificació automàtica quan hi hagi canvis de data o nous partits.`
    );
  } else if (text === '/stop') {
    const subscribers = (await kv.get(KV_SUBSCRIBERS)) ?? [];
    const updated = subscribers.filter(id => id !== chatId);
    await kv.set(KV_SUBSCRIBERS, updated);
    await sendMessage(chatId, '👋 T\'has donat de baixa. Ja no rebràs notificacions.');
  } else if (text === '/partits') {
    // Reenviem l'ics com a text pla amb la llista de partits
    await sendMessage(chatId, '📅 Usa /start per subscriure\'t o /stop per donar-te de baixa.');
  }

  res.status(200).end();
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}
