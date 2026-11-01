import fs from "fs";
import { ReportChunk } from "../../models/ReportChunk.js";
import { MedicalRecord } from "../../models/MedicalRecord.js";
import { extractPagesFromPdf } from "./pdfExtractor.js";
import { evaluatePagesForOcr } from "./ocrService.js";
import { chunkMedicalReport } from "./chunkService.js";
import { batchGenerateEmbeddings } from "./embeddingService.js";
import { retrieveRelevantChunks } from "./retrievalService.js";
import { generateAnswer } from "./answerGenerationService.js";
import { getRagConfig } from "../../config/env.js";
import { isPostgresConfigured } from "../../config/postgres.js";
import { saveChunksToPostgres, countPatientChunksPostgres } from "./postgresVectorStore.js";

/**
 * Indexes a medical report into the secure RAG vector store
 * Executes: File Validation -> Page-Aware Extraction -> Chunking -> Embedding -> Database Storage
 * Resilient to missing local files by falling back to record.extractedText or aiSummary.
 *
 * @param {Object} record - The Mongoose MedicalRecord document
 * @param {string|Buffer} filePathOrBuffer - Path or buffer of the PDF file (optional if extractedText exists)
 */
export const indexMedicalRecord = async (record, filePathOrBuffer) => {
  if (!record || !record._id) {
    throw new Error("Invalid MedicalRecord document provided for RAG indexing.");
  }

  const recordId = record._id;
  const config = getRagConfig();

  try {
    // 1. Mark record as processing
    record.processingStatus = "processing";
    record.processingError = "";
    await record.save();

    // 2. Page-aware text extraction
    let pages = [];
    let totalPages = 1;
    let fullText = "";

    // A. Try extracting from file path or buffer if available on disk
    if (filePathOrBuffer) {
      try {
        const canRead = Buffer.isBuffer(filePathOrBuffer) || (typeof filePathOrBuffer === "string" && fs.existsSync(filePathOrBuffer));
        if (canRead) {
          const extracted = await extractPagesFromPdf(filePathOrBuffer);
          if (extracted && extracted.pages && extracted.pages.length > 0) {
            pages = extracted.pages;
            totalPages = extracted.totalPages || pages.length;
            fullText = extracted.fullText || "";
          }
        }
      } catch (extractErr) {
        console.warn(`ℹ️ [PDF Extract Fallback for ${record.title}]:`, extractErr.message);
      }
    }

    // B. Fallback: If file extraction failed or file was unlinked, use record.extractedText or aiSummary
    if (pages.length === 0) {
      let fallbackText = (record.extractedText || "").trim();

      if (!fallbackText && record.aiSummary?.summary) {
        fallbackText = `Clinical Summary: ${record.aiSummary.summary}\n` +
          (record.aiSummary.findings?.map((f) => `Finding: ${f}`).join("\n") || "") + "\n" +
          (record.aiSummary.abnormalValues?.map((a) => `Abnormal Value: ${a}`).join("\n") || "") + "\n" +
          (record.aiSummary.keyBiomarkers?.map((b) => `${b.parameter}: ${b.value} (Normal: ${b.normalRange || "N/A"})`).join("\n") || "");
      }

      if (fallbackText && fallbackText.length > 0) {
        const rawPages = fallbackText.split("\f");
        pages = rawPages.map((pt, pIdx) => ({
          pageNumber: pIdx + 1,
          text: pt.trim(),
          extractionMethod: "pdf_text",
        })).filter((p) => p.text.length > 0);
        fullText = fallbackText;
        totalPages = pages.length;
      }
    }

    if (pages.length === 0) {
      record.processingStatus = "failed";
      record.processingError = "No extractable text or pages detected in the medical report.";
      await record.save();
      return { success: false, reason: record.processingError };
    }

    // 3. OCR evaluation
    const evaluated = evaluatePagesForOcr(pages);

    // 4. Medical-aware chunking
    const metadata = {
      patientId: record.patient,
      recordId: record._id,
      reportTitle: record.title,
      reportDate: record.reportDate,
      category: record.category,
    };

    const rawChunks = chunkMedicalReport(evaluated.pages, metadata, {
      chunkSizeTokens: config.chunkSize,
      chunkOverlapTokens: config.chunkOverlap,
    });

    if (rawChunks.length === 0) {
      record.processingStatus = "failed";
      record.processingError = "Could not segment medical report into contextual chunks.";
      await record.save();
      return { success: false, reason: record.processingError };
    }

    // 5. Generate embeddings once
    const embeddedChunks = await batchGenerateEmbeddings(rawChunks);

    // 6. Always persist to MongoDB first to ensure resilient local vector storage
    await ReportChunk.deleteMany({ record: recordId });
    await ReportChunk.insertMany(embeddedChunks);

    // 7. Sync to Neon PostgreSQL pgvector if configured
    if (isPostgresConfigured() && process.env.VECTOR_STORE !== "mongodb") {
      try {
        await saveChunksToPostgres(embeddedChunks, recordId);
      } catch (pgErr) {
        console.warn("⚠️ [Neon PostgreSQL Sync Warning]: Could not persist chunks to PostgreSQL, safely preserved in MongoDB:", pgErr.message);
      }
    }

    // 8. Update record status to completed
    record.processingStatus = "completed";
    record.chunkCount = embeddedChunks.length;
    record.pageCount = totalPages || evaluated.pages.length;
    if (!record.extractedText || record.extractedText.trim().length === 0) {
      record.extractedText = fullText;
    }
    await record.save();

    console.log(
      `✅ [RAG Index Complete]: Record '${record.title}' indexed into ${embeddedChunks.length} chunks (${record.pageCount} pages).`
    );

    return {
      success: true,
      chunkCount: embeddedChunks.length,
      pageCount: record.pageCount,
    };
  } catch (error) {
    console.error(`❌ [RAG Index Error for ${record.title}]:`, error.message);
    record.processingStatus = "failed";
    record.processingError = error.message;
    await record.save();
    return { success: false, error: error.message };
  }
};

