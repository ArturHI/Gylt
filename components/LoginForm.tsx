"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiErrorResponse } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body: { ok: true } | ApiErrorResponse = await response.json();

      if ("error" in body) {
        setError(body.error.message);
        setChecking(false);
        return;
      }
      // The cookie is set now, so the dashboard will let us in. `replace`
      // keeps the login page out of the Back button's history.
      router.replace("/");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs">
      <h1 className="text-base font-medium">Dashboard</h1>
      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        aria-label="Password"
        className="mt-6 w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none placeholder:text-muted focus:border-accent"
      />
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      <button
        type="submit"
        disabled={checking || password === ""}
        className="mt-4 w-full rounded-full bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {checking ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
