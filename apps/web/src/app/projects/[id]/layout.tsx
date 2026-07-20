import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { getProject } from "@/lib/store/projects";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-on-surface-variant">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen blueprint-grid">
      <AppHeader projectId={id} />
      <div className="flex pt-20">
        <ProjectSidebar project={project} />
        <main className="flex-grow ml-[300px] min-h-[calc(100vh-80px)]">{children}</main>
      </div>
    </div>
  );
}
