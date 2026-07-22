import { z } from "zod";

export const SecurityFindingSchema = z.object({
  id: z.string(),
  domain: z.enum(["identity", "data", "logging", "networking"]),
  severity: z.enum(["good", "attention", "critical"]),
  title: z.string(),
  description: z.string(),
  recommendation: z.string().optional(),
});

export const SecurityReviewSchema = z.object({
  summary: z.string(),
  findings: z.array(SecurityFindingSchema),
});

export type SecurityFinding = z.infer<typeof SecurityFindingSchema>;
export type SecurityReview = z.infer<typeof SecurityReviewSchema>;
