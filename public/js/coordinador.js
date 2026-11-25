import { parseMatchDate, formatDate, formatTime, formatDateTime, startOfToday, weekendKey, isHome } from './util.js';

// Contrasenya simple (protecció lleugera, NO seguretat real: el matches.json és
// públic i la comprovació és al client). Canvia-la aquí si cal.
const PASSWORD = 'mollet';
// El club programa els partits de casa cada ~75 min (slot real del Riera Seca).
// Per al XOC DE PISTA fem servir una finestra curta (70') perquè els partits
// correctament escalonats a 75' NO es marquin com a xoc, però els que comencen
// a la mateixa hora o gairebé sí. Per a la concurrència general (equips alhora
// en llocs diferents) fem servir una finestra una mica més llarga.
const CLASH_MINUTES = 70;      // finestra per a xoc de pista a casa
const CONC_MINUTES = 75;       // finestra per a concurrència/càrrega fora
const AWAY_LOAD_THRESHOLD = 3; // 3+ equips fora solapats = avís logístic

// ── Gate ──────────────────────────────────────────────────────────────
const gate = document.getElementById('gate');
const content = document.getElementById('content');

function unlock() {
  gate.style.display = 'none';
  content.style.display = 'block';
  render();
}
if (sessionStorage.getItem('coord_ok') === '1') unlock();

document.getElementById('enter').addEventListener('click', tryEnter);
document.getElementById('pwd').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryEnter(); });
function tryEnter() {
  const val = document.getElementById('pwd').value;
  if (val === PASSWORD) {
    sessionStorage.setItem('coord_ok', '1');
    unlock();
  } else {
    document.getElementById('pwderr').style.display = 'block';
  }
}

// ── Lògica de solapaments ────────────────────────────────────────────
// Interval [start, start+durada] en ms. La durada depèn del tipus d'anàlisi.
function interval(match, minutes) {
  const start = parseMatchDate(match.date).getTime();
  return { start, end: start + minutes * 60 * 1000 };
}
function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

// Clusters de solapament (components connexes del graf "solapa amb"), on cada
// item porta el seu interval ja calculat a `iv`.
function clusters(items) {
  const out = [];
  const used = new Set();
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;
    const group = [i];
    used.add(i);
    for (let j = 0; j < group.length; j++) {
      for (let k = 0; k < items.length; k++) {
        if (used.has(k)) continue;
        if (overlaps(items[group[j]].iv, items[k].iv)) { group.push(k); used.add(k); }
      }
    }
    if (group.length > 1) out.push(group.map((idx) => items[idx]));
  }
  return out;
}

// Prepara items amb interval d'una durada concreta.
const withIv = (matches, minutes) => matches.map((m) => ({ m, iv: interval(m, minutes) }));

function analyzeWeekend(matches) {
  const tagById = new Map(); // id -> set de tags
  const addTag = (id, tag) => {
    if (!tagById.has(id)) tagById.set(id, new Set());
    tagById.get(id).add(tag);
  };

  const home = matches.filter(isHome);
  const away = matches.filter((m) => !isHome(m));

  // (a) concurrència: 2+ equips qualssevol solapats (finestra concurrència)
  for (const g of clusters(withIv(matches, CONC_MINUTES))) for (const it of g) addTag(it.m.id, 'conc');

  // (b) xoc de pista a casa: 2+ partits a casa solapats (finestra curta: els
  //     escalonats a 75' no compten, els simultanis sí)
  for (const g of clusters(withIv(home, CLASH_MINUTES))) for (const it of g) addTag(it.m.id, 'clash');

  // (c) càrrega fora: 3+ equips fora solapats (finestra concurrència)
  for (const g of clusters(withIv(away, CONC_MINUTES))) if (g.length >= AWAY_LOAD_THRESHOLD) for (const it of g) addTag(it.m.id, 'load');

  const counts = {
    clash: [...tagById.values()].filter((s) => s.has('clash')).length,
    conc: [...tagById.values()].filter((s) => s.has('conc')).length,
    load: [...tagById.values()].filter((s) => s.has('load')).length,
  };
  return { tagById, counts };
}

