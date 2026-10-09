"use client";

import { useEffect, useState } from "react";

import type { ApiErrorResponse } from "./types";

export type ApiState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

/**
 * Loads one of our own API routes once, when the component first appears.
 * Every card goes through this, so they all load and fail the same way.
 */
export function useApi<T extends object>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(path);
        const body: T | ApiErrorResponse = await response.json();
        if (cancelled) return;

        if ("error" in body) {
          setState({ status: "error", message: body.error.message });
        } else {
          setState({ status: "ready", data: body });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Couldn't load this right now." });
        }
      }
    }

    load();
    // If the card unmounts mid-request, skip the state update.
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
