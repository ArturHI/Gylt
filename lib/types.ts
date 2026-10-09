// Shapes returned by our own API routes. Both the web UI and the future
// iPhone app read these, so they describe *our* contract, not Canvas's.

export type Course = {
  id: number;
  name: string;
  code: string;
};

export type Deadline = {
  id: string;
  title: string;
  courseId: number | null;
  courseName: string;
  /** ISO 8601 timestamp, always in UTC. Format it on the client. */
  dueAt: string;
  /** Link to the item in Canvas, if Canvas gave us one. */
  url: string | null;
};

export type DeadlinesResponse = {
  deadlines: Deadline[];
  courses: Course[];
};

export type ApiErrorCode = "not_configured" | "unauthorized" | "upstream_error";

export type ApiErrorResponse = {
  error: { code: ApiErrorCode; message: string };
};
