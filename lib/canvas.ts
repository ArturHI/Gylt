// Everything that talks to Canvas lives in this file.
//
// "server-only" makes the build fail if a Client Component ever imports this
// module, which is what guarantees CANVAS_TOKEN cannot end up in the browser.
import "server-only";

import type { ApiErrorCode, Course, Deadline } from "./types";

/** An error whose message is safe to show to the user. Never put secrets in it. */
export class CanvasError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CanvasError";
  }
}

// Only the fields we read. Canvas sends many more.
type CanvasCourse = {
  id: number;
  name?: string;
  course_code?: string;
};

type CanvasPlannerItem = {
  course_id?: number;
  context_name?: string;
  plannable_id: number | string;
  plannable_type: string;
  plannable: { title?: string; due_at?: string | null };
  html_url?: string;
  // `false` when the item cannot be submitted at all.
  submissions?: false | { submitted?: boolean };
  planner_override?: { marked_complete?: boolean } | null;
};

const REQUEST_TIMEOUT_MS = 8000;

function readConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.CANVAS_BASE_URL?.trim().replace(/\/+$/, "");
  const token = process.env.CANVAS_TOKEN?.trim();

  if (!baseUrl || !token) {
    throw new CanvasError(
      "not_configured",
      "Canvas isn't connected yet. Add CANVAS_BASE_URL and CANVAS_TOKEN to .env.local.",
    );
  }
  if (!baseUrl.startsWith("https://")) {
    throw new CanvasError(
      "not_configured",
      "CANVAS_BASE_URL should start with https://",
    );
  }
  return { baseUrl, token };
}

async function canvasGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const { baseUrl, token } = readConfig();
  const url = `${baseUrl}/api/v1${path}?${new URLSearchParams(params)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Network failure or timeout. The original error is dropped on purpose
    // so nothing about the request can leak into a response or a log.
    throw new CanvasError("upstream_error", "Couldn't reach Canvas. Try again in a bit.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new CanvasError(
      "unauthorized",
      "Canvas rejected the access token. It may have expired.",
    );
  }
  if (!response.ok) {
    throw new CanvasError("upstream_error", "Canvas is having trouble right now.");
  }
  return (await response.json()) as T;
}

export async function getCurrentCourses(): Promise<Course[]> {
  const courses = await canvasGet<CanvasCourse[]>("/courses", {
    enrollment_state: "active",
    per_page: "100",
  });

  return courses
    // Courses outside their access dates come back with an id and no name.
    .filter((course) => course.name)
    .map((course) => ({
      id: course.id,
      name: course.name!,
      code: course.course_code ?? course.name!,
    }));
}

/**
 * Unfinished work with a due date, soonest first.
 *
 * The planner endpoint is the same data behind the Canvas to-do list, so it
 * already spans every course. We ask for one page of 50 starting from now,
 * which is far more than the dashboard shows.
 */
export async function getUpcomingDeadlines(courses: Course[]): Promise<Deadline[]> {
  const { baseUrl } = readConfig();
  const items = await canvasGet<CanvasPlannerItem[]>("/planner/items", {
    start_date: new Date().toISOString(),
    order: "asc",
    per_page: "50",
  });

  const courseNames = new Map(courses.map((course) => [course.id, course.name]));

  return items
    .filter((item) => item.plannable.due_at)
    .filter((item) => !isDone(item))
    .map((item) => ({
      id: `${item.plannable_type}-${item.plannable_id}`,
      title: item.plannable.title ?? "Untitled",
      courseId: item.course_id ?? null,
      courseName:
        (item.course_id && courseNames.get(item.course_id)) || item.context_name || "Canvas",
      dueAt: new Date(item.plannable.due_at!).toISOString(),
      url: item.html_url ? new URL(item.html_url, baseUrl).toString() : null,
    }))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

function isDone(item: CanvasPlannerItem): boolean {
  const submitted = item.submissions ? item.submissions.submitted === true : false;
  return submitted || item.planner_override?.marked_complete === true;
}
