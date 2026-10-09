# Personal dashboard

One calm screen with six sections. Phase 1 has the layout and the
**Classes & deadlines** card, which reads live data from Canvas. The other
five cards are placeholders for later phases.

## Setup

You need Node.js 20 or newer.

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

## How it fits together

```
app/
  page.tsx                 the one screen: a grid of six cards
  globals.css              the color palette (light and dark) as CSS variables
  api/deadlines/route.ts   GET /api/deadlines, the only thing that calls Canvas
components/
  Card.tsx                 shared card frame and empty-state message
  DeadlinesCard.tsx        fetches /api/deadlines and renders the list
lib/
  canvas.ts                server-only Canvas client (reads the token)
  relative-time.ts         "tomorrow", "in 3 days"
  types.ts                 the JSON shapes our API returns
```

Data flows one way: **Canvas → `lib/canvas.ts` → `/api/deadlines` → card**.
The UI never talks to Canvas directly, so a future iPhone app can call the
same `/api/deadlines` route.

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

Failure (`502` or `503`):

```json
{ "error": { "code": "not_configured", "message": "…" } }
```

`code` is one of `not_configured`, `unauthorized`, `upstream_error`.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` makes a production build
- `npm run lint` runs ESLint
