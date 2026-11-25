// Registre central d'equips de Mollet HC i pistes.
//
// Cada equip de Mollet (A/B/C per separat) és una entrada de TEAMS amb el seu
// `idc` (competició a l'API de sidgad), el nom exacte amb què apareix a l'API
// (`team`) i un `slug` PERMANENT que s'usa a les URLs públiques (.ics, web).
// No canviïs mai un slug: trencaria les subscripcions existents.
//
// `toConfig(team)` deriva el CONFIG que esperen lib/sidgad.js i lib/ical.js, de
// manera que aquests mòduls no canvien la seva interfície.

const HOME_VENUE = 'Pavelló Riera Seca, Mollet del Vallès';
const TIMEZONE = 'Europe/Madrid';

// Mapa compartit NOM_RIVAL_SENSE_ACCENTS (en MAJÚSCULES) -> adreça de la pista.
// S'usa per als partits fora de casa. Els rivals sense entrada es queden sense
// adreça (la web mostra el nom igualment). Afegeix-ne a mesura que es coneguin.
export const VENUES = {
  // Mollet juga a casa seva quan és "local"; útil per als derbis interns fora.
  'MOLLET HC': HOME_VENUE,
  'MOLLET HC A': HOME_VENUE,
  'MOLLET HC B': HOME_VENUE,
  'MOLLET HC C': HOME_VENUE,

  // Rivals Aleví (idc 4789).
  'CH CALDES RECAM LASER A':    'Pavelló Torre Roja, Passatge Torre Roja s/n, Caldes de Montbui',
  'CE ARENYS DE MUNT A':        "Pavelló Municipal d'Esports, Torrent d'en Terra s/n, Arenys de Munt",
  'HOQUEI CASAL ESPLUGA A':     "Pavelló David Rovira i Minguella, Carrer del Serè s/n, L'Espluga de Francolí",
  'HOQUEI CASAL ESPLUGA B':     "Pavelló David Rovira i Minguella, Carrer del Serè s/n, L'Espluga de Francolí",
  'ROTOTANK BIGUES I RIELLS':   'Pavelló Municipal Les Cremades, Camí del Veïnat 5, Bigues i Riells',
  'CP MASQUEFA A':              'Pavelló Municipal de Masquefa, Masquefa',
  'CP SANT CELONI A':           "Pavelló Municipal d'Esports, Avinguda Catalunya, Sant Celoni",

  // Rivals Fem 15 (idc 4802).
  'VICIO PHC SANT CUGAT':        'Pavelló Municipal Can Gatxet, Carrer de Can Gatxet s/n, Sant Cugat del Vallès',
  'CH MATARO':                   'Pavelló Municipal La Llàntia, Carrer del Camí Ral s/n, Mataró',
  'CLUB HOQUEI ARENYS DE MAR':   "Pavelló Municipal d'Esports, Carrer del Palau 25, Arenys de Mar",
  'CLUB PATI RODA':              "Pavelló Municipal d'Esports, Carrer Major 1, Roda de Ter",
  'CLUB PATI VILA-SANA A':       'Pavelló Municipal de Vila-sana, Vila-sana',
  'CLUB PATI VOLTREGA A':        "Pavelló Municipal d'Esports, Avinguda de Vic s/n, Les Masies de Voltregà",
  'CLUB PATI VOLTREGA B':        "Pavelló Municipal d'Esports, Avinguda de Vic s/n, Les Masies de Voltregà",
  'FARNERS':                     "Pavelló Municipal d'Esports, Santa Coloma de Farners",
  'FENIE ENERGIA CERDANYOLA CCH A': 'Pavelló Municipal Cerdanyola CCH, Cerdanyola del Vallès',
  'FENIE ENERGIA CERDANYOLA CCH B': 'Pavelló Municipal Cerdanyola CCH, Cerdanyola del Vallès',
  'FUTBOL CLUB MARTINENC':       'Pavelló Martinenc, Carrer del Consell de Cent 318, Barcelona',
  'GENERALI HC PALAU A':         "Pavelló Municipal d'Esports, Avinguda del Vedrà s/n, Palau-solità i Plegamans",
  'GENERALI HC PALAU B':         "Pavelló Municipal d'Esports, Avinguda del Vedrà s/n, Palau-solità i Plegamans",
  'HOQUEI CLUB ALPICAT':         "Pavelló Municipal d'Esports, Carrer de la Diputació s/n, Alpicat",
  'HOQUEI CLUB CASTELLAR':       'Pavelló Municipal de Castellar del Vallès, Castellar del Vallès',
  'IGUALADA FEMENI HCP A':       "Pavelló Municipal d'Esports Marc Negre, Avinguda Catalunya s/n, Igualada",
  'IGUALADA HC':                 "Pavelló Municipal d'Esports Marc Negre, Avinguda Catalunya s/n, Igualada",
  'INNOAESTHETICS HC SANT JUST': 'Pavelló Municipal de Sant Just Desvern, Sant Just Desvern',
  'MARTINELIA MANLLEU A':        "Pavelló Municipal d'Esports, Carrer de la Planura s/n, Manlleu",
  'MARTINELIA MANLLEU B':        "Pavelló Municipal d'Esports, Carrer de la Planura s/n, Manlleu",
  'OXFORD HC SALT':              'Pavelló Municipal de Salt, Carrer de la Sèquia 2, Salt',
  'SANT CELONI':                 "Pavelló Municipal d'Esports, Avinguda Catalunya, Sant Celoni",
};

