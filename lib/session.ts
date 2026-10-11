// The lock on the deployed dashboard: one password, and a signed cookie
// that remembers a browser has entered it.
//
// How the cookie works: it holds an expiry time plus a signature of that
// time. The signature is an HMAC, a fingerprint that can only be produced
// by someone who knows the password. A visitor can read their cookie, but
// cannot change the expiry or forge a new one without the password.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gylt_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/** The dashboard password, or null when none has been set. */
export function getPassword(): string | null {
  return process.env.DASHBOARD_PASSWORD?.trim() || null;
}

/**
 * Compares two strings without leaking how much of them matched.
 *
 * A plain `a === b` stops at the first different character, so its timing
 * hints at how close a guess was. Hashing both first gives equal lengths,
 * and timingSafeEqual always takes the same time.
 */
function safeEqual(a: string, b: string): boolean {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export function isPasswordCorrect(attempt: string): boolean {
  const password = getPassword();
  return password !== null && safeEqual(attempt, password);
}

function sign(expiresAt: string, password: string): string {
  return createHmac("sha256", password).update(`gylt-session:${expiresAt}`).digest("base64url");
}

/** A fresh cookie value. Only call this after the password was checked. */
export function createSessionToken(now: number = Date.now()): string {
  const password = getPassword();
  if (!password) throw new Error("DASHBOARD_PASSWORD is not set");

  const expiresAt = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, password)}`;
}

/** True for a cookie we issued that has not expired or been altered. */
export function isSessionValid(token: string | undefined, now: number = Date.now()): boolean {
  const password = getPassword();
  if (!password || !token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  // Changing the password changes every signature, which signs everyone out.
  return safeEqual(signature, sign(expiresAt, password)) && Number(expiresAt) > now;
}
