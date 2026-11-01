import { ReportChunk } from "../../models/ReportChunk.js";
import { isPostgresConfigured } from "../../config/postgres.js";
import { searchKeywordPostgres } from "./postgresVectorStore.js";

/**
 * Extracts authorized patient and record ID arrays from Mongoose security filters
 */
const extractAccessScope = (accessFilter) => {
  let patientIds = [];
  if (accessFilter.patient) {
    if (accessFilter.patient.$in && Array.isArray(accessFilter.patient.$in)) {
      patientIds = accessFilter.patient.$in.map((id) => id.toString());
    } else {
      patientIds = [accessFilter.patient.toString()];
    }
  }

  let recordIds = [];
  if (accessFilter.record) {
    if (accessFilter.record.$in && Array.isArray(accessFilter.record.$in)) {
      recordIds = accessFilter.record.$in.map((id) => id.toString());
    } else {
      recordIds = [accessFilter.record.toString()];
    }
  }

  return { patientIds, recordIds };
};

/**
 * Executes a security-scoped exact keyword and clinical text search using MongoDB.
 * Combines exact phrase matching, multi-term clinical regex, and MongoDB text index search.
 *
 * @param {Object} accessFilter - Mandatory database query filter
 * @param {string} queryText - Search terms (e.g. "hemoglobin", "cholesterol", "11.2", "HbA1c")
 * @param {Object} options - { limit: 15, category, dateRange, recordIds }
 */
export const searchByKeyword = async (accessFilter, queryText, options = {}) => {
  if (!accessFilter || Object.keys(accessFilter).length === 0) {
    throw new Error("Security Violation: Keyword search must be scoped by an authorization filter.");
  }

  const cleanQuery = (queryText || "").trim();
  if (!cleanQuery) return [];

  // 1. Neon PostgreSQL full-text search (Active when configured and not explicitly set to mongodb)
  if (isPostgresConfigured() && process.env.VECTOR_STORE !== "mongodb") {
    const scope = extractAccessScope(accessFilter);
    if (scope.patientIds.length === 0) {
      return [];
    }
    try {
      const pgResults = await searchKeywordPostgres(scope, cleanQuery, options);
      if (pgResults && pgResults.length > 0) {
        return pgResults;
      }
    } catch (pgErr) {
      console.warn("⚠️ [PostgreSQL Keyword Search Notice]:", pgErr.message, "-> Engaging MongoDB keyword fallback.");
    }
  }

  // 2. Build MongoDB query combining mandatory security boundary + optional user filters
  const mongoQuery = { ...accessFilter };

  if (options.recordIds && options.recordIds.length > 0) {
    if (mongoQuery.record && mongoQuery.record.$in) {
      const authorizedSet = new Set(mongoQuery.record.$in.map((id) => id.toString()));
      const permitted = options.recordIds.filter((id) => authorizedSet.has(id.toString()));
      mongoQuery.record = { $in: permitted };
    } else {
      mongoQuery.record = { $in: options.recordIds };
    }
  }

  if (options.category && options.category !== "All Reports" && options.category !== "All Categories") {
    mongoQuery.category = new RegExp(options.category, "i");
  }

  if (options.dateRange) {
    const { from, to } = options.dateRange;
    if (from || to) {
      mongoQuery.reportDate = {};
      if (from) mongoQuery.reportDate.$gte = from;
      if (to) mongoQuery.reportDate.$lte = to;
    }
  }

  // 3. Clinical search regex patterns:
  // - escapedTerm: Matches exact continuous phrase or specific number (e.g. "11.2", "blood test")
  // - termsRegex: Matches individual keywords (e.g. "hemoglobin", "platelet")
  const escapedTerm = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexMatch = new RegExp(escapedTerm, "i");

  const terms = cleanQuery
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const termsRegex = terms.length > 0 ? new RegExp(terms.join("|"), "gi") : regexMatch;

  mongoQuery.$or = [
    { extractedText: termsRegex },
    { sectionName: termsRegex },
    { reportTitle: termsRegex },
  ];

  // 4. Fetch candidate chunks from MongoDB strictly within permission boundary
  const candidateChunks = await ReportChunk.find(mongoQuery)
    .select("chunkId patient record pageNumber sectionName reportDate reportTitle category extractedText extractionMethod tokenCount")
    .lean();

  const results = [];
  for (const chunk of candidateChunks) {
    const text = chunk.extractedText || "";
    let matchCount = 0;
    let exactPhraseMatch = false;

    if (regexMatch.test(text) || regexMatch.test(chunk.sectionName) || regexMatch.test(chunk.reportTitle)) {
      exactPhraseMatch = true;
      matchCount += 5;
    }

    const matches = text.match(termsRegex) || [];
    matchCount += matches.length;

    // Generate context snippet around the first match
    let snippet = "";
    const firstMatchIdx = text.search(termsRegex);
    if (firstMatchIdx !== -1) {
      const start = Math.max(0, firstMatchIdx - 70);
      const end = Math.min(text.length, firstMatchIdx + 150);
      snippet = (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");
    } else {
      snippet = text.slice(0, 180) + "...";
    }

    // Score normalized between 0.1 and 1.0
    const keywordScore = Math.min(1.0, exactPhraseMatch ? 0.9 + (matchCount * 0.02) : 0.4 + (matchCount * 0.05));

    results.push({
      ...chunk,
      keywordScore,
      matchType: exactPhraseMatch ? "exact" : "keyword",
      highlightSnippet: snippet,
    });
  }

  results.sort((a, b) => b.keywordScore - a.keywordScore);

  const limit = options.limit || 15;
  return results.slice(0, limit);
};
