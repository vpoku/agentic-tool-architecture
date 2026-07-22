import { z } from "zod";

export const ServiceMappingSchema = z.object({
  id: z.string(),
  azureService: z.string(),
  azurePurpose: z.string(),
  awsService: z.string(),
  awsGovCloudEquivalent: z.string(),
  reason: z.string(),
  migrationConsiderations: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
});

export type ServiceMapping = z.infer<typeof ServiceMappingSchema>;
