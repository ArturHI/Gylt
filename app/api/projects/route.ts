import { connection } from "next/server";

import { readJsonObject } from "@/lib/request";
import { toErrorResponse } from "@/lib/service-error";
import { createProject, listProjects } from "@/lib/todos";
import type { ProjectResponse, ProjectsResponse } from "@/lib/types";

// GET /api/projects
export async function GET() {
  // Run on every request, never prerendered. See /api/deadlines.
  await connection();

  try {
    const projects = await listProjects();
    return Response.json({ projects } satisfies ProjectsResponse);
  } catch (error) {
    return toErrorResponse(error, "Something went wrong loading projects.");
  }
}

// POST /api/projects   { "name": "..." }
export async function POST(request: Request) {
  try {
    const project = await createProject(await readJsonObject(request));
    // 201 Created is the conventional status for "a new thing now exists".
    return Response.json({ project } satisfies ProjectResponse, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Something went wrong saving the project.");
  }
}
