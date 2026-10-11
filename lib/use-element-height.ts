"use client";

import { useEffect, useState } from "react";

/**
 * The current height of an element in pixels, kept up to date as it
 * changes size. It is null until the element exists and has been measured.
 *
 * Pass the element itself, which you get by giving a component
 * `ref={setElement}` where `setElement` comes from useState. Unlike a
 * useRef, that re-runs this hook when the element first appears.
 */
export function useElementHeight(element: HTMLElement | null): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!element) return;

    // A ResizeObserver calls back whenever the element's size changes,
    // for example while its dashboard section is being resized.
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return height;
}
