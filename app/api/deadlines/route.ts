import { connection } from "next/server";

import { CanvasError, getCurrentCourses, getUpcomingDeadlines } from "@/lib/canvas";
import type { ApiErrorCode, ApiErrorResponse, DeadlinesResponse } from "@/lib/types";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  not_configured: 503,
  unauthorized: 502,
  upstream_error: 502,
};

// GET /api/deadlines
// The route stays thin: it turns the result of lib/canvas into HTTP.
export async function GET() {
  // Run on every request. Without this, a build with no token set could
  // prerender the "not configured" response and serve it forever.
  await connection();

  try {
    const courses = await getCurrentCourses();
    const deadlines = await getUpcomingDeadlines(courses);
    return Response.json({ deadlines, courses } satisfies DeadlinesResponse);
  } catch (error) {
    // Unknown errors get a generic message and are not logged, so the
    // token can never appear in a response or in the server output.
    const { code, message } =
      error instanceof CanvasError
        ? error
        : { code: "upstream_error" as const, message: "Something went wrong loading deadlines." };

    return Response.json({ error: { code, message } } satisfies ApiErrorResponse, {
      status: STATUS_BY_CODE[code],
    });
  }
}
