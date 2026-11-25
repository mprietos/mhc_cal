import { formatDateTime, parseMatchDate, startOfToday, isHome } from './util.js';

const CATEGORY_ORDER = [
  'Sènior masculí', 'Sènior femení', 'Fem 19', 'Fem 17', 'Fem 15', 'Fem 11',
  'Juvenil', 'Infantil', 'Aleví', 'Benjamí', 'Prebenjamí', 'Veterans',
];

function catIndex(c) {
  const i = CATEGORY_ORDER.indexOf(c);
  return i === -1 ? 999 : i;
}

async function main() {
  const app = document.getElementById('app');
  let data;
  try {
    const res = await fetch('/data/matches.json', { cache: 'no-cache' });
    data = await res.json();
  } catch {
    app.innerHTML = '<p class="error">No s\'han pogut carregar les dades.</p>';
    return;
  }

  const updated = document.getElementById('updated');
  if (data.generatedAt) {
    updated.textContent = `Última actualització: ${formatDateTime(data.generatedAt.replace('Z', '').slice(0, 16))}`;
  }

  const today = startOfToday();
  // Pròxims partits per slug.
  const nextBySlug = new Map();
  for (const m of data.matches) {
    const d = parseMatchDate(m.date);
    if (!d || d < today) continue;
    for (const slug of m.teams) {
      if (!nextBySlug.has(slug)) nextBySlug.set(slug, []);
      nextBySlug.get(slug).push(m);
    }
  }
  for (const list of nextBySlug.values()) list.sort((a, b) => a.date.localeCompare(b.date));

  // Agrupa equips per categoria.
  const byCat = new Map();
  for (const t of data.teams) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category).push(t);
  }
  const cats = [...byCat.keys()].sort((a, b) => catIndex(a) - catIndex(b));

  const origin = location.origin;
  app.innerHTML = '';
  for (const cat of cats) {
    const section = document.createElement('section');
    section.className = 'category';
    section.innerHTML = `<h2>${cat}</h2>`;
    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const t of byCat.get(cat)) {
      const next = (nextBySlug.get(t.slug) || []).slice(0, 4);
      const webcal = `webcal://${location.host}${t.icsUrl}`;
      const https = `${origin}${t.icsUrl}`;

      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <h3>${t.calendarName}</h3>
        <div class="actions">
          <a class="btn primary" href="${webcal}">+ Subscriu-te</a>
          <a class="btn ghost" href="${https}">Baixa .ics</a>
        </div>
        <ul class="matches">
          ${next.length
            ? next.map((m) => `
              <li>
                <span class="when">${formatDateTime(m.date)}</span>
                <span class="who">${m.home} vs ${m.away}</span>
                <span class="where ${isHome(m) ? 'home' : 'away'}">${isHome(m) ? 'Casa' : 'Fora'}</span>
              </li>`).join('')
            : '<li class="empty">Sense partits propers</li>'}
        </ul>`;
      grid.appendChild(card);
    }
    section.appendChild(grid);
    app.appendChild(section);
  }
}

main();
