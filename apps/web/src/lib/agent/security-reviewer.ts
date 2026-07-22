import {
  checkCompliance,
  type ArchitectureProposal,
  type SecurityReview,
  type ServiceMapping,
} from "@cloudarch/shared";

export function reviewSecurity(
  architecture: ArchitectureProposal,
  mappings: ServiceMapping[]
): SecurityReview {
  const flags = architecture.compliance.flags;
  const services = architecture.services.map((s) => s.data.service);
  const findings: SecurityReview["findings"] = [];

  const hasKms = services.some((s) => s.includes("KMS"));
  const hasCloudWatch = services.some((s) => s.includes("CloudWatch"));
  const hasCognito = services.some(
    (s) => s.includes("Cognito") || s.includes("Identity Center")
  );
  const hasVpc = services.some((s) => s.includes("VPC"));
  const hasAadMapping = mappings.some((m) =>
    m.azureService.toLowerCase().includes("active directory")
  );

  if (hasKms) {
    findings.push({
      id: "sec-kms",
      domain: "data",
      severity: "good",
      title: "Encryption at rest configured",
      description: "AWS KMS is included for FIPS 140-2 validated encryption of data at rest.",
    });
  } else {
    findings.push({
      id: "sec-kms-missing",
      domain: "data",
      severity: "attention",
      title: "Enable KMS encryption",
      description: "No KMS service detected. Add KMS CMKs for S3, RDS, and other data stores.",
      recommendation: "Create customer-managed KMS keys with strict key policies.",
    });
  }

  if (hasCloudWatch) {
    findings.push({
      id: "sec-logs",
      domain: "logging",
      severity: "good",
      title: "Audit logging in place",
      description: "CloudWatch provides operational logs required for FedRAMP audit trails.",
    });
  } else {
    findings.push({
      id: "sec-logs-missing",
      domain: "logging",
      severity: "attention",
      title: "Add CloudWatch and CloudTrail",
      description: "Enable centralized logging for all API calls and application events.",
      recommendation: "Configure CloudTrail in all GovCloud regions with log file validation.",
    });
  }

  if (hasAadMapping && !hasCognito) {
    findings.push({
      id: "sec-identity",
      domain: "identity",
      severity: "attention",
      title: "Authentication migration required",
      description: "Azure AD should be replaced with IAM Identity Center or Amazon Cognito.",
      recommendation: "Implement centralized identity management with MFA for all users.",
    });
  } else if (hasCognito || hasAadMapping) {
    findings.push({
      id: "sec-identity-good",
      domain: "identity",
      severity: "good",
      title: "Identity service mapped",
      description: "Workforce or application identity is addressed in the target architecture.",
    });
  }

  findings.push({
    id: "sec-iam",
    domain: "identity",
    severity: "attention",
    title: "Apply least-privilege IAM",
    description: "Review all Lambda execution roles, S3 bucket policies, and RDS security groups.",
    recommendation: "Use IAM Access Analyzer and permission boundaries for production roles.",
  });

  if (!hasVpc) {
    findings.push({
      id: "sec-vpc",
      domain: "networking",
      severity: "attention",
      title: "Consider VPC isolation",
      description: "Sensitive workloads should run in private subnets with security groups.",
      recommendation: "Place RDS and OpenSearch in private subnets; use VPC endpoints for S3.",
    });
  }

  for (const flag of flags) {
    findings.push({
      id: flag.id,
      domain: flag.title.toLowerCase().includes("encrypt") ? "data" : "logging",
      severity: flag.severity === "critical" ? "critical" : "attention",
      title: flag.title,
      description: flag.description,
      recommendation: flag.remediation,
    });
  }

  const goodCount = findings.filter((f) => f.severity === "good").length;
  const attentionCount = findings.filter((f) => f.severity !== "good").length;

  return {
    summary: `Security review: ${goodCount} control(s) in good standing, ${attentionCount} item(s) need attention before production.`,
    findings,
  };
}
