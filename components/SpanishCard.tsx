"use client";

// Deliberately plain: it proves the API works. The streak flame and the
// real layout wait for the redesign.

import { Card, CardMessage } from "@/components/Card";
import { parseLocalDate } from "@/lib/relative-time";
import type { DuolingoResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

export function SpanishCard() {
  const state = useApi<DuolingoResponse>("/api/duolingo");

  return (
    <Card title="Spanish">
      <SpanishBody state={state} />
    </Card>
  );
}

function SpanishBody({ state }: { state: ApiState<DuolingoResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { streak, lastStreakDate } = state.data;
  const doneToday = lastStreakDate !== null && isToday(parseLocalDate(lastStreakDate));

  return (
    <div>
      <p>{streak === 1 ? "1 day streak" : `${streak} day streak`}</p>
      <p className={`text-xs ${doneToday ? "text-muted" : "text-accent"}`}>
        {doneToday ? "Lesson done today" : "No lesson yet today"}
      </p>
    </div>
  );
}

/** Whether the date falls on today, by this device's clock and time zone. */
function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}
