"use client";

// A Client Component for the same reasons as DeadlinesCard: it uses the
// public API route, and "today" depends on the viewer's time zone.

import { Card, CardMessage } from "@/components/Card";
import { formatDayHeading, parseLocalDate } from "@/lib/relative-time";
import type { CalendarEvent, EventsResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const MAX_SHOWN = 5;

export function CalendarCard() {
  const { state } = useApi<EventsResponse>("/api/events");

  return (
    <Card title="Calendar">
      <CalendarBody state={state} />
    </Card>
  );
}

function CalendarBody({ state }: { state: ApiState<EventsResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;
  if (state.data.events.length === 0) {
    return <CardMessage>Nothing scheduled this week.</CardMessage>;
  }

  const now = new Date();
  const days = groupByDay(state.data.events.slice(0, MAX_SHOWN), now);

  return (
    <div className="flex flex-col gap-4">
      {days.map(({ heading, events }) => (
        <div key={heading}>
          <h3 className="text-xs text-muted first-letter:uppercase">{heading}</h3>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {events.map((event) => (
              <EventRow key={event.id} event={event} now={now} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EventRow({ event, now }: { event: CalendarEvent; now: Date }) {
  const start = startOf(event);
  const happeningNow = !event.allDay && start <= now;

  let timeLabel = start.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  if (event.allDay) timeLabel = "All day";
  if (happeningNow) timeLabel = "Now";

  return (
    <li className="flex items-baseline gap-3" title={event.location ?? undefined}>
      <span
        className={`w-14 shrink-0 text-xs ${happeningNow ? "font-medium text-accent" : "text-muted"}`}
      >
        {timeLabel}
      </span>
      {event.url ? (
        <a href={event.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
          {event.title}
        </a>
      ) : (
        <span className="truncate">{event.title}</span>
      )}
    </li>
  );
}

function startOf(event: CalendarEvent): Date {
  return event.allDay ? parseLocalDate(event.start) : new Date(event.start);
}

/** Splits an already-sorted list into runs of events that share a day. */
function groupByDay(events: CalendarEvent[], now: Date) {
  const days: { heading: string; events: CalendarEvent[] }[] = [];

  for (const event of events) {
    // Something that began earlier (a multi-day trip, a meeting in
    // progress) belongs under today, not under a day in the past.
    const start = startOf(event);
    const heading = formatDayHeading(start < now ? now : start, now);

    const lastDay = days.at(-1);
    if (lastDay?.heading === heading) {
      lastDay.events.push(event);
    } else {
      days.push({ heading, events: [event] });
    }
  }
  return days;
}
