// The one place that talks to Supabase.
//
// Supabase puts an HTTP API (called PostgREST) in front of the database,
// where each table is a URL:
//
//   GET    /rest/v1/todos?done=eq.false      read rows where done = false
//   POST   /rest/v1/todos                    insert the row in the body
//   PATCH  /rest/v1/todos?id=eq.<id>         update the rows that match
//   DELETE /rest/v1/todos?id=eq.<id>         delete the rows that match
//
// That is all this project needs, so it uses fetch directly rather than
// adding the supabase-js library.
import "server-only";

import { ServiceError } from "./service-error";

const REQUEST_TIMEOUT_MS = 8000;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** PostgREST filters and options, e.g. { id: "eq.123", order: "created_at.asc" }. */
  query?: Record<string, string>;
  /** The row to insert, or the columns to change. */
  body?: Record<string, unknown>;
};

function readConfig(): { baseUrl: string; secretKey: string } {
  const baseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!baseUrl || !secretKey) {
    throw new ServiceError(
      "not_configured",
      "The database isn't connected yet. Add SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local.",
    );
  }
  if (!baseUrl.startsWith("https://")) {
    throw new ServiceError("not_configured", "SUPABASE_URL should start with https://");
  }
  return { baseUrl, secretKey };
}

/** Runs one request against a table and returns the rows it read or changed. */
export async function supabaseRequest<Row>(
  table: string,
  { method = "GET", query = {}, body }: RequestOptions = {},
): Promise<Row[]> {
  const { baseUrl, secretKey } = readConfig();
  const url = `${baseUrl}/rest/v1/${table}?${new URLSearchParams(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        // Ask writes to send back the rows they touched, so the caller
        // gets the saved row (with its new id) without a second request.
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // The original error is dropped on purpose so nothing about the
    // request can leak into a response or a log.
    throw new ServiceError("upstream_error", "Couldn't reach the database. Try again in a bit.");
  }

  if (!response.ok) {
    throw await toServiceError(response);
  }
  return (await response.json()) as Row[];
}

async function toServiceError(response: Response): Promise<ServiceError> {
  // Errors come with a short code: Postgres's own five-character codes,
  // or PostgREST's "PGRST..." ones. Only the code is read, never the text.
  const { code } = (await response.json().catch(() => ({}))) as { code?: string };

  if (code === "23503") {
    // Foreign key violation: the row points at something that isn't there.
    return new ServiceError("invalid_request", "That project doesn't exist.");
  }
  if (code === "PGRST205" || code === "42P01" || code === "42501") {
    // Table missing, or the server role has no permission on it.
    return new ServiceError(
      "not_configured",
      "The database tables aren't set up yet. Run supabase/schema.sql in the Supabase SQL editor.",
    );
  }
  if (code === "PGRST204" || code === "42703") {
    // The table exists but lacks a column that was added in a later update.
    return new ServiceError(
      "not_configured",
      "The database needs a small update. Run supabase/add-todo-notes.sql in the Supabase SQL editor.",
    );
  }
  if (response.status === 401 || response.status === 403) {
    return new ServiceError("unauthorized", "Supabase rejected the secret key.");
  }
  return new ServiceError("upstream_error", "The database is having trouble right now.");
}
