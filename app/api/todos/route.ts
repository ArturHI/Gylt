import { connection } from "next/server";

import { readJsonObject } from "@/lib/request";
import { ServiceError, toErrorResponse } from "@/lib/service-error";
import { createTodo, listTodos } from "@/lib/todos";
import type { TodoResponse, TodosResponse } from "@/lib/types";

// GET /api/todos              every to-do, unfinished first
// GET /api/todos?done=false   only unfinished ones (or ?done=true)
export async function GET(request: Request) {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    const done = new URL(request.url).searchParams.get("done");
    if (done !== null && done !== "true" && done !== "false") {
      throw new ServiceError("invalid_request", '"done" should be true or false.');
    }

    const todos = await listTodos(done === null ? {} : { done: done === "true" });
    return Response.json({ todos } satisfies TodosResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading to-dos.");
  }
}

// POST /api/todos   { "title": "...", "projectId": "..." (optional) }
export async function POST(request: Request) {
  try {
    const todo = await createTodo(await readJsonObject(request));
    return Response.json({ todo } satisfies TodoResponse, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Something went wrong saving the to-do.");
  }
}
