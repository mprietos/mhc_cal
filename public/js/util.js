// Helpers compartits per la web pública i la vista coordinador.

// Les dates de matches.json venen com "2026-10-04T15:30:00" (hora local de
// Madrid, SENSE zona). new Date(iso) les interpretaria en l'hora del navegador,
// cosa que pot desfasar. Com que l'hoquei català sempre és Europe/Madrid i
// només mostrem text, parsegem els components directament i construïm una Date
// "ingènua" que tractem com a Madrid a efectes de format.
export function parseMatchDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

const DIES = ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.'];
const MESOS = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'];

export function formatDate(iso) {
  const d = parseMatchDate(iso);
  if (!d) return '?';
  return `${DIES[d.getDay()]} ${d.getDate()} ${MESOS[d.getMonth()]}`;
}

export function formatTime(iso) {
  const d = parseMatchDate(iso);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDateTime(iso) {
  const t = formatTime(iso);
  return t ? `${formatDate(iso)} ${t}` : formatDate(iso);
}

// Inici del dia d'avui (hora local) per filtrar partits futurs.
export function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

// Clau de cap de setmana: el dissabte de la setmana del partit (ds. = 6).
// Retorna "YYYY-MM-DD" del dissabte.
export function weekendKey(iso) {
  const d = parseMatchDate(iso);
  if (!d) return '?';
  const day = d.getDay(); // 0=dg ... 6=ds
  const sat = new Date(d);
  sat.setDate(d.getDate() - ((day + 1) % 7)); // retrocedeix fins al dissabte
  return `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}`;
}

// Un partit és a casa si es juga al Riera Seca (venue) o el local és de Mollet.
export function isHome(match) {
  const v = (match.venue || '').toUpperCase();
  if (v.includes('RIERA SECA')) return true;
  return /MOLLET HC/.test((match.home || '').toUpperCase());
}
