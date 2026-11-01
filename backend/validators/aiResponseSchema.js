import { z } from "zod";

export const citationSourceSchema = z.object({
  reportId: z.string(),
  reportName: z.string(),
  pageNumber: z.number().int().default(1),
  section: z.string().default("General"),
  supportingText: z.string(),
  reportDate: z.string().optional(),
});

export const aiResponseSchema = z.object({
  status: z.enum([
    "answered",
    "insufficient_evidence",
    "restricted",
    "processing_error",
  ]),
  answer: z.string(),
  sources: z.array(citationSourceSchema).default([]),
  disclaimer: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export const searchResultItemSchema = z.object({
  chunkId: z.string(),
  reportId: z.string(),
  reportTitle: z.string(),
  reportDate: z.string(),
  category: z.string(),
  patientId: z.string(),
  patientName: z.string().optional(),
  pageNumber: z.number(),
  sectionName: z.string(),
  extractedText: z.string(),
  matchType: z.enum(["exact", "semantic", "hybrid"]),
  score: z.number(),
  highlight: z.string().optional(),
});
