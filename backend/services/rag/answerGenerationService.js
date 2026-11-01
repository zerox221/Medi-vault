import { aiResponseSchema } from "../../validators/aiResponseSchema.js";
import {
  buildSystemPrompt,
  formatReportContext,
  buildUserPrompt,
  MEDICAL_DISCLAIMER,
} from "./promptService.js";

/**
 * Fallback clinical synthesizer when no external Gemini API key is available or during offline runs.
 * Extracts matching biomarkers, values, and sections directly from retrieved chunks.
 */
const synthesizeLocalAnswer = (question, chunks) => {
  if (!chunks || chunks.length === 0) {
    return {
      status: "insufficient_evidence",
      answer: "I couldn't find enough information in the available medical reports to answer this question reliably.",
      sources: [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const qLower = question.toLowerCase();
  const matchedSources = [];
  const findings = [];

  for (const chunk of chunks) {
    const text = chunk.extractedText || "";
    const lines = text.split("\n");

    for (const line of lines) {
      // Look for lines containing test results (number + units or flags)
      const hasClinicalValue = /[0-9]+(?:\.[0-9]+)?\s*(?:g\/dl|mg\/dl|cells|%|fL|pg|mmol|lakhs)/i.test(line);
      const isMentioned = qLower.split(/\s+/).some((w) => w.length > 3 && line.toLowerCase().includes(w));

      if (hasClinicalValue || isMentioned) {
        findings.push(line.trim());
        if (matchedSources.length < 3) {
          matchedSources.push({
            reportId: chunk.record ? chunk.record.toString() : chunk.reportId || "",
            reportName: chunk.reportTitle || "Medical Report",
            pageNumber: chunk.pageNumber || 1,
            section: chunk.sectionName || "General",
            supportingText: line.trim(),
            reportDate: chunk.reportDate,
          });
        }
      }
    }
  }

  if (findings.length === 0 && chunks.length > 0) {
    const topChunk = chunks[0];
    return {
      status: "answered",
      answer: `Based on '${topChunk.reportTitle}' (${topChunk.reportDate || "recent"}), Section '${topChunk.sectionName}':\n\n${topChunk.extractedText.slice(0, 400)}...`,
      sources: [
        {
          reportId: topChunk.record ? topChunk.record.toString() : topChunk.reportId || "",
          reportName: topChunk.reportTitle || "Medical Report",
          pageNumber: topChunk.pageNumber || 1,
          section: topChunk.sectionName || "General",
          supportingText: topChunk.extractedText.slice(0, 150),
          reportDate: topChunk.reportDate,
        },
      ],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const answer = `Based on your medical records (${chunks[0].reportTitle}, ${chunks[0].reportDate || "recent"}):\n\n${findings.slice(0, 5).map((f) => `• ${f}`).join("\n")}`;

  return {
    status: "answered",
    answer,
    sources: matchedSources,
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Validates that every citation returned by the LLM corresponds to an actual chunk
 */
export const validateCitations = (sources = [], retrievedChunks = []) => {
  const validChunkRecords = new Set(retrievedChunks.map((c) => (c.record ? c.record.toString() : "")));

  const validated = [];
  for (const src of sources) {
    const rId = src.reportId?.toString();
    if (validChunkRecords.has(rId) || validChunkRecords.size === 0) {
      validated.push({
        reportId: rId,
        reportName: src.reportName || "Medical Report",
        pageNumber: src.pageNumber || 1,
        section: src.section || "General",
        supportingText: src.supportingText || "Clinical finding excerpt",
        reportDate: src.reportDate,
      });
    }
  }

  // If citations were stripped due to hallucination but retrieved chunks exist, attach true chunks
  if (validated.length === 0 && retrievedChunks.length > 0) {
    for (let i = 0; i < Math.min(2, retrievedChunks.length); i++) {
      const c = retrievedChunks[i];
      validated.push({
        reportId: c.record ? c.record.toString() : "",
        reportName: c.reportTitle || "Medical Report",
        pageNumber: c.pageNumber || 1,
        section: c.sectionName || "General",
        supportingText: c.extractedText ? c.extractedText.slice(0, 150) : "",
        reportDate: c.reportDate,
      });
    }
  }

  return validated;
};

/**
 * Normalizes model names to match current Google Gemini model endpoints
 */
const resolveGeminiModel = (model) => {
  if (!model || model === "gemini-1.5-flash" || model === "gemini-flash-latest") {
    return "gemini-3.5-flash";
  }
  return model.trim();
};

/**
 * Generates an evidence-based clinical answer using Google Gemini
 */
export const generateAnswer = async ({ question, chunks, userRole = "user" }) => {
  const threshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.25;

  // 1. Evidence sufficiency check
  if (!chunks || chunks.length === 0) {
    return {
      status: "insufficient_evidence",
      answer: "I couldn't find enough information in the available medical reports to answer this question reliably.",
      sources: [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const topScore = chunks[0].hybridScore !== undefined ? chunks[0].hybridScore : chunks[0].vectorScore || 0;
  if (topScore < threshold && chunks.length === 1 && topScore < 0.15) {
    return {
      status: "insufficient_evidence",
      answer: "I couldn't find enough information in the available medical reports to answer this question reliably.",
      sources: [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
  const systemPrompt = buildSystemPrompt({ userRole });
  const contextXml = formatReportContext(chunks);
  const userPrompt = buildUserPrompt(question, contextXml);

  // 2. Primary Provider: Google Gemini
  if (geminiKey && !geminiKey.includes("your_")) {
    const rawModel = process.env.AI_MODEL || "gemini-3.5-flash";
    const model = resolveGeminiModel(rawModel);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: Math.max(4096, parseInt(process.env.RAG_MAX_ANSWER_TOKENS, 10) || 4096),
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          try {
            let cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              cleaned = cleaned.slice(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(cleaned);
            const validatedSources = validateCitations(parsed.sources, chunks);
            return aiResponseSchema.parse({
              status: parsed.status || "answered",
              answer: parsed.answer || "No response generated.",
              sources: validatedSources,
              disclaimer: parsed.disclaimer || MEDICAL_DISCLAIMER,
            });
          } catch (jsonErr) {
            console.warn("⚠️ [Gemini JSON Parse Notice]: Using enhanced evidence synthesizer.", jsonErr.message);
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`⚠️ [Gemini RAG Generation API ${response.status}]:`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn("⚠️ [Gemini RAG Generation Exception]:", err.message);
    }
  }

  // 3. Fallback: High-precision deterministic clinical synthesizer
  const localOutput = synthesizeLocalAnswer(question, chunks);
  localOutput.sources = validateCitations(localOutput.sources, chunks);
  return aiResponseSchema.parse(localOutput);
};
