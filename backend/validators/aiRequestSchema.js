import { z } from "zod";

export const patientAskSchema = z.object({
  question: z
    .string()
    .min(2, "Question must be at least 2 characters long.")
    .max(1000, "Question cannot exceed 1000 characters."),
  recordId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  topK: z.number().int().min(1).max(20).optional().default(5),
});

export const patientSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required.")
    .max(500, "Search query cannot exceed 500 characters."),
  recordId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  mode: z.enum(["hybrid", "exact", "semantic"]).optional().default("hybrid"),
  limit: z.number().int().min(1).max(30).optional().default(10),
});

export const doctorAskSchema = z.object({
  patientId: z.string().min(1, "Target patient ID is required."),
  question: z
    .string()
    .min(2, "Clinical inquiry must be at least 2 characters long.")
    .max(1500, "Clinical inquiry cannot exceed 1500 characters."),
  recordIds: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  topK: z.number().int().min(1).max(20).optional().default(5),
});

export const doctorSearchSchema = z.object({
  patientId: z.string().optional().nullable(),
  query: z
    .string()
    .min(1, "Search term or test name is required.")
    .max(500, "Search term cannot exceed 500 characters."),
  recordIds: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  mode: z.enum(["hybrid", "exact", "semantic"]).optional().default("hybrid"),
  limit: z.number().int().min(1).max(50).optional().default(15),
});
