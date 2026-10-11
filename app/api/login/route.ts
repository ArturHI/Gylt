import { NextResponse } from "next/server";

import { readJsonObject } from "@/lib/request";
import { ServiceError, toErrorResponse } from "@/lib/service-error";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getPassword,
  isPasswordCorrect,
} from "@/lib/session";

const WRONG_PASSWORD_DELAY_MS = 750;

// POST /api/login   { "password": "..." }
// On success, sets the session cookie that proxy.ts looks for.
export async function POST(request: Request) {
  try {
    if (!getPassword()) {
      throw new ServiceError("not_configured", "No password is set, so there is nothing to sign in to.");
    }

    const { password } = await readJsonObject(request);
    if (typeof password !== "string" || !isPasswordCorrect(password)) {
      // A pause after each wrong guess makes guessing in bulk much slower.
      await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
      throw new ServiceError("login_required", "That password isn't right.");
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true, // page scripts cannot read it
      secure: process.env.NODE_ENV === "production", // only sent over https
      sameSite: "lax", // not sent on requests started by other websites
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return toErrorResponse(error, "Something went wrong signing in.");
  }
}
