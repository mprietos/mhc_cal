# mhc_cal — Calendari Mollet HC A · Aleví

Feed `.ics` subscrivible i notificació per Telegram quan hi ha canvis al calendari FECAPA del **Mollet HC A · Aleví** (lliga 4789).

## Arquitectura

```
GET /api/calendar.ics   → scraping en directe → retorna el .ics
GET /api/cron           → (cron diari) scraping + diff + notifica Telegram + guarda snapshot a Vercel KV
```

La font de dades és un POST a `server2.sidgad.es` que requereix `Referer: hoqueipatins.fecapa.cat`.

---

## Desplegament a Vercel (pas a pas)

### 1. Importar el repositori

1. Ves a [vercel.com/new](https://vercel.com/new) i fes clic a **"Import Git Repository"**.
2. Selecciona `mprietos/mhc_cal`.
3. **Framework Preset**: deixa `Other` (és un projecte Node pur amb API Routes).
4. Fes clic a **Deploy** — el primer deploy pot fallar si falten env vars; és normal.

### 2. Crear Vercel KV (base de dades)

El cron guarda un snapshot dels partits per detectar canvis.

1. Al dashboard del projecte → **Storage** → **Create Database** → **KV**.
2. Dona-li un nom (ex: `mhc-kv`) i fes clic a **Create**.
3. A la pantalla següent tria **Connect to Project** → selecciona `mhc_cal`.
4. Vercel injectarà automàticament `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` i `KV_REST_API_READ_ONLY_TOKEN`.

### 3. Variables d'entorn

Al dashboard → **Settings** → **Environment Variables**, afegeix:

| Variable | Valor | Obligatòria |
|---|---|---|
| `CRON_SECRET` | Qualsevol string llarg (ex: `openssl rand -hex 32`) | Sí |
| `TELEGRAM_BOT_TOKEN` | Token del bot (vegeu més baix) | Opcional |
| `TELEGRAM_CHAT_ID` | El teu chat id de Telegram | Opcional |

> `SOURCE_URL` no cal — la URL per defecte ja és la correcta.

Després de guardar les variables, fes **Redeploy** (Dashboard → Deployments → tres puntets → Redeploy).

### 4. Bot de Telegram (2 min)

1. Obre Telegram i busca **@BotFather**.
2. Escriu `/newbot`, segueix els passos i copia el **token** → `TELEGRAM_BOT_TOKEN`.
3. Escriu qualsevol missatge al teu bot nou.
4. Obre al navegador: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Copia `result[0].message.chat.id` → `TELEGRAM_CHAT_ID`.

### 5. Verificar

```bash
# Feed .ics (ha de descarregar un arxiu de calendari)
curl https://TU-APP.vercel.app/api/calendar.ics

# Cron manual
curl -H "Authorization: Bearer EL_TEU_CRON_SECRET" \
     https://TU-APP.vercel.app/api/cron
```

### 6. Subscriure's a Google Calendar

1. Google Calendar → **"Altres calendaris"** → `+` → **"Des d'una URL"**.
2. Enganxa: `https://TU-APP.vercel.app/api/calendar.ics`
3. **"Afegir calendari"**.

> Google repolla el feed cada 8–24 h automàticament.

---

## Prova en local

```bash
npm install
node test-local.js            # mostra partits i el .ics per stdout
node test-local.js > out.ics  # guarda l'arxiu per importar-lo manualment
npx vercel dev                # servidor local → http://localhost:3000/api/calendar.ics
```

---

## Configuració (`lib/config.js`)

| Camp | Descripció |
|---|---|
| `sourceUrl` | URL del POST de sidgad (per defecte correcta) |
| `sourceReferer` / `sourceOrigin` | Capçaleres requerides pel servidor |
| `sourceBody` | Paràmetres del POST (`idc` = ID de lliga) |
| `teamMatches` | Nom de l'equip a seguir (sense accents, majúscules) |
| `categoryMatches` | Filtre de categoria (`ALEVÍ`, `INFANTIL`, etc.) |
| `homeVenue` | Nom de la pista de casa |
| `awayVenues` | Mapa `NOM_EQUIP_RIVAL → adreça pista` per als partits fora |

---

## Cron

S'executa cada dia a les **07:00 UTC** (`vercel.json`).
Compara els partits actuals amb el snapshot a Vercel KV. Si hi ha canvis (nous partits, eliminats o horari modificat), envia un missatge de Telegram i actualitza el snapshot.
