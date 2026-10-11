// Everything that talks to Duolingo lives in this file.
//
// Duolingo has no official API. This uses the same public profile endpoint
// its own website calls, which needs only a username. It is unofficial, so
// it may change or stop working without warning.
import "server-only";

import { ServiceError } from "./service-error";
import type { DuolingoResponse } from "./types";

const USERS_URL = "https://www.duolingo.com/2017-06-30/users";
const REQUEST_TIMEOUT_MS = 8000;

// The endpoint turns away requests that don't look like a browser.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Only the fields we ask for (see `fields` below).
type DuolingoUser = {
  username: string;
  streak?: number;
  streakData?: {
    // null when there is no streak at the moment.
    currentStreak?: { length: number; endDate: string } | null;
  };
};

export async function getDuolingoStreak(): Promise<DuolingoResponse> {
  const username = process.env.DUOLINGO_USERNAME?.trim();
  if (!username) {
    throw new ServiceError(
      "not_configured",
      "Duolingo isn't connected yet. Add DUOLINGO_USERNAME to .env.local.",
    );
  }

  const params = new URLSearchParams({
    username,
    // Ask for just these fields instead of the whole profile.
    fields: "users{username,streak,streakData{currentStreak}}",
  });

  let response: Response;
  try {
    response = await fetch(`${USERS_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ServiceError("upstream_error", "Couldn't reach Duolingo. Try again in a bit.");
  }

  if (!response.ok) {
    throw new ServiceError("upstream_error", "Duolingo isn't responding right now.");
  }

  const body = (await response.json()) as { users?: DuolingoUser[] };
  const user = body.users?.[0];
  if (!user) {
    // An unknown username is not an error to Duolingo, just an empty list.
    throw new ServiceError("not_configured", "No Duolingo user has that username.");
  }

  const currentStreak = user.streakData?.currentStreak;
  return {
    username: user.username,
    streak: currentStreak?.length ?? user.streak ?? 0,
    lastStreakDate: currentStreak?.endDate ?? null,
  };
}
