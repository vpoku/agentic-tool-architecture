import { z } from "zod";

export const LearningExplanationSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  azureSource: z.string().optional(),
  beginner: z.string(),
  architect: z.string(),
  interview: z.string(),
});

export type LearningExplanation = z.infer<typeof LearningExplanationSchema>;
