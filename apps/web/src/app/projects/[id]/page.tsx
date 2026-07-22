import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { CanvasBuilder } from "@/components/canvas/CanvasBuilder";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  if (project.projectType === "migration") {
    notFound();
  }

  return (
    <AppShell activeProjectId={id}>
      <CanvasBuilder project={project} bootstrapMessage={q} />
    </AppShell>
  );
}
