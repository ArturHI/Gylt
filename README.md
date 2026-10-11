# Personal dashboard

One calm screen with six sections, all backed by live data:

| Section             | Source                                        |
| ------------------- | --------------------------------------------- |
| Classes & deadlines | Canvas                                        |
| Calendar            | Google Calendar                               |
| Weather             | National Weather Service                      |
| Projects & to-dos   | Your own Supabase database                    |
| Email               | Gmail, plus OU mail forwarded into it         |
| Spanish             | Duolingo streak                               |

## Using the dashboard

- **Move a section:** drag it by its title.
- **Resize a section:** drag the small purple corner at its bottom right.
- **Reset layout** (top right) puts everything back where it started.
- **Email:** the two buttons in the card's corner switch between personal
  mail (house) and school mail (briefcase).
- **To-dos:** the round **+** button adds one, with an optional note. Tick
  its checkbox to mark it done. Each shows as a single line; click it to
  read the whole thing, add or change its note, or delete it.

Your arrangement is saved in the browser you made it in, separately for
wide and medium windows. On a phone the sections are stacked and fixed.

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

## Connecting Gmail

Gmail uses the same Google project and sign-in as the calendar, so set
that up first. Then:

1. In https://console.cloud.google.com, open **APIs & Services → Library**,
   search for **Gmail API**, and click **Enable**.
2. Run the sign-in again so Google asks for the extra permission:

   ```bash
   npm run google:auth
   ```

   The consent screen now lists two items. Make sure both boxes are ticked.

The Gmail permission is `gmail.metadata`: the app can see senders,
subjects and labels, and cannot read the body of any message. The Email
card shows unread inbox mail, leaving out Gmail's Promotions and Social
categories.

### School mail (OU Outlook)

OU does not let students connect their own apps to school mail, so the
dashboard reads it through Gmail instead:

1. In Outlook on the web, open **Settings → Mail → Forwarding** and forward
   to your Gmail address with `+ou` added before the `@`, for example
   `yourname+ou@gmail.com`. Keep "Keep a copy of forwarded messages" ticked.
   Gmail delivers plus addresses to your normal mailbox.
2. In Gmail, open **Settings → See all settings → Filters and Blocked
   Addresses → Create a new filter**. In **Has the words**, enter
   `deliveredto:yourname+ou@gmail.com`, then click **Create filter**.
3. Tick **Skip the Inbox** and **Apply the label**, create a new label
   named exactly `OU`, and save.

School mail now stays out of your Gmail inbox, under the OU label. The
dashboard shows OU mail from the last three days (reading a message in
Outlook cannot mark its forwarded copy as read, so "unread" would be
misleading).

## Weather

Weather needs no setup. It comes from the National Weather Service, which
is free and has no API key, and it defaults to Norman, OK. To use another
place in the United States, add its coordinates to `.env.local`:

```
WEATHER_LATITUDE=35.2226
WEATHER_LONGITUDE=-97.4395
```

## Connecting the database (Supabase)

Projects and to-dos are your own data, stored in a free Supabase project.

1. Go to https://supabase.com, sign in, and create a new project (any
   name; pick a region near you). Wait for it to finish setting up.
2. Open **SQL Editor**, paste in the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This
   creates the `projects` and `todos` tables.

   If you created your tables before to-do notes existed, also run
   [`supabase/add-todo-notes.sql`](supabase/add-todo-notes.sql) once.
3. Open **Project Settings** and copy two values into `.env.local`:

   | Variable              | Where to find it                                                        |
   | --------------------- | ----------------------------------------------------------------------- |
   | `SUPABASE_URL`        | **Data API → Project URL**, like `https://abcdefgh.supabase.co`.         |
   | `SUPABASE_SECRET_KEY` | **API Keys → Secret keys** (starts with `sb_secret_`). Not the publishable key. |

The secret key can read and write everything in the database, so it is
only ever used on the server. The tables have Row Level Security turned on
with no policies, which means the publishable key can do nothing at all.

## Duolingo streak