// ── Render ────────────────────────────────────────────────────────────
let DATA = null;          // dades carregades
let nameBySlug = null;    // slug -> calendarName

async function render() {
  try {
    const res = await fetch('/data/matches.json', { cache: 'no-cache' });
    DATA = await res.json();
  } catch {
    content.innerHTML = '<p class="error">No s\'han pogut carregar les dades.</p>';
    return;
  }

  const updated = document.getElementById('updated');
  if (DATA.generatedAt) updated.textContent = `Última actualització: ${formatDateTime(DATA.generatedAt.replace('Z', '').slice(0, 16))}`;

  nameBySlug = new Map(DATA.teams.map((t) => [t.slug, t.calendarName]));
  buildFilterBar();
  draw();
}

// Barra de filtres: equips (multi-selecció), rang de dates, només avisos.
function buildFilterBar() {
  const teamsSorted = [...DATA.teams].sort((a, b) => a.calendarName.localeCompare(b.calendarName));
  const bar = document.createElement('div');
  bar.className = 'filters';
  bar.innerHTML = `
    <div class="teamfilter">
      <span class="lbl">Equips</span>
      <details class="teamdd">
        <summary id="f-team-summary">Tots els equips</summary>
        <div class="teamdd-body">
          <div class="teamdd-actions">
            <button type="button" id="f-team-all">Tots</button>
            <button type="button" id="f-team-none">Cap</button>
          </div>
          ${teamsSorted.map((t) => `
            <label class="chk"><input type="checkbox" class="f-team" value="${t.slug}" /> ${t.calendarName}</label>
          `).join('')}
        </div>
      </details>
    </div>
    <label>Des de <input type="date" id="f-from" /></label>
    <label>Fins a <input type="date" id="f-to" /></label>
    <label class="chk"><input type="checkbox" id="f-alerts" /> Només amb avisos</label>
    <button id="f-reset" class="btn ghost">Neteja</button>
  `;
  content.before(bar);

  const refresh = () => { updateTeamSummary(); draw(); };
  bar.addEventListener('input', refresh);
  bar.querySelector('#f-team-all').addEventListener('click', () => {
    bar.querySelectorAll('.f-team').forEach((c) => (c.checked = true));
    refresh();
  });
  bar.querySelector('#f-team-none').addEventListener('click', () => {
    bar.querySelectorAll('.f-team').forEach((c) => (c.checked = false));
    refresh();
  });
  bar.querySelector('#f-reset').addEventListener('click', (e) => {
    e.preventDefault();
    bar.querySelectorAll('.f-team').forEach((c) => (c.checked = false));
    bar.querySelector('#f-from').value = '';
    bar.querySelector('#f-to').value = '';
    bar.querySelector('#f-alerts').checked = false;
    refresh();
  });
}

function updateTeamSummary() {
  const sel = selectedTeams();
  const sum = document.getElementById('f-team-summary');
  if (!sum) return;
  if (!sel.length) sum.textContent = 'Tots els equips';
  else if (sel.length === 1) sum.textContent = nameBySlug.get(sel[0]) || sel[0];
  else sum.textContent = `${sel.length} equips seleccionats`;
}

function selectedTeams() {
  return [...document.querySelectorAll('.f-team:checked')].map((c) => c.value);
}

function currentFilters() {
  return {
    teams: selectedTeams(), // buit = tots
    from: document.getElementById('f-from')?.value || '',
    to: document.getElementById('f-to')?.value || '',
    onlyAlerts: document.getElementById('f-alerts')?.checked || false,
  };
}

