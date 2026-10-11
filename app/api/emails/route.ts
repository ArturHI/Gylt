import { connection } from "next/server";

import { getEmailHighlights } from "@/lib/gmail";
import { toErrorResponse } from "@/lib/service-error";
import type { EmailsResponse } from "@/lib/types";

// GET /api/emails
// Unread Gmail plus recent school mail, newest first.
export async function GET() {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    const emails = await getEmailHighlights();
    return Response.json({ emails } satisfies EmailsResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading your email.");
  }
}
