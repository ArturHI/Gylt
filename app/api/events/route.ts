import { connection } from "next/server";

import { getEvents } from "@/lib/google-calendar";
import { ServiceError, toErrorResponse } from "@/lib/service-error";
import type { EventsResponse } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
// Enough for any month plus the spare days a calendar grid shows around it.
const MAX_RANGE_DAYS = 62;

// GET /api/events                    the next 7 days
// GET /api/events?from=...&to=...    a range, given as two ISO timestamps
//
// The caller picks the range because "this month" depends on its time zone,
// which the server does not know.
export async function GET(request: Request) {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    const events = await getEvents(readRange(new URL(request.url).searchParams));
    return Response.json({ events } satisfies EventsResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading your calendar.");
  }
}

function readRange(params: URLSearchParams): { from: Date; to: Date } | undefined {
  const fromText = params.get("from");
  const toText = params.get("to");
  if (fromText === null && toText === null) return undefined;

  const from = new Date(fromText ?? "");
  const to = new Date(toText ?? "");
  // An unreadable date becomes "Invalid Date", whose time is NaN.
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ServiceError("invalid_request", '"from" and "to" should both be ISO timestamps.');
  }
  if (to <= from) {
    throw new ServiceError("invalid_request", '"to" should be later than "from".');
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    throw new ServiceError("invalid_request", `Ask for ${MAX_RANGE_DAYS} days or fewer at a time.`);
  }
  return { from, to };
}
