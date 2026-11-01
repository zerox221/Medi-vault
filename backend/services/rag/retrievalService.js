import { searchByVector } from "./vectorSearchService.js";
import { searchByKeyword } from "./keywordSearchService.js";
import { rerankAndDeduplicateChunks } from "./rerankingService.js";

/**
 * Hybrid Retrieval Service for Medical Documents
 * Executes parallel semantic vector search & exact keyword match within authorization scope
 *
 * @param {Object} accessFilter - Database security filter (ownership / sharing)
 * @param {string} queryText - User's clinical query or search terms
 * @param {Object} options - { topK, category, dateRange, recordIds, mode }
 */
export const retrieveRelevantChunks = async (accessFilter, queryText, options = {}) => {
  if (!accessFilter || Object.keys(accessFilter).length === 0) {
    throw new Error("Security Violation: Retrieval must be bound to an authorized filter.");
  }

  const mode = options.mode || "hybrid";
  const fetchLimit = (options.topK || 5) * 2;

  let vectorResults = [];
  let keywordResults = [];

  if (mode === "hybrid" || mode === "semantic") {
    try {
      vectorResults = await searchByVector(accessFilter, queryText, {
        ...options,
        topK: fetchLimit,
      });
    } catch (err) {
      console.warn("⚠️ [Vector Retrieval Warning]:", err.message);
    }
  }

  if (mode === "hybrid" || mode === "exact") {
    try {
      keywordResults = await searchByKeyword(accessFilter, queryText, {
        ...options,
        limit: fetchLimit,
      });
    } catch (err) {
      console.warn("⚠️ [Keyword Retrieval Warning]:", err.message);
    }
  }

  const reranked = rerankAndDeduplicateChunks(vectorResults, keywordResults, options);
  return reranked;
};
