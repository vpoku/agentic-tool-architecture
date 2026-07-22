import {
  AzureArchitectureSchema,
  detectAzureServices,
  type AzureArchitecture,
  type AzureServiceComponent,
} from "@cloudarch/shared";

const CATEGORY_MAP: Record<string, AzureServiceComponent["category"]> = {
  Compute: "Compute",
  Storage: "Storage",
  Database: "Database",
  Identity: "Identity",
  Search: "Search",
  Integration: "Integration",
  Security: "Security",
  Management: "Management",
  Networking: "Networking",
  AI: "AI",
};

function extractAppName(text: string): string {
  const match = text.match(/application name:\s*(.+)/i);
  if (match) return match[1].trim().slice(0, 80);
  if (text.toLowerCase().includes("healthcare")) return "Healthcare Document Management";
  if (text.toLowerCase().includes("classified")) return "Classified Document System";
  return "Azure Application";
}

function extractIndustry(text: string): string | undefined {
  const match = text.match(/industry:\s*(.+)/i);
  if (match) return match[1].trim();
  if (text.toLowerCase().includes("healthcare") || text.toLowerCase().includes("patient"))
    return "Healthcare";
  if (text.toLowerCase().includes("government") || text.toLowerCase().includes("fedramp"))
    return "Government";
  return undefined;
}

function extractUsers(text: string): number | undefined {
  const match = text.match(/(\d[\d,]*)\s*users?/i);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return undefined;
}

export function analyzeAzureArchitecture(userMessage: string): AzureArchitecture {
  const detected = detectAzureServices(userMessage);
  const lower = userMessage.toLowerCase();

  const components: AzureServiceComponent[] = detected.map((svc, i) => ({
    id: svc.id,
    service: svc.name,
    category: (CATEGORY_MAP[svc.category] ?? "Compute") as AzureServiceComponent["category"],
    pattern: svc.pattern,
    purpose: inferPurpose(svc.name, userMessage),
  }));

  if (components.length === 0) {
    components.push(
      {
        id: "functions",
        service: "Azure Functions",
        category: "Compute",
        pattern: "serverless_compute",
        purpose: "Backend processing described in requirements",
      },
      {
        id: "blob",
        service: "Azure Blob Storage",
        category: "Storage",
        pattern: "object_storage",
        purpose: "Document or object storage",
      }
    );
  }

  const compliance: string[] = [];
  if (lower.includes("fedramp") || lower.includes("government")) compliance.push("FedRAMP");
  if (lower.includes("hipaa") || lower.includes("patient") || lower.includes("healthcare"))
    compliance.push("HIPAA");
  if (lower.includes("itar")) compliance.push("ITAR");
  if (lower.includes("high availability") || lower.includes("ha")) compliance.push("High Availability");

  return AzureArchitectureSchema.parse({
    applicationName: extractAppName(userMessage),
    industry: extractIndustry(userMessage),
    dataSensitivity:
      lower.includes("classified") || lower.includes("patient") || lower.includes("sensitive")
        ? "High — regulated or classified data"
        : "Moderate",
    expectedUsers: extractUsers(userMessage),
    availabilityRequirements: lower.includes("high availability")
      ? "Multi-AZ, 99.9%+ uptime"
      : "Standard availability",
    complianceRequirements: compliance.length ? compliance : ["Government compliance"],
    summary: `Azure architecture for ${extractAppName(userMessage)} with ${components.length} detected service(s). ${userMessage.slice(0, 150)}`,
    components,
  });
}

function inferPurpose(serviceName: string, text: string): string {
  const lower = text.toLowerCase();
  if (serviceName.includes("Blob")) return "Object storage for documents and files";
  if (serviceName.includes("Functions"))
    return lower.includes("process") ? "Serverless backend processing" : "Event-driven compute";
  if (serviceName.includes("SQL")) return "Relational metadata storage";
  if (serviceName.includes("Cognitive Search") || serviceName.includes("Search"))
    return "Document indexing and search";
  if (serviceName.includes("Active Directory")) return "User authentication and identity";
  if (serviceName.includes("OpenAI") || serviceName.includes("Bedrock")) return "AI inference and NLP";
  if (serviceName.includes("Monitor")) return "Monitoring and audit logging";
  if (serviceName.includes("Key Vault")) return "Secrets and encryption key management";
  return `Core ${serviceName.replace("Azure ", "")} capability in this workload`;
}
