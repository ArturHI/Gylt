// Runs before every request (Next.js calls this file "proxy"; older
// versions called it "middleware"). It is the single gate in front of the
// whole dashboard: pages and API routes alike.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, getPassword, isSessionValid } from "@/lib/session";
import type { ApiErrorResponse } from "@/lib/types";

export function proxy(request: NextRequest) {
  if (!getPassword()) {
    // On your own machine, no password simply means no lock.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();

    // On a deployed site a missing password must never mean "open to all".
    return new NextResponse("Set DASHBOARD_PASSWORD to use this dashboard.", { status: 503 });
  }

  if (isSessionValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  // Not signed in. API callers get an error they can read; people get the
  // login page.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "login_required", message: "Please sign in again." } } satisfies ApiErrorResponse,
      { status: 401 },
    );
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Guard everything except the login page and its route, the privacy
  // page, and the static files the login page itself needs. The `$` makes
  // those exact: "/login" is open, a future "/login-history" would not be.
  matcher: ["/((?!login$|privacy$|api/login$|_next/static/|_next/image/|favicon.ico$).*)"],
};
