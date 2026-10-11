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

/**
 * Events on the primary calendar that overlap the time between `from` and
 * `to`, soonest first. With no range given, that is the next 7 days.
 */
export async function getEvents(range?: { from: Date; to: Date }): Promise<CalendarEvent[]> {
  const from = range?.from ?? new Date();
  const to = range?.to ?? new Date(from.getTime() + 7 * DAY_MS);

  const params = new URLSearchParams({
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    // Expand "every Tuesday" into one item per Tuesday, which is also
    // what makes ordering by start time possible.
    singleEvents: "true",
    orderBy: "startTime",
    // Plenty for a month, and the most Google returns in one page.
    maxResults: "250",
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
