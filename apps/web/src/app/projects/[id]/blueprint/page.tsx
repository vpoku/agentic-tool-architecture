import { getProject } from "@/lib/store";
import { ArchitectureCanvas } from "@/components/blueprint/ArchitectureCanvas";

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <ArchitectureCanvas
      projectId={id}
      architecture={project?.architecture}
    />
  );
}