Add your Duolingo username to `.env.local`. It is the last part of your
profile link, `duolingo.com/profile/<username>`:

```
DUOLINGO_USERNAME=yourname
```

No password or token is involved. Duolingo has no official API, so this
reads the same public profile endpoint its website uses. It is unofficial
and may stop working without warning; if it does, only this card is
affected.

## Deploying to Vercel

The dashboard shows private data and can change your to-dos, so a deployed
copy is locked behind one password.

1. Push the project to GitHub.
2. At https://vercel.com, sign in with GitHub, choose **Add New → Project**,
   and import the repository. Don't deploy yet.
3. Open **Environment Variables** and add every value from your
   `.env.local` (you can paste the whole file's contents into the first
   field and Vercel splits it up), plus one new one:

   | Variable             | Value                                             |
   | -------------------- | ------------------------------------------------- |
   | `DASHBOARD_PASSWORD` | A long password you don't use anywhere else.      |

4. Click **Deploy**. Open the address Vercel gives you and sign in.

How the lock works:

- `proxy.ts` runs before every page and API route and turns away anyone
  without a valid session cookie.
- `/login` checks the password and sets that cookie. It lasts 30 days, is
  signed so it can't be forged, and can't be read by page scripts.
- Changing `DASHBOARD_PASSWORD` signs out every device.
- Without the variable, a deployed site refuses all requests. On your own
  machine `npm run dev` simply has no login.

After changing any environment variable on Vercel (a renewed Canvas token,
a new Google refresh token), redeploy for it to take effect.

## How it fits together

