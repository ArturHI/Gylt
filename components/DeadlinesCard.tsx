"use client";

// A Client Component, for two reasons:
//  1. It reads /api/deadlines exactly the way the iPhone app will, so the
//     API contract is exercised by the web UI from day one.
//  2. "tomorrow" depends on the viewer's clock and time zone. The server
//     (UTC on Vercel) would get that wrong around midnight.

import { useState } from "react";

import { Card, CardMessage, CardSkeleton } from "@/components/Card";
import { IconButton } from "@/components/IconButton";
import { BookIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { formatRelativeDay, isDueWithin } from "@/lib/relative-time";
import type { Deadline, DeadlinesResponse } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useElementHeight } from "@/lib/use-element-height";

const SOON_HOURS = 48;

// Each row is a fixed height (the h-9 class below is 36px) with a gap
// (gap-3.5 is 14px), which lets us work out how many rows fit in the card.
const ROW_HEIGHT = 36;
const ROW_GAP = 14;

export function DeadlinesCard() {
  const { state } = useApi<DeadlinesResponse>("/api/deadlines");
  const deadlines = state.status === "ready" ? state.data.deadlines : [];

  // The list is split into pages that each fill the card exactly, so
  // making the section taller puts more deadlines on a page.
  const [list, setList] = useState<HTMLElement | null>(null);
  const listHeight = useElementHeight(list);
  const [page, setPage] = useState(0);

  // n rows need n * ROW_HEIGHT plus (n - 1) gaps. Adding one gap to the
  // space available turns that into a simple division.
  const perPage =
    listHeight === null
      ? 0 // not measured yet: draw no rows for one frame
      : Math.max(1, Math.floor((listHeight + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));

  const pageCount = perPage === 0 ? 1 : Math.max(1, Math.ceil(deadlines.length / perPage));
  // Resizing can leave `page` past the end, so never show beyond the last one.
  const current = Math.min(page, pageCount - 1);
  const visible = deadlines.slice(current * perPage, (current + 1) * perPage);

  return (
    <Card
      title="Classes & deadlines"
      icon={<BookIcon className="size-4" />}
      actions={
        pageCount > 1 && (
          <nav aria-label="Deadline pages" className="flex items-center gap-0.5 text-xs text-muted">
            <IconButton
              label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </IconButton>
            <span className="tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <IconButton
              label="Next page"
              disabled={current === pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </IconButton>
          </nav>
        )
      }
    >
      {state.status === "loading" && <CardSkeleton />}
      {state.status === "error" && <CardMessage>{state.message}</CardMessage>}
      {state.status === "ready" && deadlines.length === 0 && (
        <CardMessage>Nothing due. Enjoy it.</CardMessage>
      )}
      {deadlines.length > 0 && (
        // `ref={setList}` hands us this element once it exists, so its
        // height can be measured.
        <div ref={setList} className="min-h-0 flex-1 overflow-hidden">
          <ul className="flex flex-col gap-3.5">
            {visible.map((deadline) => (
              <DeadlineRow key={deadline.id} deadline={deadline} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function DeadlineRow({ deadline }: { deadline: Deadline }) {
  const due = new Date(deadline.dueAt);
  const soon = isDueWithin(due, SOON_HOURS);

  return (
    <li className="flex h-9 items-baseline justify-between gap-4">
      <div className="min-w-0">
        {deadline.url ? (
          <a
            href={deadline.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate hover:underline"
          >
            {deadline.title}
          </a>
        ) : (
          <span className="block truncate">{deadline.title}</span>
        )}
        <span className="block truncate text-xs text-muted">{deadline.courseName}</span>
      </div>
      <time
        dateTime={deadline.dueAt}
        title={due.toLocaleString()}
        // Anything due soon gets a tinted pill so it stands out at a glance.
        className={`shrink-0 text-xs ${
          soon ? "rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent" : "text-muted"
        }`}
      >
        {formatRelativeDay(due)}
      </time>
    </li>
  );
}
