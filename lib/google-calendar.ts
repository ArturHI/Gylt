// Everything that talks to Google Calendar lives in this file.
// Signing in is handled by lib/google-auth.ts.
import "server-only";

import { googleGet } from "./google-auth";
import type { CalendarEvent } from "./types";

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
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

/** Events on the primary calendar from now until `days` from now, soonest first. */
export async function getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
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

  const body = await googleGet<{ items?: GoogleEvent[] }>(
    `${EVENTS_URL}?${params}`,
    "Google denied access to your calendar. Run `npm run google:auth` to reconnect.",
  );
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
