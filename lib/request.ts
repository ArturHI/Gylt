// Small helpers for reading what a client sent to one of our API routes.

import { ServiceError } from "./service-error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/**
 * Reads a JSON request body and makes sure it is an object like { ... }.
 *
 * Insisting on the JSON content type also stops other websites from
 * quietly posting to these routes: browsers refuse to send a cross-site
 * JSON request unless the server opts in, and ours never does.
 */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new ServiceError("invalid_request", "Send the body as JSON (Content-Type: application/json).");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ServiceError("invalid_request", "The request body isn't valid JSON.");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ServiceError("invalid_request", "The request body should be a JSON object.");
  }
  return body as Record<string, unknown>;
}
