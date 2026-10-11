// Signing in to Google, shared by every Google service we read.
//
// Google does not hand out one long-lived key the way Canvas does. Instead:
//   - a *refresh token* (long-lived, created once by `npm run google:auth`)
//   - is traded for an *access token* (valid for about an hour)
//   - which is what actually authorizes each request.
import "server-only";

import { ServiceError } from "./service-error";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REQUEST_TIMEOUT_MS = 8000;

// Access tokens are reused until shortly before they expire, so most
// requests skip the extra round trip to Google's token endpoint. The
// refresh token it came from is remembered too: after `npm run google:auth`
// saves a new one, the old access token must not be used any more.
let cachedAccessToken: { value: string; expiresAt: number; refreshToken: string } | null = null;

function readConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret) {
    throw new ServiceError(
      "not_configured",
      "Google isn't connected yet. See the README to set it up.",
    );
  }
  if (!refreshToken) {
    throw new ServiceError(
      "not_configured",
      "Almost there. Run `npm run google:auth` to connect your Google account.",
    );
  }
  return { clientId, clientSecret, refreshToken };
}

/** fetch with a timeout, where a network failure becomes a friendly error. */
async function fetchFromGoogle(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // The original error is dropped on purpose so nothing about the
    // request can leak into a response or a log.
    throw new ServiceError("upstream_error", "Couldn't reach Google. Try again in a bit.");
  }
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = readConfig();

  if (
    cachedAccessToken &&
    cachedAccessToken.refreshToken === refreshToken &&
    Date.now() < cachedAccessToken.expiresAt
  ) {
    return cachedAccessToken.value;
  }

  const response = await fetchFromGoogle(TOKEN_URL, {
    method: "POST",
    // URLSearchParams as a body is sent as a regular HTML form post.
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (response.status === 400 || response.status === 401) {
    throw new ServiceError(
      "unauthorized",
      "Google access has expired. Run `npm run google:auth` to reconnect.",
    );
  }
  if (!response.ok) {
    throw new ServiceError("upstream_error", "Google is having trouble right now.");
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    value: body.access_token,
    // Stop using it a minute early so it cannot expire mid-request.
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
    refreshToken,
  };
  return cachedAccessToken.value;
}

/**
 * GETs a Google API URL as the signed-in user and returns the JSON.
 *
 * `deniedMessage` is shown when Google refuses, which usually means this
 * service's permission was never granted or its API isn't enabled.
 */
export async function googleGet<T>(url: string, deniedMessage: string): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetchFromGoogle(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401 || response.status === 403) {
    cachedAccessToken = null;
    throw new ServiceError("unauthorized", deniedMessage);
  }
  if (!response.ok) {
    throw new ServiceError("upstream_error", "Google is having trouble right now.");
  }
  return (await response.json()) as T;
}
