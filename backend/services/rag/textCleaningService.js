import { normalizeExtractedText } from "../pdfExtractionService.js";

/**
 * Text Cleaning & Security Normalization for Medical RAG
 * 1. Preserves decimal values, units, reference intervals, abnormal flags
 * 2. Neutralizes prompt injection patterns found in untrusted report text
 */

// Patterns indicating potential prompt injection inside medical documents
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/gi,
  /system\s*:\s*/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[SYSTEM_INSTRUCTION\]/gi,
  /role\s*:\s*["']?system["']?/gi,
];

/**
 * Neutralizes potential prompt injection strings while preserving clinical text
 */
export const sanitizeUntrustedText = (text) => {
  if (!text) return "";
  let sanitized = text;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[SUSPICIOUS_PROMPT_REMOVED]");
  }
  return sanitized;
};

/**
 * Normalizes clinical text preserving numbers, ranges, and table relationships
 */
export const cleanMedicalText = (rawText) => {
  if (!rawText) return "";

  // 1. Sanitize prompt injections
  let text = sanitizeUntrustedText(rawText);

  // 2. Separate letter-number touching cells and format boundaries
  text = normalizeExtractedText(text);

  // 3. Remove repeated boilerplate headers that contain no medical data
  const lines = text.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Keep lab disclaimers, test lines, and doctor notes, but drop pure page counter lines
    if (/^Page\s+\d+\s+of\s+\d+$/i.test(trimmed)) return false;
    return true;
  });

  return filteredLines.join("\n").trim();
};
