export async function notifyTelegram(message, chatIds) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  // chatIds: array de subscriptors. Si no n'hi ha, usa el TELEGRAM_CHAT_ID de fallback.
  const targets = chatIds?.length
    ? chatIds
    : process.env.TELEGRAM_CHAT_ID
      ? [process.env.TELEGRAM_CHAT_ID]
      : [];

  await Promise.all(targets.map(chatId =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })
  ));
}

export function diffMessage(added, removed, changed, calendarName = 'Mollet HC A · Aleví') {
  const lines = [`📅 <b>Canvis al calendari ${calendarName}</b>`];

  if (added.length) {
    lines.push('\n➕ <b>Nous partits:</b>');
    for (const m of added) lines.push(`  • ${formatMatch(m)}`);
  }
  if (removed.length) {
    lines.push('\n❌ <b>Partits eliminats:</b>');
    for (const m of removed) lines.push(`  • ${formatMatch(m)}`);
  }
  if (changed.length) {
    lines.push('\n✏️ <b>Canvi de data/hora:</b>');
    for (const { before, after } of changed) {
      lines.push(`  • <b>${after.home} vs ${after.away}</b>`);
      lines.push(`    Abans: ${formatDateTime(before.date)}`);
      lines.push(`    Ara:   ${formatDateTime(after.date)}`);
    }
  }

  return lines.join('\n');
}

function formatMatch(m) {
  return `${formatDateTime(m.date)} — ${m.home} vs ${m.away}${m.venue ? ` (${m.venue})` : ''}`;
}

function formatDateTime(date) {
  if (!date) return '?';
  const d = new Date(date);
  const day = d.toLocaleDateString('ca-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Europe/Madrid',
  });
  const time = d.toLocaleTimeString('ca-ES', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
  return `${day} ${time}`;
}
