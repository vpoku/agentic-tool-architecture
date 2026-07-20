import type { ArchitectureProposal, ComplianceFlag } from "../schemas/architecture.js";

export interface ComplianceCheckInput {
  services: string[];
  framework: "FedRAMP" | "ITAR" | "HIPAA" | "None";
  encryptAtRest?: boolean;
  vpcOnly?: boolean;
  loggingEnabled?: boolean;
  fipsEndpoints?: boolean;
}

export function checkCompliance(input: ComplianceCheckInput): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  const serviceSet = new Set(input.services.map((s) => s.toLowerCase()));

  if (input.framework !== "None") {
    if (!serviceSet.has("kms") && !serviceSet.has("aws kms")) {
      flags.push({
        id: "kms-missing",
        severity: "critical",
        title: "Encryption keys not configured",
        description: "FedRAMP and ITAR workloads require AWS KMS for encryption at rest.",
        remediation: "Add AWS KMS to your architecture and enable SSE-KMS on all storage services.",
      });
    }

    if (!serviceSet.has("cloudwatch")) {
      flags.push({
        id: "logging-missing",
        severity: "warning",
        title: "Centralized logging not detected",
        description: "Compliance frameworks require audit logging of all API and data access.",
        remediation: "Add Amazon CloudWatch Logs and enable CloudTrail in GovCloud.",
      });
    }

    if (!serviceSet.has("vpc") && !serviceSet.has("amazon vpc")) {
      flags.push({
        id: "vpc-missing",
        severity: "warning",
        title: "No VPC isolation defined",
        description: "GovCloud workloads should run inside a VPC with private subnets.",
        remediation: "Add Amazon VPC with public/private subnet tiers.",
      });
    }

    if (!serviceSet.has("waf") && !serviceSet.has("aws waf")) {
      flags.push({
        id: "waf-missing",
        severity: "info",
        title: "Web Application Firewall not included",
        description: "WAF adds protection against common web exploits at the edge.",
        remediation: "Consider AWS WAF on CloudFront or ALB for internet-facing APIs.",
      });
    }
  }

  if (input.framework === "ITAR") {
    flags.push({
      id: "itar-data-residency",
      severity: "info",
      title: "ITAR data residency requirement",
      description: "ITAR-controlled data must remain within AWS GovCloud (US) regions.",
      remediation: "Ensure all services use us-gov-west-1 or us-gov-east-1 only.",
    });
  }

  const unavailable = input.services.filter((s) => {
    const lower = s.toLowerCase();
    return lower.includes("amplify") || lower.includes("appsync");
  });

  for (const svc of unavailable) {
    flags.push({
      id: `unavailable-${svc}`,
      severity: "critical",
      title: `${svc} may not be available in GovCloud`,
      description: "This service has limited or no availability in AWS GovCloud regions.",
      remediation: "Replace with a GovCloud-approved alternative (e.g., ECS Fargate instead of Amplify).",
    });
  }

  return flags;
}

export function mergeComplianceFlags(
  proposal: Partial<ArchitectureProposal>
): ComplianceFlag[] {
  const services = (proposal.services ?? []).map((n) => n.data.service);
  const framework = proposal.compliance?.framework ?? "FedRAMP";
  return checkCompliance({ services, framework });
}