```
proxy.ts                   the password gate in front of everything
app/
  page.tsx                 the one screen
  login/page.tsx           the sign-in page
  privacy/page.tsx         a public privacy note (Google requires one)
  api/login/route.ts       POST /api/login, checks the password
  globals.css              the color palette as CSS variables
  api/deadlines/route.ts   GET /api/deadlines (Canvas)
  api/events/route.ts      GET /api/events (Google Calendar)
  api/weather/route.ts     GET /api/weather (National Weather Service)
  api/emails/route.ts      GET /api/emails (Gmail)
  api/duolingo/route.ts    GET /api/duolingo (Duolingo streak)
  api/todos/               list, add, edit and delete to-dos
  api/projects/            list, add, rename and delete projects
components/
  DashboardGrid.tsx        the movable, resizable grid; saves your layout
  Card.tsx                 shared card frame and empty-state message
  icons.tsx                the house, briefcase and plus icons
  DeadlinesCard.tsx        renders /api/deadlines
  CalendarCard.tsx         renders /api/events, grouped by day
  WeatherCard.tsx          renders /api/weather
  TodosCard.tsx            to-do bullets, the add button and its dialogs
  Dialog.tsx               a centered pop-up, built on the <dialog> element
  EmailCard.tsx            /api/emails with a personal / school toggle
  SpanishCard.tsx          plain streak text from /api/duolingo (design comes later)
lib/
  canvas.ts                server-only Canvas client (reads the token)
  google-auth.ts           server-only Google sign-in (reads the tokens)
  google-calendar.ts       Google Calendar client
  gmail.ts                 Gmail client (headers only, never message bodies)
  weather.ts               server-only weather client (no key needed)
  duolingo.ts              Duolingo streak client (unofficial endpoint)
  supabase.ts              server-only database client (reads the secret key)
  todos.ts                 rules and queries for projects and to-dos
  request.ts               helpers for reading request bodies and ids
  session.ts               password check and the signed session cookie
  service-error.ts         one error type and JSON error shape for all routes
  use-api.ts               the loading / error / ready hook every card uses, with reload
  relative-time.ts         "tomorrow", "in 3 days", local-date parsing
  types.ts                 the JSON shapes our API returns
scripts/
  google-auth.mjs          one-time Google sign-in (npm run google:auth)
supabase/
  schema.sql               the database tables, run once in Supabase
  add-todo-notes.sql       adds the note column to an older database
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

### `GET /api/emails`

Newest first (`200`): up to 10 unread Gmail inbox messages, without
promotions or social mail, plus up to 10 school messages from the last
three days. `account` is `"gmail"` or `"ou"`.

```json
{
  "emails": [
    {
      "id": "19a2b3c4d5e6f708",
      "account": "gmail",
      "unread": true,
      "from": "Ada Lovelace",
      "fromAddress": "ada@example.com",
      "subject": "Office hours moved",
      "receivedAt": "2026-10-11T02:15:00.000Z",
      "url": "https://mail.google.com/mail/#all/19a2b3c4d5e6f708"
    }
  ]
}
```

### `GET /api/duolingo`

The current streak (`200`):

```json
{
  "username": "yourname",
  "streak": 12,
  "lastStreakDate": "2026-10-10"
}
```

`lastStreakDate` is the last day that counts toward the streak, or `null`
when there is no streak. A lesson has been done today when it equals
today's date on the viewer's device.

### Projects and to-dos

Unlike the routes above, these also write. Send bodies as JSON with the
header `Content-Type: application/json`.

| Method and path            | Body                                    | Returns                    |
| -------------------------- | --------------------------------------- | -------------------------- |
| `GET /api/todos`           |                                         | `200` `{ "todos": [...] }` |
| `GET /api/todos?done=false` |                                        | only unfinished (or `true`) |
| `POST /api/todos`          | `{ "title", "note"?, "projectId"? }`    | `201` `{ "todo": {...} }`  |
| `PATCH /api/todos/:id`     | any of `{ "title", "note", "done", "projectId" }` | `200` `{ "todo": {...} }` |
| `DELETE /api/todos/:id`    |                                         | `204`, no body             |
| `GET /api/projects`        |                                         | `200` `{ "projects": [...] }` |
| `POST /api/projects`       | `{ "name" }`                            | `201` `{ "project": {...} }` |
| `PATCH /api/projects/:id`  | `{ "name" }`                            | `200` `{ "project": {...} }` |
| `DELETE /api/projects/:id` |                                         | `204`, no body             |

A to-do and a project look like this:

```json
{
  "id": "673b999e-3b50-4b9c-bf3b-648a9048626c",
  "title": "Email advisor",
  "note": null,
  "done": false,
  "projectId": null,
  "createdAt": "2026-10-11T03:09:58.489Z",
  "completedAt": null
}
```

```json
{
  "id": "4ab6a6cc-ce96-4374-9bbb-16b85ca8c4c9",
  "name": "Gylt",
  "createdAt": "2026-10-11T03:09:57.423Z"
}
```

- To-dos come back unfinished first, then oldest first.
- `projectId` is optional. Use `null` for a to-do that belongs to no project.
- Setting `done` to `true` fills in `completedAt`; setting it back clears it.
- Deleting a project keeps its to-dos and sets their `projectId` to `null`.
- Titles and names are trimmed and limited to 200 characters.
- `note` is optional text up to 2,000 characters. Send `null` or an empty
  string to remove it.

Try it from a terminal while the dev server is running:

```bash
curl -X POST localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Try the API"}'
```

### Errors

Every route fails the same way:

```json
{ "error": { "code": "not_configured", "message": "…" } }
```

| `code`            | Status | Meaning                                              |
| ----------------- | ------ | ---------------------------------------------------- |
| `not_configured`  | `503`  | A value is missing from `.env.local`, or setup isn't finished. |
| `unauthorized`    | `502`  | The outside service rejected our token or key.       |
| `upstream_error`  | `502`  | The outside service is down or unreachable.          |
| `invalid_request` | `400`  | The request was wrong, e.g. a missing `title`.       |
| `not_found`       | `404`  | No to-do or project has that id.                     |
| `login_required`  | `401`  | Not signed in, or the wrong password.                |

## Scripts

- `npm run dev` starts the dev server
- `npm run build` makes a production build
- `npm run lint` runs ESLint
- `npm run google:auth` connects Google Calendar (one-time)
