"use client";

import { useState } from "react";

import { Card, CardMessage, CardSkeleton } from "@/components/Card";
import { BriefcaseIcon, HomeIcon, MailIcon } from "@/components/icons";
import type { EmailsResponse, EmailSummary } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const MAX_SHOWN = 5;

type Account = EmailSummary["account"];

// `url` is where the section's title goes for each mailbox. School mail is
// only copied into Gmail, so its real home (for replying) is Outlook.
const ACCOUNTS = [
  {
    id: "gmail",
    label: "Personal email",
    Icon: HomeIcon,
    empty: "No unread personal email.",
    url: "https://mail.google.com/mail/",
  },
  {
    id: "ou",
    label: "School email",
    Icon: BriefcaseIcon,
    empty: "No school email in the last 3 days.",
    url: "https://outlook.office.com/mail/",
  },
] as const;

export function EmailCard() {
  // One request brings back both mailboxes. The toggle only chooses which
  // of them to show, so switching is instant.
  const { state } = useApi<EmailsResponse>("/api/emails");
  const [account, setAccount] = useState<Account>("gmail");

  return (
    <Card
      title="Email"
      icon={<MailIcon className="size-4" />}
      href={ACCOUNTS.find(({ id }) => id === account)!.url}
      actions={<AccountToggle selected={account} onSelect={setAccount} />}
    >
      <EmailBody state={state} account={account} />
    </Card>
  );
}

function AccountToggle({
  selected,
  onSelect,
}: {
  selected: Account;
  onSelect: (account: Account) => void;
}) {
  return (
    <div className="flex rounded-full bg-line p-0.5">
      {ACCOUNTS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          // The icons have no visible text, so screen readers and the hover
          // tooltip get the label, and aria-pressed says which one is on.
          aria-label={label}
          aria-pressed={selected === id}
          title={label}
          onClick={() => onSelect(id)}
          className={`rounded-full p-1.5 transition-colors ${
            selected === id ? "bg-accent text-white" : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function EmailBody({ state, account }: { state: ApiState<EmailsResponse>; account: Account }) {
  if (state.status === "loading") return <CardSkeleton />;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const emails = state.data.emails.filter((email) => email.account === account);
  if (emails.length === 0) {
    return <CardMessage>{ACCOUNTS.find(({ id }) => id === account)!.empty}</CardMessage>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {emails.slice(0, MAX_SHOWN).map((email) => (
        <li key={email.id} className="min-w-0">
          <a href={email.url} target="_blank" rel="noreferrer" className="block truncate hover:underline">
            {email.subject}
          </a>
          <span className="block truncate text-xs text-muted">{email.from}</span>
        </li>
      ))}
    </ul>
  );
}
