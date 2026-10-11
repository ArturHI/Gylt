import { readJsonObject } from "@/lib/request";
import { toErrorResponse } from "@/lib/service-error";
import { deleteTodo, updateTodo } from "@/lib/todos";
import type { TodoResponse } from "@/lib/types";

// PATCH /api/todos/:id   any of { "title": "...", "done": true, "projectId": "..." | null }
export async function PATCH(request: Request, context: RouteContext<"/api/todos/[id]">) {
  try {
    const { id } = await context.params;
    const todo = await updateTodo(id, await readJsonObject(request));
    return Response.json({ todo } satisfies TodoResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong saving the to-do.");
  }
}

// DELETE /api/todos/:id
export async function DELETE(_request: Request, context: RouteContext<"/api/todos/[id]">) {
  try {
    const { id } = await context.params;
    await deleteTodo(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Something went wrong deleting the to-do.");
  }
}
