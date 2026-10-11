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

export type CalendarEvent = {
  id: string;
  title: string;
  /** True for events with a date but no time, like a holiday. */
  allDay: boolean;
  /**
   * Timed events: ISO 8601 timestamps in UTC.
   * All-day events: plain dates ("2026-10-12"), and `end` is exclusive,
   * so a one-day event on the 12th ends on "2026-10-13".
   */
  start: string;
  end: string;
  location: string | null;
  /** Link to the event in Google Calendar. */
  url: string | null;
};

export type EventsResponse = {
  events: CalendarEvent[];
};

/** One whole day of forecast. All temperatures are in degrees Celsius. */
export type WeatherDay = {
  /** A plain date at the forecast location, like "2026-10-12". */
  date: string;
  high: number;
  low: number;
  /** The daytime conditions, for example "Mostly Sunny". */
  summary: string;
  /** 0 to 100 across the day and night, or null when the forecast doesn't say. */
  precipitationChance: number | null;
};

export type WeatherResponse = {
  /** For example "Norman, OK". */
  location: string;
  /** This hour. Temperature is in degrees Celsius. */
  current: { temperature: number; summary: string };
  /**
   * Only days with both a high and a low still ahead, so in the evening
   * this starts from tomorrow.
   */
  days: WeatherDay[];
};

export type EmailSummary = {
  id: string;
  /**
   * "ou" is school mail, forwarded into Gmail under the "OU" label.
   * "gmail" is everything else.
   */
  account: "gmail" | "ou";
  unread: boolean;
  /** The sender's display name, or their address when they have none. */
  from: string;
  fromAddress: string;
  subject: string;
  /** ISO 8601 timestamp in UTC. */
  receivedAt: string;
  /** Opens the message in the mail provider's own site. */
  url: string;
};

export type EmailsResponse = {
  emails: EmailSummary[];
};

export type DuolingoResponse = {
  username: string;
  /** Length of the current streak in days. 0 when there is none. */
  streak: number;
  /**
   * The last day that counts toward the streak, like "2026-10-10", or null
   * with no streak. When it equals today's date, today is done.
   */
  lastStreakDate: string | null;
};

export type Project = {
  id: string;
  name: string;
  /** ISO 8601 timestamp in UTC. */
  createdAt: string;
};

export type Todo = {
  id: string;
  title: string;
  /** Optional extra detail, or null when there is none. */
  note: string | null;
  done: boolean;
  /** The project this belongs to, or null for a loose to-do. */
  projectId: string | null;
  /** ISO 8601 timestamps in UTC. `completedAt` is null until it is done. */
  createdAt: string;
  completedAt: string | null;
};

export type ProjectsResponse = { projects: Project[] };
export type ProjectResponse = { project: Project };
export type TodosResponse = { todos: Todo[] };
export type TodoResponse = { todo: Todo };

export type ApiErrorCode =
  | "not_configured"
  | "unauthorized"
  | "upstream_error"
  // The request itself was wrong: a missing title, a malformed body.
  | "invalid_request"
  | "not_found";

export type ApiErrorResponse = {
  error: { code: ApiErrorCode; message: string };
};
