// Ajusta aquí qué equipo/categoría seguir y el endpoint de datos.
export const CONFIG = {
  // ID de la competició (idc) a l'API nova de sidgad. Es demana amb
  // window.sidgadFetch('calendar', { id: idc }) des del portal (veure lib/sidgad.js).
  // El 4789 és la lliga Aleví sencera; canvia'l si segueixes una altra.
  idc: '4789',

  // Filtro por equipo (case-insensitive, ignora acentos).
  teamMatches: ['MOLLET HC A'],

  // Filtro extra por categoría (vacío = ignorar). L'idc 4789 ja és Aleví, així
  // que no cal filtrar: la categoria ja no ve per partit a l'API nova.
  categoryMatches: [],

  // Pista local del equipo seguido.
  homeVenue: 'Pavelló Riera Seca, Mollet del Vallès',

  // Pistas de equipos visitantes (clave: nombre exacto en mayúsculas sin acentos).
  // Usado cuando MOLLET HC A juega fuera.
  awayVenues: {
    'CH CALDES RECAM LASER A':    'Pavelló Torre Roja, Passatge Torre Roja s/n, Caldes de Montbui',
    'CE ARENYS DE MUNT A':        'Pavelló Municipal d\'Esports, Torrent d\'en Terra s/n, Arenys de Munt',
    'HOQUEI CASAL ESPLUGA A':     'Pavelló David Rovira i Minguella, Carrer del Serè s/n, L\'Espluga de Francolí',
    'HOQUEI CASAL ESPLUGA B':     'Pavelló David Rovira i Minguella, Carrer del Serè s/n, L\'Espluga de Francolí',
    'ROTOTANK BIGUES I RIELLS':   'Pavelló Municipal Les Cremades, Camí del Veïnat 5, Bigues i Riells',
    'CP MASQUEFA A':              'Pavelló Municipal de Masquefa, Masquefa',
    'CP SANT CELONI A':           'Pavelló Municipal d\'Esports, Avinguda Catalunya, Sant Celoni',
  },

  timezone: 'Europe/Madrid',
  calendarName: 'Mollet HC A · Aleví',
};