/**
 * Automatically indexes unindexed reports for a patient on the fly.
 * Ensures that all uploaded reports are searchable even if uploaded prior to RAG integration.
 */
export const autoIndexPatientRecordsIfNeeded = async (patientId) => {
  if (!patientId) return 0;
  try {
    // 1. Fast local check in MongoDB
    let existingChunkCount = await ReportChunk.countDocuments({ patient: patientId });

    // 2. If 0 in MongoDB, check PostgreSQL
    if (existingChunkCount === 0 && isPostgresConfigured() && process.env.VECTOR_STORE !== "mongodb") {
      try {
        existingChunkCount = await countPatientChunksPostgres(patientId);
      } catch (pgErr) {
        // PostgreSQL unavailable, proceed to check records for auto-indexing
      }
    }

    if (existingChunkCount > 0) {
      return existingChunkCount;
    }

    // Patient has 0 chunks in vector store. Check if they have records in MedicalRecord.
    const records = await MedicalRecord.find({ patient: patientId });
    if (records.length === 0) {
      return 0;
    }

    console.log(`🔄 [RAG Self-Healing]: Found ${records.length} unindexed medical reports for patient ${patientId}. Indexing into ${isPostgres ? "Neon PostgreSQL pgvector" : "MongoDB"}...`);
    let indexed = 0;
    for (const record of records) {
      try {
        const source = record.extractedText ? Buffer.from(record.extractedText, "utf8") : null;
        const res = await indexMedicalRecord(record, source);
        if (res.success) indexed++;
      } catch (err) {
        console.warn(`⚠️ Could not auto-index record '${record.title}':`, err.message);
      }
    }
    console.log(`✅ [RAG Self-Healing Complete]: Auto-indexed ${indexed}/${records.length} reports.`);
    return isPostgres ? await countPatientChunksPostgres(patientId) : await ReportChunk.countDocuments({ patient: patientId });
  } catch (err) {
    console.warn("⚠️ [RAG Auto-Index Error]:", err.message);
    return 0;
  }
};

/**
 * Searches medical reports using hybrid semantic vector and keyword retrieval
 * Strictly scoped to the authenticated caller's authorization filter.
 */
export const searchMedicalReports = async ({
  accessFilter,
  query,
  options = {},
}) => {
  // Ensure unindexed records are indexed on the fly
  if (accessFilter.patient) {
    const pId = typeof accessFilter.patient === "object" && accessFilter.patient.$in
      ? accessFilter.patient.$in[0]
      : accessFilter.patient;
    await autoIndexPatientRecordsIfNeeded(pId);
  }

  const results = await retrieveRelevantChunks(accessFilter, query, {
    ...options,
    topK: options.topK || 10,
  });

  const formattedResults = results.map((chunk) => {
    return {
      chunkId: chunk.chunkId,
      reportId: chunk.record ? chunk.record.toString() : "",
      reportTitle: chunk.reportTitle,
      reportDate: chunk.reportDate,
      category: chunk.category,
      patientId: chunk.patient ? chunk.patient.toString() : "",
      pageNumber: chunk.pageNumber,
      sectionName: chunk.sectionName,
      extractedText: chunk.extractedText,
      matchType: chunk.matchType,
      score: chunk.hybridScore || chunk.keywordScore || chunk.vectorScore || 0,
      highlight: chunk.highlightSnippet || "",
    };
  });

  return {
    query,
    count: formattedResults.length,
    results: formattedResults,
  };
};

/**
 * Answers clinical questions using RAG within authorization scope
 */
export const answerMedicalQuestion = async ({
  accessFilter,
  question,
  userRole = "user",
  options = {},
}) => {
  // Ensure unindexed records are indexed on the fly
  if (accessFilter.patient) {
    const pId = typeof accessFilter.patient === "object" && accessFilter.patient.$in
      ? accessFilter.patient.$in[0]
      : accessFilter.patient;
    await autoIndexPatientRecordsIfNeeded(pId);
  }

  const relevantChunks = await retrieveRelevantChunks(accessFilter, question, {
    ...options,
    topK: options.topK || 5,
  });

  const response = await generateAnswer({
    question,
    chunks: relevantChunks,
    userRole,
  });

  return {
    ...response,
    retrievedChunkCount: relevantChunks.length,
  };
};
