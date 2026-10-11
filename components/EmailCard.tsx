"use client";

// Deliberately plain: a read-only list that proves the API works.
// The real layout waits for the redesign.

import { Card, CardMessage } from "@/components/Card";
import type { EmailsResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const MAX_SHOWN = 5;

export function EmailCard() {
  const state = useApi<EmailsResponse>("/api/emails");

  return (
    <Card title="Email">
      <EmailBody state={state} />
    </Card>
  );
}

function EmailBody({ state }: { state: ApiState<EmailsResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { emails } = state.data;
  if (emails.length === 0) return <CardMessage>No new email.</CardMessage>;

  return (
    <ul className="flex flex-col gap-2">
      {emails.slice(0, MAX_SHOWN).map((email) => (
        <li key={email.id} className="min-w-0">
          <a href={email.url} target="_blank" rel="noreferrer" className="block truncate hover:underline">
            {email.subject}
          </a>
          <span className="block truncate text-xs text-muted">
            {email.account === "ou" ? "OU · " : ""}
            {email.from}
          </span>
        </li>
      ))}
    </ul>
  );
}
