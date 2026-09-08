// Ajusta aquí qué equipo/categoría seguir y el endpoint de datos.
export const CONFIG = {
  // Endpoint real (sidgad). El 4789 es el ID de liga; cámbialo si sigues otra.
  sourceUrl:
    process.env.SOURCE_URL ||
    'https://www.server2.sidgad.es/fecapa/fecapa_cal_idc_4789_1.php',

  // Referer requerido por el servidor para devolver el HTML con datos.
  sourceReferer: 'https://hoqueipatins.fecapa.cat/league/4789',
  sourceOrigin: 'https://hoqueipatins.fecapa.cat',

  sourceBody: { idc: '4789', site_lang: 'ca' },

  // Filtro por equipo (case-insensitive, ignora acentos).
  teamMatches: ['MOLLET HC A'],

  // Filtro extra por categoría (vacío = ignorar).
  categoryMatches: ['ALEVÍ'],

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
