import type { ApiErrorCode, ApiErrorResponse } from "./types";

/**
 * A failure talking to an outside service (Canvas, Google, ...).
 * Its message is shown to the user, so never put secrets in it.
 */
export class ServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  not_configured: 503,
  unauthorized: 502,
  upstream_error: 502,
};

/**
 * Turns anything a route handler caught into our standard error JSON.
 *
 * Unknown errors get the generic fallback message and are not logged, so a
 * token can never appear in a response or in the server output.
 */
export function toErrorResponse(error: unknown, fallbackMessage: string): Response {
  const { code, message } =
    error instanceof ServiceError
      ? error
      : { code: "upstream_error" as const, message: fallbackMessage };

  return Response.json({ error: { code, message } } satisfies ApiErrorResponse, {
    status: STATUS_BY_CODE[code],
  });
}
