import { readJsonObject } from "@/lib/request";
import { toErrorResponse } from "@/lib/service-error";
import { deleteProject, renameProject } from "@/lib/todos";
import type { ProjectResponse } from "@/lib/types";

// The [id] folder name makes the last part of the URL available as params.id.

// PATCH /api/projects/:id   { "name": "..." }
export async function PATCH(request: Request, context: RouteContext<"/api/projects/[id]">) {
  try {
    const { id } = await context.params;
    const project = await renameProject(id, await readJsonObject(request));
    return Response.json({ project } satisfies ProjectResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong saving the project.");
  }
}

// DELETE /api/projects/:id
// The project's to-dos are kept and become loose to-dos.
export async function DELETE(_request: Request, context: RouteContext<"/api/projects/[id]">) {
  try {
    const { id } = await context.params;
    await deleteProject(id);
    // 204 No Content: it worked and there is nothing to send back.
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Something went wrong deleting the project.");
  }
}
