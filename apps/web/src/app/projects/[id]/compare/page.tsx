import { getProject } from "@/lib/store";
import { ServiceComparisonView } from "@/components/compare/ServiceComparisonView";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  const alternatives = project?.architecture?.alternatives ?? [];
  const tradeoffs = project?.architecture?.tradeoffs ?? [];

  return (
    <div className="p-panel-padding">
      <div className="mb-8">
        <h1 className="font-display text-headline-lg text-on-surface mb-2">
          Service Deep-Dive
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Compare AWS GovCloud services and understand tradeoffs for your workload.
        </p>
      </div>

      {alternatives.length === 0 && tradeoffs.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center">
          <p className="text-on-surface-variant">
            Generate an architecture first to see service comparisons.
          </p>
        </div>
      ) : (
        <ServiceComparisonView alternatives={alternatives} tradeoffs={tradeoffs} />
      )}
    </div>
  );
}
