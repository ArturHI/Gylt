"use client";

// A Client Component, for two reasons:
//  1. It reads /api/deadlines exactly the way the iPhone app will, so the
//     API contract is exercised by the web UI from day one.
//  2. "tomorrow" depends on the viewer's clock and time zone. The server
//     (UTC on Vercel) would get that wrong around midnight.

import { Card, CardMessage } from "@/components/Card";
import { formatRelativeDay, isDueWithin } from "@/lib/relative-time";
import type { Deadline, DeadlinesResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const MAX_SHOWN = 5;
const SOON_HOURS = 48;

export function DeadlinesCard() {
  const state = useApi<DeadlinesResponse>("/api/deadlines");

  return (
    <Card title="Classes & deadlines">
      <DeadlinesBody state={state} />
    </Card>
  );
}

function DeadlinesBody({ state }: { state: ApiState<DeadlinesResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;
  if (state.data.deadlines.length === 0) return <CardMessage>Nothing due. Enjoy it.</CardMessage>;

  return (
    <ul className="flex flex-col gap-3.5">
      {state.data.deadlines.slice(0, MAX_SHOWN).map((deadline) => (
        <DeadlineRow key={deadline.id} deadline={deadline} />
      ))}
    </ul>
  );
}

function DeadlineRow({ deadline }: { deadline: Deadline }) {
  const due = new Date(deadline.dueAt);
  const soon = isDueWithin(due, SOON_HOURS);

  return (
    <li className="flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        {deadline.url ? (
          <a
            href={deadline.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate hover:underline"
          >
            {deadline.title}
          </a>
        ) : (
          <span className="block truncate">{deadline.title}</span>
        )}
        <span className="block truncate text-xs text-muted">{deadline.courseName}</span>
      </div>
      <time
        dateTime={deadline.dueAt}
        title={due.toLocaleString()}
        className={`shrink-0 text-xs ${soon ? "font-medium text-accent" : "text-muted"}`}
      >
        {formatRelativeDay(due)}
      </time>
    </li>
  );
}
