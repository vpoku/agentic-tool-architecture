"use client";

const HEALTHCARE_EXAMPLE = `Application: Patient document portal (healthcare)
Current Azure stack:
- Azure Blob Storage — document files (~2 TB)
- Azure Functions — upload validation and virus scan
- Azure Cognitive Search — full-text search
- Azure SQL Database — metadata (~500 GB)
- Azure AD (Entra ID) — SSO for 10,000 employees

Non-functional requirements:
- FedRAMP Moderate, PHI/PII
- 99.9% availability, RPO 1h / RTO 4h
- ~50k document uploads/day peak

What we want: learn the AWS GovCloud equivalent and a phased migration plan.`;

const WEB_APP_EXAMPLE = `Application: Internal HR portal
Current Azure stack:
- Azure App Service — web frontend
- Azure SQL Database — employee records
- Azure Key Vault — secrets
- Azure AD — authentication for 2,000 staff

Requirements:
- FedRAMP High
- Must migrate to AWS GovCloud with minimal downtime`;

export const MIGRATION_EXAMPLES = [
  { label: "Healthcare document portal", text: HEALTHCARE_EXAMPLE },
  { label: "Internal web app", text: WEB_APP_EXAMPLE },
];

const PLACEHOLDER = `Describe your Azure architecture in plain English. Include:
• App purpose and number of users
• Current Azure services (with rough scale, e.g. storage GB)
• Compliance / data sensitivity (FedRAMP, HIPAA, etc.)
• Availability or scale needs (RTO/RPO, requests/day)
• Migration goal (lift-and-shift vs re-architect)`;

interface AzureIntakeFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  compact?: boolean;
}

export function AzureIntakeForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  compact = false,
}: AzureIntakeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && compact) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
        rows={compact ? 10 : 14}
        placeholder={PLACEHOLDER}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />

      <div className="flex flex-wrap gap-2">
        {MIGRATION_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onChange(ex.text)}
            className="text-xs text-muted border border-border rounded-full px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium py-3 rounded-lg transition-colors"
      >
        {loading ? "Starting analysis…" : "Analyze Azure architecture"}
      </button>
    </form>
  );
}
