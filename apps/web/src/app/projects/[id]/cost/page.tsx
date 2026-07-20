import { getProject } from "@/lib/store";
import { CostEstimator } from "@/components/cost/CostEstimator";

export default async function CostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  const costEstimate = project?.architecture?.costEstimate;

  return (
    <div className="p-panel-padding max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-headline-lg text-on-surface mb-2">Cost Estimator</h1>
        <p className="text-body-md text-on-surface-variant">
          Monthly planning estimates for AWS GovCloud. Verify with the AWS Pricing Calculator.
        </p>
      </div>

      {costEstimate ? (
        <CostEstimator projectId={id} initial={costEstimate} />
      ) : (
        <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center">
          <p className="text-on-surface-variant">
            Generate an architecture first to see cost estimates.
          </p>
        </div>
      )}
    </div>
  );
}
