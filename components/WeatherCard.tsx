"use client";

import { Card, CardMessage } from "@/components/Card";
import { formatDayHeading, parseLocalDate } from "@/lib/relative-time";
import type { WeatherResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

// Only call out rain (or snow) when it is more likely than not.
const LIKELY_PRECIPITATION = 50;

export function WeatherCard() {
  const { state } = useApi<WeatherResponse>("/api/weather");

  return (
    <Card title="Weather">
      <WeatherBody state={state} />
    </Card>
  );
}

function WeatherBody({ state }: { state: ApiState<WeatherResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { location, current, days } = state.data;

  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light tabular-nums">{current.temperature}°</span>
        <div className="min-w-0">
          <p className="truncate">{current.summary}</p>
          <p className="truncate text-xs text-muted">{location}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {days.map((day) => {
          const wet = (day.precipitationChance ?? 0) >= LIKELY_PRECIPITATION;

          return (
            <li key={day.date} className="flex items-baseline gap-3">
              <span className="w-20 shrink-0 truncate text-xs text-muted first-letter:uppercase">
                {formatDayHeading(parseLocalDate(day.date))}
              </span>
              <span className={`min-w-0 flex-1 truncate ${wet ? "text-accent" : ""}`}>
                {wet ? `${day.precipitationChance}% · ` : ""}
                {day.summary}
              </span>
              {/* High first, then the low in a quieter color. */}
              <span className="shrink-0 tabular-nums">
                {day.high}° <span className="text-muted">{day.low}°</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
