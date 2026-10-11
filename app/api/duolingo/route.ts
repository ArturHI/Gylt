import { connection } from "next/server";

import { getDuolingoStreak } from "@/lib/duolingo";
import { toErrorResponse } from "@/lib/service-error";

// GET /api/duolingo
// The current streak and the last day that counted toward it.
export async function GET() {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    return Response.json(await getDuolingoStreak());
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading Duolingo.");
  }
}
