export interface AzureService {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  pattern: string;
  description: string;
}

export const AZURE_SERVICES: AzureService[] = [
  {
    id: "blob",
    name: "Azure Blob Storage",
    aliases: ["blob storage", "azure storage", "storage account"],
    category: "Storage",
    pattern: "object_storage",
    description: "Scalable object storage for unstructured data.",
  },
  {
    id: "functions",
    name: "Azure Functions",
    aliases: ["azure functions", "functions"],
    category: "Compute",
    pattern: "serverless_compute",
    description: "Event-driven serverless compute.",
  },
  {
    id: "sql",
    name: "Azure SQL Database",
    aliases: ["azure sql", "sql database", "azure sql database"],
    category: "Database",
    pattern: "relational_database",
    description: "Managed relational database service.",
  },
  {
    id: "cosmos",
    name: "Azure Cosmos DB",
    aliases: ["cosmos db", "cosmosdb"],
    category: "Database",
    pattern: "nosql_database",
    description: "Globally distributed multi-model database.",
  },
  {
    id: "aks",
    name: "Azure Kubernetes Service",
    aliases: ["aks", "kubernetes service"],
    category: "Compute",
    pattern: "container_orchestration",
    description: "Managed Kubernetes for container workloads.",
  },
  {
    id: "aad",
    name: "Azure Active Directory",
    aliases: ["azure ad", "aad", "entra id", "microsoft entra"],
    category: "Identity",
    pattern: "identity_provider",
    description: "Enterprise identity and access management.",
  },
  {
    id: "openai",
    name: "Azure OpenAI",
    aliases: ["azure openai", "openai service"],
    category: "AI",
    pattern: "managed_ai",
    description: "Managed OpenAI models on Azure.",
  },
  {
    id: "cognitive-search",
    name: "Azure Cognitive Search",
    aliases: ["cognitive search", "azure search", "ai search"],
    category: "Search",
    pattern: "search_index",
    description: "AI-powered search and indexing.",
  },
  {
    id: "monitor",
    name: "Azure Monitor",
    aliases: ["azure monitor", "application insights"],
    category: "Management",
    pattern: "observability",
    description: "Monitoring, logging, and alerting.",
  },
  {
    id: "keyvault",
    name: "Azure Key Vault",
    aliases: ["key vault", "azure key vault"],
    category: "Security",
    pattern: "secrets_management",
    description: "Secrets, keys, and certificate management.",
  },
  {
    id: "apim",
    name: "Azure API Management",
    aliases: ["api management", "apim"],
    category: "Networking",
    pattern: "api_gateway",
    description: "API gateway and management layer.",
  },
];

export function findAzureService(query: string): AzureService | undefined {
  const lower = query.toLowerCase();
  return AZURE_SERVICES.find(
    (s) =>
      s.name.toLowerCase() === lower ||
      s.aliases.some((a) => lower.includes(a) || a.includes(lower))
  );
}

export function detectAzureServices(text: string): AzureService[] {
  const lower = text.toLowerCase();
  const found = new Map<string, AzureService>();
  for (const svc of AZURE_SERVICES) {
    if (
      lower.includes(svc.name.toLowerCase()) ||
      svc.aliases.some((a) => lower.includes(a))
    ) {
      found.set(svc.id, svc);
    }
  }
  return Array.from(found.values());
}
