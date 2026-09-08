export async function notifyTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

export function diffMessage(added, removed, changed) {
  const lines = [`📅 <b>Canvis al calendari Mollet HC A · Aleví</b>`];

  if (added.length) {
    lines.push('\n➕ <b>Nous partits:</b>');
    for (const m of added) lines.push(`  • ${formatMatch(m)}`);
  }
  if (removed.length) {
    lines.push('\n❌ <b>Partits eliminats:</b>');
    for (const m of removed) lines.push(`  • ${formatMatch(m)}`);
  }
  if (changed.length) {
    lines.push('\n✏️ <b>Partits modificats:</b>');
    for (const { before, after } of changed)
      lines.push(`  • ${formatMatch(before)} → ${formatMatch(after)}`);
  }

  return lines.join('\n');
}

function formatMatch(m) {
  if (!m.date) return `${m.home} vs ${m.away}`;
  const d = new Date(m.date);
  const day = d.toLocaleDateString('ca-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Europe/Madrid',
  });
  const time = d.toLocaleTimeString('ca-ES', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
  return `${day} ${time} — ${m.home} vs ${m.away}${m.venue ? ` (${m.venue})` : ''}`;
}
