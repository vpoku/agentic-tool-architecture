import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { ProjectWorkspace } from "@/components/workspace/ProjectWorkspace";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectSidebar activeProjectId={id} />
      <div className="flex-1 min-w-0 flex flex-col">
        <ProjectWorkspace project={project} bootstrapMessage={q} />
      </div>
    </div>
  );
}
