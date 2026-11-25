# mhc_cal — Calendaris FECAPA Mollet HC

Feeds `.ics` subscrivibles, **web pública** amb tots els equips del club i
**vista coordinador**, amb notificació per Telegram quan hi ha canvis als
calendaris FECAPA de **tots els equips del Mollet HC** (24 equips, de Prebenjamí
a Veterans i sèniors catalanes).

- **Web**: `/` llista tots els equips per categoria amb el seu `.ics` i pròxims partits.
- **Coordinador**: `/coordinador.html` (amb contrasenya) agrupa els partits per cap de
  setmana i avisa de xocs de pista a casa, solapaments horaris i càrrega de partits fora.
- Els equips es defineixen a `teams.js` (slug permanent per URL). El `.ics` de cada
  equip es serveix a `/api/ics/<slug>`; els antics `/api/calendar.ics` (Aleví) i
  `/api/calendarfem15.ics` (Fem 15) es mantenen per compatibilitat.

## Arquitectura

El novembre de 2026 la FECAPA va estrenar un portal nou
(`www.hoqueipatins.fecapa.cat`) que demana les dades a una **API JSON protegida**
(`api.sidgad.com/fecapa/v1/hp/...`). Aquesta API valida el domini i un token de
sessió efímer signat: un `fetch` normal retorna `{"status":"INVALID DOMAIN"}`.
L'única manera robusta és fer la crida **des de dins del portal**, amb la seva
funció global `window.sidgadFetch(...)`, que ja gestiona el token.

Per això el scraping necessita un **navegador headless (Puppeteer)**, que no cap
a una funció serverless de Vercel. El flux és:

```
GitHub Actions (cron diari)
  └─ scripts/scrape.js
       ├─ obre el portal amb Puppeteer i crida window.sidgadFetch('calendar', {id})
       ├─ genera calendario_4789.ics i calendario_4802.ics  → commiteja al repo
       ├─ diff contra partidos/*.json (snapshot anterior)
       └─ si hi ha canvis → avisa per Telegram

Vercel
  └─ GET /api/calendar.ics      → serveix calendario_4789.ics del repo
     GET /api/calendarfem15.ics → serveix calendario_4802.ics del repo
```

---

## GitHub Actions (el cron)

El workflow és `.github/workflows/scrape.yml`. Corre cada dia a les **07:00 CET**
i també es pot llançar a mà des de la pestanya **Actions → Run workflow**.

### Secrets necessaris (opcional, només per a Telegram)

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot (vegeu més avall) |
| `TELEGRAM_CHAT_ID` | Chat id(s) destí. Diversos separats per coma |

Sense aquests secrets el scraping i els `.ics` funcionen igual; només no s'envien
avisos de Telegram.

### Bot de Telegram (2 min)

1. A Telegram busca **@BotFather**, escriu `/newbot` i copia el **token**.
2. Escriu qualsevol missatge al teu bot nou.
3. Obre `https://api.telegram.org/bot<TOKEN>/getUpdates` i copia
   `result[0].message.chat.id`.

---

## Subscriure's al calendari (Google Calendar)

1. Google Calendar → **"Altres calendaris"** → `+` → **"Des d'una URL"**.
2. Enganxa una d'aquestes (segons el desplegament a Vercel):
   - Aleví: `https://TU-APP.vercel.app/api/calendar.ics`
   - Fem 15: `https://TU-APP.vercel.app/api/calendarfem15.ics`

> Google repolla el feed cada 8–24 h automàticament.

---

## Prova en local

```bash
npm install                     # instal·la Puppeteer (baixa Chromium)
node test-local.js              # Aleví: mostra partits i el .ics per stdout
node test-local.js fem15        # Fem 15
npm run scrape                  # genera els .ics i els snapshots com a Actions
```

---

## Configuració (`config.js` / `config.fem15.js`)

| Camp | Descripció |
|---|---|
| `idc` | ID de la competició a l'API de sidgad (4789 = Aleví, 4802 = Fem 15) |
| `teamMatches` | Nom de l'equip a seguir (sense accents, majúscules) |
| `categoryMatches` | Filtre de categoria (buit = no filtra; l'idc ja és la categoria) |
| `homeVenue` | Nom de la pista de casa |
| `awayVenues` | Mapa `NOM_EQUIP_RIVAL → adreça pista` per als partits fora. S'usa com a fallback si l'API no dona la pista |
| `timezone`, `calendarName` | Metadades del `.ics` |

---

## Notes

- El `.ics` fa servir un `UID` estable per partit (`EQUIP_LOCAL-EQUIP_VISITANT@fecapa-cal`)
  perquè els subscriptors no vegin esdeveniments duplicats quan es regenera.
- La gestió de subscriptors per Telegram (`api/webhook.js`, Vercel KV) és
  independent; el cron de GitHub Actions avisa a `TELEGRAM_CHAT_ID`.
