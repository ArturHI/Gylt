"use client";

import { useState } from "react";

import { BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/button-styles";
import { Card, CardMessage } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { PlusIcon } from "@/components/icons";
import type { ApiErrorResponse, Todo, TodoResponse, TodosResponse } from "@/lib/types";
import { type ApiState, useApi } from "@/lib/use-api";

// These match the limits the API enforces.
const MAX_TITLE_LENGTH = 200;
const MAX_NOTE_LENGTH = 2000;

/** Which dialog is showing, if any. */
type OpenDialog = { kind: "add" } | { kind: "view"; todo: Todo } | null;

/**
 * Sends a change to the to-dos API. Returns nothing when it worked, or a
 * message to show the user when it didn't.
 */
async function sendTodo(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    // A successful delete answers 204 "No Content": there is no JSON to read.
    if (response.status === 204) return null;

    const result: TodoResponse | ApiErrorResponse = await response.json();
    return "error" in result ? result.error.message : null;
  } catch {
    return "Couldn't save that. Try again.";
  }
}

export function TodosCard() {
  const { state, reload } = useApi<TodosResponse>("/api/todos?done=false");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = () => setDialog(null);

  // Both dialogs finish the same way: show the fresh list, then close.
  const reloadAndClose = () => {
    reload();
    close();
  };

  return (
    <Card
      title="Projects & to-dos"
      cornerAction={
        <button
          type="button"
          aria-label="Add a to-do"
          title="Add a to-do"
          onClick={() => setDialog({ kind: "add" })}
          className="flex size-8 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="size-4" />
        </button>
      }
    >
      <TodosBody
        state={state}
        onOpen={(todo) => setDialog({ kind: "view", todo })}
        onChanged={reload}
      />

      <Dialog open={dialog?.kind === "add"} onClose={close} title="New to-do">
        <AddTodoForm onCancel={close} onSaved={reloadAndClose} />
      </Dialog>

      <Dialog open={dialog?.kind === "view"} onClose={close} title="To-do">
        {dialog?.kind === "view" && (
          <TodoDetails todo={dialog.todo} onClose={close} onSaved={reloadAndClose} />
        )}
      </Dialog>
    </Card>
  );
}

function TodosBody({
  state,
  onOpen,
  onChanged,
}: {
  state: ApiState<TodosResponse>;
  onOpen: (todo: Todo) => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  // Ids being saved right now, so their checkboxes can't be clicked twice.
  const [saving, setSaving] = useState<string[]>([]);

  if (state.status === "loading") return <CardMessage>Loading…</CardMessage>;
  if (state.status === "error") return <CardMessage>{state.message}</CardMessage>;

  const { todos } = state.data;
  if (todos.length === 0) return <CardMessage>No to-dos yet.</CardMessage>;

  async function markDone(todo: Todo) {
    setSaving((ids) => [...ids, todo.id]);
    setError(await sendTodo("PATCH", `/api/todos/${todo.id}`, { done: true }));
    // The list only holds unfinished to-dos, so reloading removes this one.
    onChanged();
    setSaving((ids) => ids.filter((id) => id !== todo.id));
  }

  return (
    // The bottom padding keeps the last to-do clear of the add button.
    <ul className="flex flex-col gap-2 pb-10">
      {error && <li className="text-xs text-accent">{error}</li>}
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-center gap-2.5">
          <input
            type="checkbox"
            // Each box needs its own name for screen readers.
            aria-label={`Mark done: ${todo.title}`}
            checked={saving.includes(todo.id)}
            disabled={saving.includes(todo.id)}
            onChange={() => markDone(todo)}
            className="size-3.5 shrink-0 cursor-pointer accent-accent"
          />
          {/* One line only. `truncate` cuts the rest off with "…", and
              clicking shows the whole thing. */}
          <button
            type="button"
            onClick={() => onOpen(todo)}
            className="min-w-0 flex-1 truncate text-left hover:text-accent"
          >
            {todo.title}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The optional note box, shared by the "new" and "details" dialogs. */
function NoteField({ value, onChange }: { value: string; onChange: (note: string) => void }) {
  return (
    <label className="mt-5 block">
      <span className="text-xs text-muted">Note (optional)</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_NOTE_LENGTH}
        rows={4}
        placeholder="Add a note…"
        className="mt-1.5 block w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 leading-relaxed outline-none placeholder:text-muted focus:border-accent"
      />
    </label>
  );
}

function AddTodoForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    // Without this the browser would reload the page to submit the form.
    event.preventDefault();
    setSaving(true);

    const problem = await sendTodo("POST", "/api/todos", { title, note });
    if (problem) {
      setError(problem);
      setSaving(false);
    } else {
      onSaved();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="What needs doing?"
        aria-label="To-do"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none placeholder:text-muted focus:border-accent"
      />
      <NoteField value={note} onChange={setNote} />
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BUTTON_SECONDARY}>
          Cancel
        </button>
        <button type="submit" disabled={saving || title.trim() === ""} className={BUTTON_PRIMARY}>
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}

/** The full text of one to-do, with a note you can add or change. */
function TodoDetails({
  todo,
  onClose,
  onSaved,
}: {
  todo: Todo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const savedNote = todo.note ?? "";
  const [note, setNote] = useState(savedNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  /** Runs a change, then closes the dialog, or shows what went wrong. */
  async function run(change: Promise<string | null>) {
    setSaving(true);
    const problem = await change;
    if (problem) {
      setError(problem);
      setSaving(false);
    } else {
      onSaved();
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run(sendTodo("PATCH", `/api/todos/${todo.id}`, { note }));
  }

  // Deleting cannot be undone, so it gets its own confirmation step with
  // the wording people know from other apps.
  if (confirmingDelete) {
    return (
      <div>
        <p className="truncate text-muted">{todo.title}</p>
        <p className="mt-5 font-medium">Delete this to-do?</p>
        <p className="mt-1 text-xs text-muted">This action cannot be undone.</p>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={saving}
            className={BUTTON_SECONDARY}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => run(sendTodo("DELETE", `/api/todos/${todo.id}`))}
            disabled={saving}
            className={BUTTON_DANGER}
          >
            {saving ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* The full text: long lines wrap, and line breaks are kept. */}
      <p className="whitespace-pre-wrap break-words leading-relaxed">{todo.title}</p>

      <NoteField value={note} onChange={setNote} />
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        {/* mr-auto pushes this to the left, away from the other buttons. */}
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={saving}
          className={`${BUTTON_SECONDARY} mr-auto hover:border-danger hover:text-danger`}
        >
          Delete
        </button>
        <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
          Close
        </button>
        <button
          type="submit"
          // Nothing to save until the note differs from what is stored.
          disabled={saving || note.trim() === savedNote}
          className={BUTTON_PRIMARY}
        >
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}
