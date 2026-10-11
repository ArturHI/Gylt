// Everything that talks to Gmail lives in this file.
// Signing in is handled by lib/google-auth.ts.
//
// The app only holds the `gmail.metadata` permission: it can see who sent a
// message, its subject and its labels, and can never read a message body.
//
// School mail is not read from Outlook. OU mail is forwarded into Gmail,
// where a Gmail filter gives it the label below and keeps it out of the inbox.
import "server-only";

import { googleGet } from "./google-auth";
import type { EmailSummary } from "./types";

const GMAIL_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

/** The Gmail label that marks forwarded school mail. */
const SCHOOL_LABEL_NAME = "OU";

// Look at a few more than we return, since some get filtered out below.
const MESSAGES_TO_CHECK = 15;
const MAX_PER_ACCOUNT = 10;

// Reading a message in Outlook does not mark its forwarded copy as read,
// so school mail is chosen by age instead of by unread status.
const SCHOOL_MAIL_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

// Gmail sorts mail into categories. These two are rarely worth a glance.
const NOISY_LABELS = ["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL"];

const DENIED_MESSAGE =
  "Gmail access hasn't been granted yet. Enable the Gmail API, then run `npm run google:auth` again.";

// Only the fields we read. Gmail sends many more.
type GmailLabelList = { labels?: { id: string; name: string }[] };
type GmailList = { messages?: { id: string }[] };
type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  /** When Gmail received it, as milliseconds since 1970, in a string. */
  internalDate: string;
  payload?: { headers?: { name: string; value: string }[] };
};

/**
 * Mail worth a glance, newest first:
 *   - unread inbox messages, without promotions or social mail
 *   - school mail from the last three days
 */
export async function getEmailHighlights(): Promise<EmailSummary[]> {
  const schoolLabelId = await findSchoolLabelId();

  // The two mailboxes don't depend on each other, so they load together.
  const [inbox, school] = await Promise.all([
    listMessages(["INBOX", "UNREAD"]),
    schoolLabelId ? listMessages([schoolLabelId]) : [],
  ]);

  const oldestSchoolMail = Date.now() - SCHOOL_MAIL_MAX_AGE_MS;
  const schoolMail = school
    .filter((message) => Number(message.internalDate) >= oldestSchoolMail)
    .slice(0, MAX_PER_ACCOUNT);

  // A school message that is also sitting unread in the inbox would show
  // up in both lists. Keep it once, as school mail.
  const schoolIds = new Set(school.map((message) => message.id));
  const inboxMail = inbox
    .filter((message) => !schoolIds.has(message.id))
    .filter((message) => !message.labelIds?.some((label) => NOISY_LABELS.includes(label)))
    .slice(0, MAX_PER_ACCOUNT);

  return [
    ...schoolMail.map((message) => toEmailSummary(message, "ou")),
    ...inboxMail.map((message) => toEmailSummary(message, "gmail")),
  ].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/** The id of the school label, or null if that label hasn't been created. */
async function findSchoolLabelId(): Promise<string | null> {
  const { labels = [] } = await googleGet<GmailLabelList>(`${GMAIL_URL}/labels`, DENIED_MESSAGE);
  const label = labels.find(
    (candidate) => candidate.name.toLowerCase() === SCHOOL_LABEL_NAME.toLowerCase(),
  );
  return label?.id ?? null;
}

/** The newest messages that carry every one of the given labels. */
async function listMessages(labelIds: string[]): Promise<GmailMessage[]> {
  // Step 1: the list endpoint only returns ids. A parameter given more
  // than once means "has all of these labels".
  const listParams = new URLSearchParams([
    ...labelIds.map((id) => ["labelIds", id]),
    ["maxResults", String(MESSAGES_TO_CHECK)],
  ]);
  const list = await googleGet<GmailList>(`${GMAIL_URL}/messages?${listParams}`, DENIED_MESSAGE);

  // Step 2: fetch each message's headers, all at the same time.
  const detailParams = new URLSearchParams([
    ["format", "metadata"],
    ["metadataHeaders", "From"],
    ["metadataHeaders", "Subject"],
  ]);
  return Promise.all(
    (list.messages ?? []).map(({ id }) =>
      googleGet<GmailMessage>(`${GMAIL_URL}/messages/${id}?${detailParams}`, DENIED_MESSAGE),
    ),
  );
}

function toEmailSummary(message: GmailMessage, account: EmailSummary["account"]): EmailSummary {
  const header = (name: string) =>
    message.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";

  return {
    id: message.id,
    account,
    unread: message.labelIds?.includes("UNREAD") ?? false,
    ...parseSender(header("from")),
    subject: header("subject") || "(No subject)",
    receivedAt: new Date(Number(message.internalDate)).toISOString(),
    url: `https://mail.google.com/mail/#all/${message.threadId}`,
  };
}

/**
 * Splits a From header into a display name and an address.
 *
 *   "Ada Lovelace" <ada@example.com>  ->  Ada Lovelace, ada@example.com
 *   ada@example.com                   ->  ada@example.com, ada@example.com
 */
function parseSender(from: string): { from: string; fromAddress: string } {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) return { from: from.trim(), fromAddress: from.trim() };

  const name = match[1].replace(/^"(.*)"$/, "$1").trim();
  return { from: name || match[2], fromAddress: match[2] };
}
