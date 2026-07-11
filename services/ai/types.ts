import { z } from 'zod';

export const AiReviewOutputSchema = z.object({
  summary: z.string(),
  architecture: z.string(),
  project_type: z.string(),
  complexity: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  code_quality: z.number().min(0).max(100),
  documentation: z.number().min(0).max(100),
  security: z.number().min(0).max(100),
  maintainability: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  testing: z.number().min(0).max(100),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      level: z.number().min(1).max(5),
    })
  ),
  learning_recommendations: z.array(z.string()),
  overall_score: z.number().min(0).max(100),
  confidence_score: z.number().min(0).max(100),
});

export type AiReviewOutput = z.infer<typeof AiReviewOutputSchema>;
