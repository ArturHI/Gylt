// Projects and to-dos: the rules for what can be saved, and the
// translation between database rows and the shapes our API returns.
import "server-only";

import { isUuid } from "./request";
import { ServiceError } from "./service-error";
import { supabaseRequest } from "./supabase";
import type { Project, Todo } from "./types";

const MAX_TEXT_LENGTH = 200;
const MAX_NOTE_LENGTH = 2000;

// Rows as the database stores them: snake_case column names.
type ProjectRow = { id: string; name: string; created_at: string };
type TodoRow = {
  id: string;
  title: string;
  // Missing on a database that hasn't run supabase/add-todo-notes.sql yet.
  note?: string | null;
  done: boolean;
  project_id: string | null;
  created_at: string;
  completed_at: string | null;
};

/** The body of a request, before any of it has been checked. */
type Input = Record<string, unknown>;

function toProject(row: ProjectRow): Project {
  return { id: row.id, name: row.name, createdAt: new Date(row.created_at).toISOString() };
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    note: row.note ?? null,
    done: row.done,
    projectId: row.project_id,
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

// --- Checking input -------------------------------------------------------

function readText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ServiceError("invalid_request", `"${field}" is required and should be text.`);
  }
  const text = value.trim();
  if (text.length > MAX_TEXT_LENGTH) {
    throw new ServiceError(
      "invalid_request",
      `"${field}" should be ${MAX_TEXT_LENGTH} characters or fewer.`,
    );
  }
  return text;
}

/** A note is optional: null or blank text both mean "no note". */
function readNote(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ServiceError("invalid_request", '"note" should be text or null.');
  }
  const note = value.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    throw new ServiceError(
      "invalid_request",
      `"note" should be ${MAX_NOTE_LENGTH} characters or fewer.`,
    );
  }
  return note === "" ? null : note;
}

function readProjectId(value: unknown): string | null {
  if (value === null) return null;
  if (!isUuid(value)) {
    throw new ServiceError("invalid_request", '"projectId" should be a project id or null.');
  }
  return value;
}

/**
 * Ids arrive in the URL. Anything that isn't shaped like one cannot match
 * a row, and checking here also keeps odd characters out of the query we
 * send to Supabase.
 */
function requireId(id: string, what: string): string {
  if (!isUuid(id)) throw notFound(what);
  return id;
}

function notFound(what: string): ServiceError {
  return new ServiceError("not_found", `There's no ${what} with that id.`);
}

// --- Projects -------------------------------------------------------------

export async function listProjects(): Promise<Project[]> {
  const rows = await supabaseRequest<ProjectRow>("projects", {
    query: { select: "*", order: "created_at.asc" },
  });
  return rows.map(toProject);
}

export async function createProject(input: Input): Promise<Project> {
  const [row] = await supabaseRequest<ProjectRow>("projects", {
    method: "POST",
    body: { name: readText(input.name, "name") },
  });
  return toProject(row);
}

export async function renameProject(id: string, input: Input): Promise<Project> {
  const rows = await supabaseRequest<ProjectRow>("projects", {
    method: "PATCH",
    query: { id: `eq.${requireId(id, "project")}` },
    body: { name: readText(input.name, "name") },
  });
  // An update that matched no rows succeeds with an empty list.
  if (rows.length === 0) throw notFound("project");
  return toProject(rows[0]);
}

/** Deletes a project. Its to-dos are kept and become loose to-dos. */
export async function deleteProject(id: string): Promise<void> {
  const rows = await supabaseRequest<ProjectRow>("projects", {
    method: "DELETE",
    query: { id: `eq.${requireId(id, "project")}` },
  });
  if (rows.length === 0) throw notFound("project");
}

// --- To-dos ---------------------------------------------------------------

/** All to-dos, unfinished first, oldest first. Pass `done` to see only one kind. */
export async function listTodos(filter: { done?: boolean } = {}): Promise<Todo[]> {
  const query: Record<string, string> = { select: "*", order: "done.asc,created_at.asc" };
  if (filter.done !== undefined) query.done = `eq.${filter.done}`;

  const rows = await supabaseRequest<TodoRow>("todos", { query });
  return rows.map(toTodo);
}

export async function createTodo(input: Input): Promise<Todo> {
  const note = input.note === undefined ? null : readNote(input.note);

  const [row] = await supabaseRequest<TodoRow>("todos", {
    method: "POST",
    body: {
      title: readText(input.title, "title"),
      // "projectId" is optional; leaving it out means a loose to-do.
      project_id: input.projectId === undefined ? null : readProjectId(input.projectId),
      // Only mention the note column when there is a note to store.
      ...(note === null ? {} : { note }),
    },
  });
  return toTodo(row);
}

/** Changes any of title, note, done and projectId. Fields left out stay as they are. */
export async function updateTodo(id: string, input: Input): Promise<Todo> {
  const changes: Partial<TodoRow> = {};

  if (input.title !== undefined) changes.title = readText(input.title, "title");
  if (input.note !== undefined) changes.note = readNote(input.note);
  if (input.projectId !== undefined) changes.project_id = readProjectId(input.projectId);
  if (input.done !== undefined) {
    if (typeof input.done !== "boolean") {
      throw new ServiceError("invalid_request", '"done" should be true or false.');
    }
    changes.done = input.done;
    // Record when it was finished, and clear that if it is reopened.
    changes.completed_at = input.done ? new Date().toISOString() : null;
  }

  if (Object.keys(changes).length === 0) {
    throw new ServiceError("invalid_request", 'Send at least one of "title", "note", "done" or "projectId".');
  }

  const rows = await supabaseRequest<TodoRow>("todos", {
    method: "PATCH",
    query: { id: `eq.${requireId(id, "to-do")}` },
    body: changes,
  });
  if (rows.length === 0) throw notFound("to-do");
  return toTodo(rows[0]);
}

export async function deleteTodo(id: string): Promise<void> {
  const rows = await supabaseRequest<TodoRow>("todos", {
    method: "DELETE",
    query: { id: `eq.${requireId(id, "to-do")}` },
  });
  if (rows.length === 0) throw notFound("to-do");
}
