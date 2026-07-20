import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { DeployPanel } from "@/components/deploy/DeployPanel";

export default async function DeployPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectSidebar activeProjectId={id} />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        <div className="border-b border-border bg-card px-8 py-4">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {project.name}
          </Link>
        </div>
        <div className="px-8 py-8">
          <DeployPanel
            projectName={project.name}
            generatedIac={project.architecture?.generatedIac}
          />
        </div>
      </main>
    </div>
  );
}
