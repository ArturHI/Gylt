# Personal dashboard

One calm screen with six sections. Three are live so far: **Classes &
deadlines** (Canvas), **Calendar** (Google Calendar) and **Weather**
(National Weather Service). The other three cards are placeholders for
later phases.

## Setup

You need Node.js 20.12 or newer.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file:

   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and fill in two values:

   | Variable          | What to put there                                                                 |
   | ----------------- | --------------------------------------------------------------------------------- |
   | `CANVAS_BASE_URL` | The address you see when you open Canvas, e.g. `https://canvas.ou.edu`. No trailing slash. |
   | `CANVAS_TOKEN`    | A personal access token. In Canvas: **Account → Settings → Approved Integrations → New Access Token**. |

   `.env.local` is gitignored. The token is only ever read on the server.

4. Run it:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Restart the dev server after editing `.env.local`.

## Connecting Google Calendar

Google needs a one-time setup so it knows which app is asking for your
calendar. Use the Google account whose calendar you want to see.

1. Go to https://console.cloud.google.com and create a new project (any name).
2. Open **APIs & Services → Library**, search for **Google Calendar API**,
   and click **Enable**.
3. Open **Google Auth Platform** (also called "OAuth consent screen") and
   click **Get started**. Give the app a name, pick your email for both
   email fields, and choose **External** as the audience.
4. Under **Audience**, click **Publish app**. This matters: while the app
   is in "Testing", Google expires your sign-in after 7 days. You do not
   need to submit it for verification.
5. Under **Clients**, click **Create client**, choose **Desktop app**, and
   create it. Copy the client ID and client secret into `.env.local`:

   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

6. Connect your account:

   ```bash
   npm run google:auth
   ```

   Your browser opens Google's sign-in page. Because the app is unverified,
   Google shows a warning; click **Advanced → Go to (your app name)**. That
   is expected for an app only you use. When you approve, the script saves
   `GOOGLE_REFRESH_TOKEN` into `.env.local` for you without printing it.

7. Restart `npm run dev`.

The app asks only for `calendar.events.readonly`: it can read events and
cannot change anything. It shows your primary calendar.

## Weather

Weather needs no setup. It comes from the National Weather Service, which
is free and has no API key, and it defaults to Norman, OK. To use another
place in the United States, add its coordinates to `.env.local`:

```
WEATHER_LATITUDE=35.2226
WEATHER_LONGITUDE=-97.4395
```

## How it fits together

```
app/
  page.tsx                 the one screen: a grid of six cards
  globals.css              the color palette (light and dark) as CSS variables
  api/deadlines/route.ts   GET /api/deadlines (Canvas)
  api/events/route.ts      GET /api/events (Google Calendar)
  api/weather/route.ts     GET /api/weather (National Weather Service)
components/
  Card.tsx                 shared card frame and empty-state message
  DeadlinesCard.tsx        renders /api/deadlines
  CalendarCard.tsx         renders /api/events, grouped by day
  WeatherCard.tsx          renders /api/weather
lib/
  canvas.ts                server-only Canvas client (reads the token)
  google-calendar.ts       server-only Google client (reads the tokens)
  weather.ts               server-only weather client (no key needed)
  service-error.ts         one error type and JSON error shape for all routes
  use-api.ts               the loading / error / ready hook every card uses
  relative-time.ts         "tomorrow", "in 3 days", local-date parsing
  types.ts                 the JSON shapes our API returns
scripts/
  google-auth.mjs          one-time Google sign-in (npm run google:auth)
```

Data flows one way: **service → `lib/<service>.ts` → `/api/...` → card**.
The UI never talks to an outside service directly, so a future iPhone app can
call the same API routes.

### `GET /api/deadlines`

Success (`200`):

```json
{
  "deadlines": [
    {
      "id": "assignment-123",
      "title": "Project 3",
      "courseId": 1,
      "courseName": "CS 2334",
      "dueAt": "2026-10-10T04:59:00.000Z",
      "url": "https://canvas.example.edu/courses/1/assignments/123"
    }
  ],
  "courses": [{ "id": 1, "name": "CS 2334", "code": "CS-2334" }]
}
```

Deadlines are unfinished items with a due date, soonest first. Work you have
already submitted or marked complete in Canvas is left out.

### `GET /api/events`

Events on your primary calendar from now through the next 7 days, soonest
first (`200`):

```json
{
  "events": [
    {
      "id": "abc123",
      "title": "CS 2334 lecture",
      "allDay": false,
      "start": "2026-10-12T15:00:00.000Z",
      "end": "2026-10-12T15:50:00.000Z",
      "location": "Devon Energy Hall",
      "url": "https://www.google.com/calendar/event?eid=..."
    }
  ]
}
```

All-day events have `"allDay": true` and plain dates instead of timestamps
(`"start": "2026-10-12"`), with an exclusive `end`.

### `GET /api/weather`

This hour's conditions and the next three whole days (`200`). Temperatures
are in degrees Celsius. `days` only includes days that still have both a
high and a low ahead, so in the evening it starts from tomorrow.

```json
{
  "location": "Norman, OK",
  "current": { "temperature": 30, "summary": "Clear" },
  "days": [
    {
      "date": "2026-10-10",
      "high": 32,
      "low": 17,
      "summary": "Sunny",
      "precipitationChance": 0
    }
  ]
}
```

### Errors

Every route fails the same way (`502` or `503`):

```json
{ "error": { "code": "not_configured", "message": "…" } }
```

`code` is one of `not_configured`, `unauthorized`, `upstream_error`.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` makes a production build
- `npm run lint` runs ESLint
- `npm run google:auth` connects Google Calendar (one-time)
