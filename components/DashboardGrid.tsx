"use client";

// The movable, resizable grid that holds the six sections.
//
// react-grid-layout does the hard parts (dragging, resizing, pushing other
// sections out of the way). This file tells it where each section starts
// and remembers your arrangement in the browser.

import { useState, useSyncExternalStore } from "react";
import { Responsive, useContainerWidth } from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { CalendarCard } from "@/components/CalendarCard";
import { DeadlinesCard } from "@/components/DeadlinesCard";
import { EmailCard } from "@/components/EmailCard";
import { SpanishCard } from "@/components/SpanishCard";
import { TodosCard } from "@/components/TodosCard";
import { WeatherCard } from "@/components/WeatherCard";

const SECTIONS = [
  { id: "deadlines", Component: DeadlinesCard },
  { id: "calendar", Component: CalendarCard },
  { id: "weather", Component: WeatherCard },
  { id: "todos", Component: TodosCard },
  { id: "email", Component: EmailCard },
  { id: "spanish", Component: SpanishCard },
];

// The grid changes shape with its own width (the page width minus the
// side padding), measured in pixels:
//   wide   (900 and up)  24 columns, three sections per row
//   medium (560 and up)  16 columns, two per row
//   narrow (phones)       1 column, stacked and fixed in place
const BREAKPOINTS = { wide: 900, medium: 560, narrow: 0 };
const COLUMNS = { wide: 24, medium: 16, narrow: 1 };
type Breakpoint = keyof typeof BREAKPOINTS;

// Sections snap to this grid as you move and resize them. Small steps make
// that feel smooth: each row adds ROW_HEIGHT + GAP = 28 pixels of height.
const ROW_HEIGHT = 12;
const GAP = 16;
const SECTION_HEIGHT = 12; // in rows
const MIN_WIDTH = 4; // in columns
const MIN_HEIGHT = 6; // in rows

/** Sections in order, `perRow` to a row, each `width` columns wide. */
function tile(width: number, perRow: number): Layout {
  return SECTIONS.map(({ id }, index) => ({
    i: id,
    x: (index % perRow) * width,
    y: Math.floor(index / perRow) * SECTION_HEIGHT,
    w: width,
    h: SECTION_HEIGHT,
    minW: Math.min(MIN_WIDTH, width),
    minH: MIN_HEIGHT,
  }));
}

const DEFAULT_LAYOUTS: ResponsiveLayouts<Breakpoint> = {
  wide: tile(8, 3),
  medium: tile(8, 2),
  narrow: tile(1, 1),
};

// The key carries a version because positions are counted in grid units.
// When the grid itself changes, old numbers no longer mean the same thing.
const STORAGE_KEY = "gylt.layouts.v2";
const OLD_STORAGE_KEY = "gylt.layouts.v1";

function loadLayouts(): ResponsiveLayouts<Breakpoint> {
  // This also runs on the server while Next.js prepares the page, where
  // there is no browser storage to read.
  if (typeof window === "undefined") return DEFAULT_LAYOUTS;

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (isComplete(saved)) return saved;

    const old = JSON.parse(window.localStorage.getItem(OLD_STORAGE_KEY) ?? "null");
    return isComplete(old) ? fromHalfResolutionGrid(old) : DEFAULT_LAYOUTS;
  } catch {
    // Storage can be blocked or hold something unreadable. Start fresh.
    return DEFAULT_LAYOUTS;
  }
}

/** True when a saved arrangement places every section at every page width. */
function isComplete(saved: unknown): saved is ResponsiveLayouts<Breakpoint> {
  if (typeof saved !== "object" || saved === null) return false;

  return Object.keys(BREAKPOINTS).every((breakpoint) => {
    const layout = (saved as Record<string, unknown>)[breakpoint];
    return (
      Array.isArray(layout) &&
      SECTIONS.every(({ id }) => layout.some((item) => item?.i === id))
    );
  });
}

/**
 * Converts an arrangement saved on the first grid, which had half as many
 * columns and rows twice as tall. Doubling every number puts each section
 * exactly where it was. Phones have a single column, so only the vertical
 * numbers double there.
 */
function fromHalfResolutionGrid(
  old: ResponsiveLayouts<Breakpoint>,
): ResponsiveLayouts<Breakpoint> {
  const convert = (layout: Layout, singleColumn: boolean): Layout =>
    layout.map((item) => ({
      i: item.i,
      x: singleColumn ? 0 : item.x * 2,
      y: item.y * 2,
      w: singleColumn ? 1 : item.w * 2,
      h: item.h * 2,
      minW: singleColumn ? 1 : MIN_WIDTH,
      minH: MIN_HEIGHT,
    }));

  return {
    wide: convert(old.wide!, false),
    medium: convert(old.medium!, false),
    narrow: convert(old.narrow!, true),
  };
}

function saveLayouts(layouts: ResponsiveLayouts<Breakpoint>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // Not being able to save only means the arrangement resets next visit.
  }
}

/**
 * False while Next.js renders the page on the server and during the first
 * pass in the browser, true from then on.
 *
 * The server cannot know your saved arrangement. If it drew the default
 * one, the browser would then disagree with the HTML it was sent, which
 * React reports as an error. So the grid waits until this is true.
 */
function useIsBrowser(): boolean {
  return useSyncExternalStore(
    () => () => {}, // nothing to subscribe to: the answer never changes back
    () => true, // in the browser
    () => false, // on the server
  );
}

export function DashboardGrid() {
  const isBrowser = useIsBrowser();
  // The grid positions sections in pixels, so it has to know how wide it is.
  const { width, containerRef, mounted } = useContainerWidth();
  const [layouts, setLayouts] = useState(loadLayouts);
  // Changing a component's `key` makes React discard it and build a new
  // one. Reset uses that to start the grid over from the default layout.
  const [gridKey, setGridKey] = useState(0);

  // Moving and resizing need a mouse-sized screen. On a phone the sections
  // stay stacked, which also keeps scrolling from dragging them around.
  const editable = width >= BREAKPOINTS.medium;

  function handleLayoutChange(_current: Layout, all: ResponsiveLayouts<Breakpoint>) {
    setLayouts(all);
    saveLayouts(all);
  }

  function resetLayouts() {
    setLayouts(DEFAULT_LAYOUTS);
    saveLayouts(DEFAULT_LAYOUTS);
    // Handing the running grid a new layout is unreliable: it can report
    // its old arrangement back at the same moment and undo the reset.
    setGridKey((key) => key + 1);
  }

  return (
    <>
      <header className="flex items-baseline justify-between">
        <h1 className="text-base font-medium">Dashboard</h1>
        {editable && (
          <button
            type="button"
            onClick={resetLayouts}
            className="text-xs text-muted transition-colors hover:text-ink"
          >
            Reset layout
          </button>
        )}
      </header>

      <div ref={containerRef} className="mt-8">
        {isBrowser && mounted && (
          <Responsive
            key={gridKey}
            width={width}
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLUMNS}
            rowHeight={ROW_HEIGHT}
            margin={[GAP, GAP]}
            containerPadding={[0, 0]}
            dragConfig={{ enabled: editable, handle: ".card-handle" }}
            resizeConfig={{ enabled: editable }}
            onLayoutChange={handleLayoutChange}
          >
            {SECTIONS.map(({ id, Component }) => (
              <div key={id}>
                <Component />
              </div>
            ))}
          </Responsive>
        )}
      </div>
    </>
  );
}
