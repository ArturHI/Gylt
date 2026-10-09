// Everything that talks to Google Calendar lives in this file.
//
// Google does not hand out one long-lived key the way Canvas does. Instead:
//   - a *refresh token* (long-lived, created once by `npm run google:auth`)
//   - is traded for an *access token* (valid for about an hour)
//   - which is what actually authorizes each Calendar request.
import "server-only";

import { ServiceError } from "./service-error";
import type { CalendarEvent } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const REQUEST_TIMEOUT_MS = 8000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Only the fields we read. Google sends many more.
type GoogleEventTime = { dateTime?: string; date?: string };
type GoogleEvent = {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  start: GoogleEventTime;
  end: GoogleEventTime;
};

// Access tokens are reused until shortly before they expire, so most
// requests skip the extra round trip to Google's token endpoint.
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function readConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret) {
    throw new ServiceError(
      "not_configured",
      "Google Calendar isn't connected yet. See the README to set it up.",
    );
  }
  if (!refreshToken) {
    throw new ServiceError(
      "not_configured",
      "Almost there. Run `npm run google:auth` to connect your calendar.",
    );
  }
  return { clientId, clientSecret, refreshToken };
}

/** fetch with a timeout, where a network failure becomes a friendly error. */
async function googleFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // The original error is dropped on purpose so nothing about the
    // request can leak into a response or a log.
    throw new ServiceError("upstream_error", "Couldn't reach Google. Try again in a bit.");
  }
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.value;
  }

  const { clientId, clientSecret, refreshToken } = readConfig();
  const response = await googleFetch(TOKEN_URL, {
    method: "POST",
    // URLSearchParams as a body is sent as a regular HTML form post.
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (response.status === 400 || response.status === 401) {
    throw new ServiceError(
      "unauthorized",
      "Google access has expired. Run `npm run google:auth` to reconnect.",
    );
  }
  if (!response.ok) {
    throw new ServiceError("upstream_error", "Google is having trouble right now.");
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    value: body.access_token,
    // Stop using it a minute early so it cannot expire mid-request.
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
  };
  return cachedAccessToken.value;
}

/** Events on the primary calendar from now until `days` from now, soonest first. */
export async function getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
  const accessToken = await getAccessToken();
  const now = Date.now();

  const params = new URLSearchParams({
    timeMin: new Date(now).toISOString(),
    timeMax: new Date(now + days * DAY_MS).toISOString(),
    // Expand "every Tuesday" into one item per Tuesday, which is also
    // what makes ordering by start time possible.
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "25",
  });

  const response = await googleFetch(`${EVENTS_URL}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401 || response.status === 403) {
    cachedAccessToken = null;
    throw new ServiceError(
      "unauthorized",
      "Google denied access to your calendar. Run `npm run google:auth` to reconnect.",
    );
  }
  if (!response.ok) {
    throw new ServiceError("upstream_error", "Google is having trouble right now.");
  }

  const body = (await response.json()) as { items?: GoogleEvent[] };
  return (body.items ?? []).map(toCalendarEvent);
}

function toCalendarEvent(event: GoogleEvent): CalendarEvent {
  // Timed events carry `dateTime`; all-day events carry only `date`.
  const allDay = !event.start.dateTime;

  return {
    id: event.id,
    title: event.summary ?? "(No title)",
    allDay,
    start: allDay ? event.start.date! : new Date(event.start.dateTime!).toISOString(),
    end: allDay ? event.end.date! : new Date(event.end.dateTime!).toISOString(),
    location: event.location ?? null,
    url: event.htmlLink ?? null,
  };
}
