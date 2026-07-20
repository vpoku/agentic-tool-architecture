import { NextResponse } from "next/server";
import { createProject } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const description = String(body.description ?? "");
  const name =
    body.name ??
    (description.slice(0, 60) + (description.length > 60 ? "..." : "") ||
      "New Project");

  const project = await createProject({
    name,
    description,
    complianceLevel: body.complianceLevel ?? "FedRAMP High",
  });

  return NextResponse.json({
    projectId: project.projectId,
    project,
  });
}
