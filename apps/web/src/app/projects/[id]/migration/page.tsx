import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { MigrationCanvasBuilder } from "@/components/migration/MigrationCanvasBuilder";

export default async function MigrationProjectPage({
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

  if (project.projectType !== "migration") {
    notFound();
  }

  return (
    <AppShell activeProjectId={id}>
      <MigrationCanvasBuilder project={project} bootstrapMessage={q} />
    </AppShell>
  );
}