// Equips de Mollet. slug PERMANENT. `team` = nom EXACTE a l'API.
export const TEAMS = [
  // Sèniors catalanes (un sol equip -> "MOLLET HC").
  { idc: '4778', team: 'MOLLET HC', slug: 'cat-1a-fem',  category: 'Sènior femení',   calendarName: 'Mollet HC · 1a Catalana Femenina' },
  { idc: '4779', team: 'MOLLET HC', slug: 'cat-2a-masc', category: 'Sènior masculí',  calendarName: 'Mollet HC · 2a Catalana Masculina' },
  { idc: '4780', team: 'MOLLET HC', slug: 'cat-2a-fem',  category: 'Sènior femení',   calendarName: 'Mollet HC · 2a Catalana Femenina' },
  { idc: '4781', team: 'MOLLET HC', slug: 'cat-3a-masc', category: 'Sènior masculí',  calendarName: 'Mollet HC · 3a Catalana Masculina' },

  // Juvenil.
  { idc: '4784', team: 'MOLLET HC A', slug: 'juvenil-a', category: 'Juvenil', calendarName: 'Mollet HC A · Juvenil Or' },
  { idc: '4785', team: 'MOLLET HC B', slug: 'juvenil-b', category: 'Juvenil', calendarName: 'Mollet HC B · Juvenil Plata' },

  // Infantil.
  { idc: '4786', team: 'MOLLET HC A', slug: 'infantil-a', category: 'Infantil', calendarName: 'Mollet HC A · Infantil Or' },
  { idc: '4787', team: 'MOLLET HC B', slug: 'infantil-b', category: 'Infantil', calendarName: 'Mollet HC B · Infantil Plata' },

  // Aleví (el primer manté calendarName d'abans: gent ja subscrita).
  { idc: '4789', team: 'MOLLET HC A', slug: 'alevi-a', category: 'Aleví', calendarName: 'Mollet HC A · Aleví' },
  { idc: '4790', team: 'MOLLET HC B', slug: 'alevi-b', category: 'Aleví', calendarName: 'Mollet HC B · Aleví Plata' },
  { idc: '4791', team: 'MOLLET HC C', slug: 'alevi-c', category: 'Aleví', calendarName: 'Mollet HC C · Aleví Bronze' },

  // Femení base.
  { idc: '4792', team: 'MOLLET HC',   slug: 'fem19',   category: 'Fem 19', calendarName: 'Mollet HC · Fem 19' },
  { idc: '4793', team: 'MOLLET HC A', slug: 'fem17-a', category: 'Fem 17', calendarName: 'Mollet HC A · Fem 17 Or' },
  { idc: '4793', team: 'MOLLET HC B', slug: 'fem17-b', category: 'Fem 17', calendarName: 'Mollet HC B · Fem 17 Or' },
  { idc: '4802', team: 'MOLLET HC A', slug: 'fem15-a', category: 'Fem 15', calendarName: 'Mollet HC A · Fem 15 Or' },
  // fem15-b manté calendarName EXACTE d'abans (gent ja subscrita).
  { idc: '4802', team: 'MOLLET HC B', slug: 'fem15-b', category: 'Fem 15', calendarName: 'Mollet HC B · Fem 15' },
  { idc: '4806', team: 'MOLLET HC',   slug: 'fem11',   category: 'Fem 11', calendarName: 'Mollet HC · Fem 11' },

  // Benjamí.
  { idc: '4811', team: 'MOLLET HC A', slug: 'benjami-a', category: 'Benjamí', calendarName: 'Mollet HC A · Benjamí Plata' },
  { idc: '4811', team: 'MOLLET HC B', slug: 'benjami-b', category: 'Benjamí', calendarName: 'Mollet HC B · Benjamí Plata' },
  { idc: '4811', team: 'MOLLET HC C', slug: 'benjami-c', category: 'Benjamí', calendarName: 'Mollet HC C · Benjamí Plata' },

  // Prebenjamí.
  { idc: '4814', team: 'MOLLET HC A', slug: 'prebenjami-a', category: 'Prebenjamí', calendarName: 'Mollet HC A · Prebenjamí Plata' },
  { idc: '4815', team: 'MOLLET HC B', slug: 'prebenjami-b', category: 'Prebenjamí', calendarName: 'Mollet HC B · Prebenjamí Bronze' },
  { idc: '4816', team: 'MOLLET HC C', slug: 'prebenjami-c', category: 'Prebenjamí', calendarName: 'Mollet HC C · Prebenjamí Iniciació' },

  // Veterans.
  { idc: '5046', team: 'MOLLET HC', slug: 'veterans', category: 'Veterans', calendarName: 'Mollet HC · Màster 50' },
];

// Deriva el CONFIG que esperen scrapeMatches/mapGamesFor/buildIcal.
export function toConfig(team) {
  return {
    idc: team.idc,
    teamMatches: [team.team],
    categoryMatches: [],
    homeVenue: HOME_VENUE,
    awayVenues: VENUES,
    timezone: TIMEZONE,
    calendarName: team.calendarName,
  };
}
