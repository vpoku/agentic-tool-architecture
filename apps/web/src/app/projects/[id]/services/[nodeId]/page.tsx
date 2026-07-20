import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import { getServiceInsight } from "@/lib/analytics/service-insights";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  const { id, nodeId } = await params;
  const project = await getProject(id);

  if (!project?.architecture) {
    notFound();
  }

  const node = project.architecture.services.find((s) => s.id === nodeId);
  if (!node) {
    notFound();
  }

  const insight = getServiceInsight(node, project.architecture);

  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectSidebar activeProjectId={id} />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to pipeline
          </Link>

          <div className="mb-8">
            <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">
              {node.data.category}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{node.data.label}</h1>
            <p className="text-sm text-muted mt-2 leading-relaxed">{insight.role}</p>
          </div>

          {node.data.aiRecommendation && (
            <section className="rounded-xl border border-accent/30 bg-accent-muted/30 p-6 mb-6">
              <h2 className="text-sm font-semibold text-accent mb-2">AI recommendation (Bedrock + OpenSearch)</h2>
              <p className="text-sm text-foreground leading-relaxed">{node.data.aiRecommendation}</p>
              {node.data.ragSource && (
                <p className="text-xs text-muted mt-2">Knowledge source: {node.data.ragSource}</p>
              )}
            </section>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Monthly cost</p>
              <p className="text-2xl font-semibold text-foreground">
                ${insight.monthlyCostLow.toFixed(0)} – ${insight.monthlyCostHigh.toFixed(0)}
              </p>
              <p className="text-xs text-muted mt-1">GovCloud planning estimate</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">
                {insight.capacity.label}
              </p>
              <p className="text-2xl font-semibold text-foreground">{insight.capacity.value}</p>
              <p className="text-xs text-muted mt-1">{insight.capacity.detail}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recommendations</h2>
            <ul className="space-y-3">
              {insight.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground leading-relaxed">
                  <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">GovCloud notes</h2>
            <ul className="space-y-2">
              {insight.govcloudNotes.map((note) => (
                <li key={note} className="flex gap-2 text-sm text-muted">
                  <span className="text-success">✓</span>
                  {note}
                </li>
              ))}
            </ul>
          </section>

          {insight.relatedAlternatives.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Alternatives considered</h2>
              <ul className="space-y-2">
                {insight.relatedAlternatives.map((alt) => (
                  <li key={alt} className="text-sm text-muted">
                    {alt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {node.data.docsUrl && (
            <a
              href={node.data.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              AWS documentation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
