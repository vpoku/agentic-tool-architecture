import {
  mapAzureService,
  type AzureArchitecture,
  type MigrationPlan,
  type ServiceMapping,
} from "@cloudarch/shared";

export function planMigration(
  azure: AzureArchitecture,
  ragContext?: string
): { mappings: ServiceMapping[]; draftPlan: MigrationPlan } {
  const mappings: ServiceMapping[] = azure.components.map((comp) => {
    const table = mapAzureService({
      id: comp.id,
      name: comp.service,
      aliases: [],
      category: comp.category,
      pattern: comp.pattern,
      description: comp.purpose,
    });
    return {
      id: comp.id,
      azureService: comp.service,
      azurePurpose: comp.purpose,
      awsService: table.awsService,
      awsGovCloudEquivalent: table.awsGovCloudEquivalent,
      reason: table.defaultReason,
      migrationConsiderations: table.migrationConsiderations,
      confidence: "high" as const,
    };
  });

  const phases = groupPhases(mappings);

  let summary = `Phased migration of ${azure.applicationName} from Azure to AWS GovCloud across ${phases.length} phases.`;
  if (ragContext?.trim()) {
    summary += ` Guidance informed by GovCloud migration best practices.`;
  }

  return {
    mappings,
    draftPlan: {
      summary,
      phases,
    },
  };
}

function groupPhases(mappings: ServiceMapping[]) {
  const storage = mappings.filter((m) =>
    m.azureService.toLowerCase().includes("blob") || m.azureService.toLowerCase().includes("storage")
  );
  const compute = mappings.filter((m) =>
    m.azureService.toLowerCase().includes("function") ||
    m.azureService.toLowerCase().includes("kubernetes")
  );
  const data = mappings.filter((m) =>
    m.azureService.toLowerCase().includes("sql") ||
    m.azureService.toLowerCase().includes("cosmos") ||
    m.azureService.toLowerCase().includes("search")
  );
  const identity = mappings.filter((m) =>
    m.azureService.toLowerCase().includes("active directory") ||
    m.azureService.toLowerCase().includes("directory")
  );
  const remaining = mappings.filter(
    (m) => ![...storage, ...compute, ...data, ...identity].includes(m)
  );

  const phases = [];
  let phaseNum = 1;

  if (storage.length) {
    phases.push({
      id: `phase-${phaseNum++}`,
      title: `Phase ${phases.length + 1}: Move storage to Amazon S3`,
      description: "Migrate object storage first — lowest coupling, enables parallel data sync.",
      tasks: storage.flatMap((m) => [
        `Create S3 buckets for ${m.azureService} workloads`,
        ...m.migrationConsiderations.slice(0, 2),
      ]),
      risks: ["Data transfer bandwidth and downtime during cutover"],
    });
  }

  if (compute.length) {
    phases.push({
      id: `phase-${phaseNum++}`,
      title: `Phase ${phases.length + 1}: Move compute to AWS Lambda / EKS`,
      description: "Rewrite serverless functions and container workloads for AWS.",
      tasks: compute.flatMap((m) => [
        `Migrate ${m.azureService} → ${m.awsService}`,
        "Configure triggers and IAM execution roles",
        "Run integration tests in GovCloud sandbox",
      ]),
      risks: ["Runtime differences between Azure and AWS SDKs"],
    });
  }

  if (data.length) {
    phases.push({
      id: `phase-${phaseNum++}`,
      title: `Phase ${phases.length + 1}: Migrate databases and search`,
      description: "Move relational, NoSQL, and search indexes with validation.",
      tasks: data.flatMap((m) => [
        `Plan ${m.azureService} → ${m.awsService} migration`,
        ...m.migrationConsiderations.slice(0, 2),
      ]),
      dependencies: storage.length ? ["Phase 1 storage migration complete"] : undefined,
    });
  }

  if (identity.length) {
    phases.push({
      id: `phase-${phaseNum++}`,
      title: `Phase ${phases.length + 1}: Replace Azure AD with IAM Identity Center`,
      description: "Centralize identity management for GovCloud access.",
      tasks: [
        "Export user and group mappings from Azure AD",
        "Configure IAM Identity Center with MFA",
        "Set up Cognito for application user pools if needed",
        "Test SSO and role-based access",
      ],
      risks: ["Authentication cutover requires coordinated user communication"],
    });
  }

  if (remaining.length) {
    phases.push({
      id: `phase-${phaseNum++}`,
      title: `Phase ${phases.length + 1}: Observability and security services`,
      description: "Migrate monitoring, secrets, and remaining supporting services.",
      tasks: remaining.flatMap((m) => [
        `Migrate ${m.azureService} → ${m.awsService}`,
        ...m.migrationConsiderations.slice(0, 1),
      ]),
    });
  }

  if (phases.length === 0) {
    phases.push({
      id: "phase-1",
      title: "Phase 1: Assessment and pilot",
      description: "Begin with a non-production pilot migration.",
      tasks: ["Validate GovCloud account structure", "Run MAP assessment workshop"],
    });
  }

  return phases;
}
