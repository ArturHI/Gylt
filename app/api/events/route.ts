import { connection } from "next/server";

import { getUpcomingEvents } from "@/lib/google-calendar";
import { toErrorResponse } from "@/lib/service-error";
import type { EventsResponse } from "@/lib/types";

// GET /api/events
// Calendar events from now through the next 7 days, soonest first.
export async function GET() {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    const events = await getUpcomingEvents();
    return Response.json({ events } satisfies EventsResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading your calendar.");
  }
}
