import type { AzureArchitecture } from "@cloudarch/shared";

const CATEGORY_ORDER = [
  "Compute",
  "Storage",
  "Database",
  "Search",
  "Identity",
  "Security",
  "Management",
  "Networking",
  "Integration",
  "AI",
];

export function AzureAnalysisPanel({ azure }: { azure: AzureArchitecture }) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: azure.components.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">
          Application overview
        </p>
        <h3 className="text-base font-semibold text-foreground">{azure.applicationName}</h3>
        <p className="text-xs text-muted mt-2 leading-relaxed">{azure.summary}</p>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          {azure.industry && (
            <div>
              <span className="text-muted">Industry:</span> {azure.industry}
            </div>
          )}
          {azure.expectedUsers && (
            <div>
              <span className="text-muted">Users:</span> {azure.expectedUsers.toLocaleString()}
            </div>
          )}
          {azure.dataSensitivity && (
            <div className="col-span-2">
              <span className="text-muted">Data sensitivity:</span> {azure.dataSensitivity}
            </div>
          )}
        </div>
      </div>

      {grouped.map(({ category, items }) => (
        <div key={category} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground mb-3">{category}</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border-l-2 border-accent/40 pl-3">
                <p className="text-sm font-medium text-foreground">{item.service}</p>
                <p className="text-xs text-muted mt-0.5">{item.purpose}</p>
                <p className="text-[10px] text-muted mt-1">Pattern: {item.pattern}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
