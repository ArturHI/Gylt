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

export type ApiErrorCode = "not_configured" | "unauthorized" | "upstream_error";

export type ApiErrorResponse = {
  error: { code: ApiErrorCode; message: string };
};
