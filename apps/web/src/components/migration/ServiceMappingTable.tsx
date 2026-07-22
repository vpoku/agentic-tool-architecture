import type { ServiceMapping } from "@cloudarch/shared";

export function ServiceMappingTable({ mappings }: { mappings: ServiceMapping[] }) {
  return (
    <div className="p-4 space-y-3">
      {mappings.map((m) => (
        <div key={m.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-xs text-muted">Azure</p>
              <p className="text-sm font-semibold text-foreground">{m.azureService}</p>
            </div>
            <span className="text-accent text-lg">→</span>
            <div className="text-right">
              <p className="text-xs text-muted">AWS GovCloud</p>
              <p className="text-sm font-semibold text-accent">{m.awsGovCloudEquivalent}</p>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-2">{m.reason}</p>
          <p className="text-[10px] font-bold text-muted uppercase mb-1">Migration considerations</p>
          <ul className="space-y-1">
            {m.migrationConsiderations.map((c, i) => (
              <li key={i} className="text-xs text-foreground">
                · {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
