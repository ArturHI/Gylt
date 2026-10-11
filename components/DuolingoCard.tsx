"use client";

import { Card, CardMessage, CardSkeleton } from "@/components/Card";
import { CheckIcon, FlameIcon, LanguagesIcon } from "@/components/icons";
import { parseLocalDate } from "@/lib/relative-time";
import type { DuolingoResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_SHOWN = 7;

export function DuolingoCard() {
  const { state } = useApi<DuolingoResponse>("/api/duolingo");

  return (
    <Card
      title="Duolingo"
      icon={<LanguagesIcon className="size-4" />}
      href="https://www.duolingo.com/learn"
    >
      <DuolingoBody state={state} />
    </Card>
  );
}

function DuolingoBody({ state }: { state: ApiState<DuolingoResponse> }) {
  if (state.status === "loading") return <CardSkeleton />;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { streak, lastStreakDate } = state.data;
  const week = lastSevenDays(streak, lastStreakDate);
  const doneToday = week.at(-1)!.done;

  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <div className="flex items-center gap-4">
        {/* The flame is lit once today's lesson is done, like in Duolingo. */}
        <FlameIcon lit={doneToday} className={`size-11 shrink-0 ${doneToday ? "text-accent" : "text-muted"}`} />
        <div className="min-w-0">
          <p className="text-4xl font-light leading-none tabular-nums">{streak.toLocaleString()}</p>
          <p className="mt-1.5 text-xs text-muted">day streak</p>
        </div>
      </div>

      <div>
        <ol className="flex justify-between">
          {week.map((day) => (
            <li key={day.key} className="flex flex-col items-center gap-1.5">
              <span
                title={day.label}
                className={`flex size-6 items-center justify-center rounded-full ${
                  day.done
                    ? "bg-accent text-white"
                    : `border ${day.isToday ? "border-accent" : "border-line"}`
                }`}
              >
                {day.done && <CheckIcon className="size-3.5" />}
              </span>
              <span className={`text-xs ${day.isToday ? "text-ink" : "text-muted"}`}>{day.letter}</span>
            </li>
          ))}
        </ol>

        <p className={`mt-4 text-xs ${doneToday ? "text-muted" : "text-accent"}`}>
          {doneToday ? "Lesson done today" : "No lesson yet today"}
        </p>
      </div>
    </div>
  );
}

/**
 * The last seven days, oldest first and ending today, each marked done or
 * not.
 *
 * Duolingo only tells us the streak's length and its last day. A streak of
 * N days ending on day D covers the N days up to and including D, so that
 * is enough to fill in the week.
 */
function lastSevenDays(streak: number, lastStreakDate: string | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Math.round absorbs the hour that daylight saving adds or removes.
  const dayNumber = (time: number) => Math.round(time / DAY_MS);
  const lastDone = lastStreakDate === null ? null : dayNumber(parseLocalDate(lastStreakDate).getTime());

  return Array.from({ length: DAYS_SHOWN }, (_, index) => {
    const date = new Date(today - (DAYS_SHOWN - 1 - index) * DAY_MS);
    const day = dayNumber(date.getTime());

    return {
      key: day,
      letter: date.toLocaleDateString("en", { weekday: "narrow" }),
      label: date.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" }),
      isToday: index === DAYS_SHOWN - 1,
      done: lastDone !== null && day <= lastDone && day > lastDone - streak,
    };
  });
}
