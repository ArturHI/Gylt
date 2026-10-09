import { connection } from "next/server";

import { toErrorResponse } from "@/lib/service-error";
import { getWeather } from "@/lib/weather";

// GET /api/weather
// Current conditions and the next few forecast periods.
export async function GET() {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    return Response.json(await getWeather());
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading the weather.");
  }
}