function draw() {
  const f = currentFilters();
  const teamLabel = (m) => m.teams.map((s) => nameBySlug.get(s) || s).join(' / ');

  // Per defecte, només partits futurs. Si l'usuari posa "Des de", respectem-la.
  const minDate = f.from ? f.from : null;
  const today = startOfToday();

  const visible = DATA.matches
    .filter((m) => {
      const d = parseMatchDate(m.date);
      if (!d) return false;
      const dayStr = m.date.slice(0, 10);
      if (minDate) { if (dayStr < minDate) return false; }
      else if (d < today) return false;        // sense "des de" -> només futurs
      if (f.to && dayStr > f.to) return false;
      // Multi-selecció d'equips: buit = tots; si no, el partit ha d'incloure
      // algun dels equips seleccionats.
      if (f.teams.length && !m.teams.some((s) => f.teams.includes(s))) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const byWeekend = new Map();
  for (const m of visible) {
    const k = weekendKey(m.date);
    if (!byWeekend.has(k)) byWeekend.set(k, []);
    byWeekend.get(k).push(m);
  }

  content.innerHTML = '';
  let shownWeekends = 0;
  for (const [wk, matches] of byWeekend) {
    // Els avisos es calculen sobre TOTS els partits del cap de setmana (del
    // dataset sencer), no només els filtrats: un xoc de pista implica altres
    // equips. Així, encara que filtris un equip, veus si el seu partit xoca.
    const allOfWeekend = DATA.matches.filter((m) => weekendKey(m.date) === wk);
    const { tagById } = analyzeWeekend(allOfWeekend);

    // Files a mostrar: les visibles (ja filtrades per equip/dates) i, si cal,
    // només les que tenen algun avís.
    let rows = matches;
    if (f.onlyAlerts) rows = rows.filter((m) => (tagById.get(m.id) || new Set()).size > 0);
    if (!rows.length) continue;
    shownWeekends++;

    // Comptadors de la capçalera: sobre les files mostrades.
    const count = (tag) => rows.filter((m) => (tagById.get(m.id) || new Set()).has(tag)).length;
    const counts = { clash: count('clash'), conc: count('conc'), load: count('load') };

    const sec = document.createElement('section');
    sec.className = 'weekend';
    const alerts = [];
    if (counts.clash) alerts.push(`<span class="alert clash">⛔ ${counts.clash} xoc de pista (casa)</span>`);
    if (counts.conc) alerts.push(`<span class="alert conc">⚠ ${counts.conc} partits solapats</span>`);
    if (counts.load) alerts.push(`<span class="alert load">🚗 ${counts.load} equips fora alhora</span>`);

    sec.innerHTML = `
      <h2>Cap de setmana del ${formatDate(wk + 'T00:00')}</h2>
      <div class="alerts">${alerts.join('') || '<span class="alert" style="color:var(--muted)">Sense solapaments</span>'}</div>
      <table class="sched">
        <thead><tr><th>Dia/Hora</th><th>Equip</th><th>Partit</th><th>Lloc</th><th>Avís</th></tr></thead>
        <tbody>
          ${rows.map((m) => {
            const tags = tagById.get(m.id) || new Set();
            const rowCls = tags.has('clash') ? 'row-clash' : tags.has('conc') ? 'row-conc' : '';
            const badges = [
              tags.has('clash') ? '<span class="badge clash">pista</span>' : '',
              tags.has('conc') ? '<span class="badge conc">solap.</span>' : '',
              tags.has('load') ? '<span class="tag away">fora x3</span>' : '',
            ].join('');
            return `<tr class="${rowCls}">
              <td>${formatDate(m.date)}<br><strong>${formatTime(m.date)}</strong></td>
              <td>${teamLabel(m)}</td>
              <td>${m.home} vs ${m.away}</td>
              <td><span class="tag ${isHome(m) ? 'home' : 'away'}">${isHome(m) ? 'Casa' : 'Fora'}</span>${m.venue ? `<br><small>${m.venue}</small>` : ''}</td>
              <td>${badges}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    content.appendChild(sec);
  }

  if (!shownWeekends) content.innerHTML = '<p class="loading">Cap partit amb aquests filtres.</p>';
}
