"use client";

// Deliberately plain: a read-only list that proves the API works.
// Adding, checking off and grouping by project wait for the redesign.

import { Card, CardMessage } from "@/components/Card";
import type { TodosResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

const MAX_SHOWN = 5;

export function TodosCard() {
  const state = useApi<TodosResponse>("/api/todos?done=false");

  return (
    <Card title="Projects & to-dos">
      <TodosBody state={state} />
    </Card>
  );
}

function TodosBody({ state }: { state: ApiState<TodosResponse> }) {
  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { todos } = state.data;
  if (todos.length === 0) return <CardMessage>No to-dos yet.</CardMessage>;

  return (
    <ul className="flex flex-col gap-2">
      {todos.slice(0, MAX_SHOWN).map((todo) => (
        <li key={todo.id} className="truncate">
          {todo.title}
        </li>
      ))}
      {todos.length > MAX_SHOWN && (
        <li className="text-xs text-muted">and {todos.length - MAX_SHOWN} more</li>
      )}
    </ul>
  );
}
