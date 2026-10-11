"use client";

// A month at a glance. Every day is drawn whether or not anything is
// scheduled, and a day with an event gets a filled circle behind its number.
// Clicking such a day lists what is on it.

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/button-styles";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { IconButton } from "@/components/IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { parseLocalDate } from "@/lib/relative-time";
import type { CalendarEvent, EventsResponse } from "@/lib/types";
import { useApi } from "@/lib/use-api";

// Weeks run Monday to Sunday.
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// The circle around a day number.
//
// Size: as big as its grid cell allows, up to 2rem. `cqw` and `cqh` are
// 1% of the cell's width and height, so the circle shrinks with the card
// and can never spill into its neighbours.
//
// text-box: normally a line of text keeps room below the baseline for
// letters like "g", which makes digits sit slightly high. Trimming the line
// to the height of the digits themselves centers them exactly.
const DAY_CIRCLE =
  "flex size-[min(100cqw,100cqh,2rem)] items-center justify-center rounded-full [text-box:trim-both_cap_alphabetic]";

type Day = { date: Date; events: CalendarEvent[] };

/** A day as a comparable key, like "2026-9-20" (months count from 0). */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function CalendarCard() {
  // The first day of the month on screen. Starts on the current month.
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // The day whose events are showing in the pop-up, if any.
  const [openDay, setOpenDay] = useState<Day | null>(null);

  // JavaScript rolls a month of 12 over into January of the next year, and
  // a month of -1 back into December, so adding or subtracting 1 is enough.
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);

  // Ask for exactly this month, as the viewer's time zone sees it.
  const { state } = useApi<EventsResponse>(
    `/api/events?from=${month.toISOString()}&to=${nextMonth.toISOString()}`,
  );
  const eventsByDay = groupByDay(state.status === "ready" ? state.data.events : []);

  return (
    <Card
      title="Calendar"
      actions={
        <nav aria-label="Calendar months" className="flex items-center gap-0.5 text-xs text-muted">
          <IconButton label="Previous month" onClick={() => setMonth(previousMonth)}>
            <ChevronLeftIcon className="size-4" />
          </IconButton>
          <span className="min-w-24 text-center">
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </span>
          <IconButton label="Next month" onClick={() => setMonth(nextMonth)}>
            <ChevronRightIcon className="size-4" />
          </IconButton>
        </nav>
      }
    >
      <MonthGrid month={month} eventsByDay={eventsByDay} onOpen={setOpenDay} />
      {/* The grid needs no data, so a failure is a quiet note beneath it. */}
      {state.status === "error" && (
        <p className="mt-2 truncate text-xs text-muted" title={state.message}>
          {state.message}
        </p>
      )}

      <Dialog
        open={openDay !== null}
        onClose={() => setOpenDay(null)}
        title={
          openDay?.date.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" }) ?? ""
        }
      >
        {openDay && <DayEvents day={openDay} onClose={() => setOpenDay(null)} />}
      </Dialog>
    </Card>
  );
}

function MonthGrid({
  month,
  eventsByDay,
  onOpen,
}: {
  month: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onOpen: (day: Day) => void;
}) {
  const today = dayKey(new Date());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // Empty cells before the 1st, so it lands under the right weekday.
  // getDay() counts from Sunday (0) to Saturday (6), but our first column
  // is Monday. Adding 6 and wrapping at 7 shifts that to Monday = 0 through
  // Sunday = 6.
  const blanks = (month.getDay() + 6) % 7;

  return (
    // Seven equal columns. `auto-rows-fr` shares the height between the
    // weeks, so the grid stretches when the section is made taller.
    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 text-xs">
      {WEEKDAYS.map((letter, index) => (
        <span key={index} className="flex items-center justify-center text-muted">
          {letter}
        </span>
      ))}

      {Array.from({ length: blanks }, (_, index) => (
        <span key={`blank-${index}`} />
      ))}

      {Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
        const key = dayKey(date);
        const events = eventsByDay.get(key);
        const isToday = key === today;

        return (
          // `@container-[size]` makes this cell the box that the circle's
          // cqw / cqh units measure.
          <div key={key} className="@container-[size] flex items-center justify-center">
            {events ? (
              <button
                type="button"
                onClick={() => onOpen({ date, events })}
                // Hovering lists the events; clicking opens them.
                title={events.map((event) => event.title).join("\n")}
                aria-label={`${index + 1}: ${events.length === 1 ? "1 event" : `${events.length} events`}`}
                className={`${DAY_CIRCLE} bg-accent font-medium text-white transition-opacity hover:opacity-85`}
              >
                {index + 1}
              </button>
            ) : (
              <span className={`${DAY_CIRCLE} ${isToday ? "font-medium ring-1 ring-muted" : ""}`}>
                {index + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The contents of the pop-up: one day's events, earliest first. */
function DayEvents({ day, onClose }: { day: Day; onClose: () => void }) {
  return (
    <>
      <ul className="flex flex-col gap-3">
        {day.events.map((event) => (
          <li key={event.id} className="flex items-baseline gap-3">
            <span className="w-28 shrink-0 text-xs text-muted">{formatTime(event, day.date)}</span>
            <div className="min-w-0">
              {event.url ? (
                <a href={event.url} target="_blank" rel="noreferrer" className="break-words hover:underline">
                  {event.title}
                </a>
              ) : (
                <span className="break-words">{event.title}</span>
              )}
              {event.location && (
                <span className="block break-words text-xs text-muted">{event.location}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
          Close
        </button>
      </div>
    </>
  );
}

/** "All day", or the hours an event takes up on the given day. */
function formatTime(event: CalendarEvent, day: Date): string {
  if (event.allDay) return "All day";

  const time = (date: Date) => date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  const start = new Date(event.start);
  const end = new Date(event.end);

  // An event that runs past midnight appears on two days. On each, show
  // only the part that falls on that day.
  const startsToday = dayKey(start) === dayKey(day);
  const endsToday = dayKey(end) === dayKey(day);
  if (startsToday && endsToday) return `${time(start)} – ${time(end)}`;
  if (startsToday) return `From ${time(start)}`;
  if (endsToday) return `Until ${time(end)}`;
  return "All day";
}

/** Every day that has at least one event, with the events on that day. */
function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const byDay = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const start = event.allDay ? parseLocalDate(event.start) : new Date(event.start);
    const end = event.allDay ? parseLocalDate(event.end) : new Date(event.end);
    // The end is the moment an event stops, so an all-day event on the 20th
    // "ends" at midnight on the 21st. Stepping back 1ms gives its last day.
    const lastDay = new Date(Math.max(start.getTime(), end.getTime() - 1));

    // Mark each day the event touches, for events longer than a day.
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (day <= lastDay) {
      const key = dayKey(day);
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
      day.setDate(day.getDate() + 1);
    }
  }
  return byDay;
}
