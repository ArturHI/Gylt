import { connection } from "next/server";

import { getCurrentCourses, getUpcomingDeadlines } from "@/lib/canvas";
import { toErrorResponse } from "@/lib/service-error";
import type { DeadlinesResponse } from "@/lib/types";

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
    return toErrorResponse(error, "Something went wrong loading deadlines.");
  }
}
