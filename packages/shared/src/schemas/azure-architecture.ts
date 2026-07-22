import { z } from "zod";

export const AzureServiceComponentSchema = z.object({
  id: z.string(),
  service: z.string(),
  category: z.enum([
    "Compute",
    "Storage",
    "Database",
    "Identity",
    "Search",
    "Integration",
    "Security",
    "Management",
    "Networking",
    "AI",
  ]),
  pattern: z.string(),
  purpose: z.string(),
});

export const AzureArchitectureSchema = z.object({
  applicationName: z.string(),
  industry: z.string().optional(),
  dataSensitivity: z.string().optional(),
  expectedUsers: z.number().optional(),
  availabilityRequirements: z.string().optional(),
  complianceRequirements: z.array(z.string()).default([]),
  summary: z.string(),
  components: z.array(AzureServiceComponentSchema),
});

export type AzureServiceComponent = z.infer<typeof AzureServiceComponentSchema>;
export type AzureArchitecture = z.infer<typeof AzureArchitectureSchema>;
