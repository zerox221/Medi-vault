import { ReportChunk } from "../../models/ReportChunk.js";
import { generateEmbedding, cosineSimilarity } from "./embeddingService.js";
import { isPostgresConfigured } from "../../config/postgres.js";
import { searchVectorPostgres } from "./postgresVectorStore.js";

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
 * Executes a security-scoped vector similarity search on medical reports.
 *
 * Supported engines:
 * 1. Local MongoDB (Primary / Default): Exact mathematical Cosine Similarity calculated over
 *    security-filtered candidate chunks. High performance, zero external dependencies, 100% compatible with local MongoDB.
 * 2. MongoDB Atlas Vector Search ($vectorSearch): Activated when USE_ATLAS_VECTOR_SEARCH=true on Atlas clusters.
 * 3. PostgreSQL pgvector: Activated only when VECTOR_STORE=postgres is explicitly configured.
 *
 * @param {Object} accessFilter - Mandatory database query filter (e.g. { patient: patientId } or { patient: { $in: ids }, record: { $in: ids } })
 * @param {string} queryText - The search query or question
 * @param {Object} options - { topK: 10, category: string, dateRange: { from, to }, recordIds: [] }
 */
export const searchByVector = async (accessFilter, queryText, options = {}) => {
  if (!accessFilter || Object.keys(accessFilter).length === 0) {
    throw new Error("Security Violation: Vector search must be scoped by an authorization filter.");
  }

  // 1. Generate query embedding using Google Gemini (gemini-embedding-001)
  const { embedding: queryEmbedding } = await generateEmbedding(queryText);

  // 2. Neon PostgreSQL pgvector (Active when configured and not explicitly set to mongodb)
  if (isPostgresConfigured() && process.env.VECTOR_STORE !== "mongodb") {
    const scope = extractAccessScope(accessFilter);
    if (scope.patientIds.length === 0) {
      return [];
    }
    try {
      const pgResults = await searchVectorPostgres(scope, queryEmbedding, options);
      if (pgResults && pgResults.length > 0) {
        return pgResults;
      }
    } catch (pgErr) {
      console.warn("⚠️ [PostgreSQL Vector Search Notice]:", pgErr.message, "-> Engaging MongoDB vector fallback.");
    }
  }

  // 3. Build MongoDB query combining mandatory access filter + optional user filters
  const mongoQuery = { ...accessFilter };

  if (options.recordIds && options.recordIds.length > 0) {
    if (mongoQuery.record && mongoQuery.record.$in) {
      // Intersect with authorized record IDs
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

  const topK = options.topK || 10;

  // 4. Optional: MongoDB Atlas Vector Search ($vectorSearch) if explicitly enabled
  if (process.env.USE_ATLAS_VECTOR_SEARCH === "true") {
    try {
      const atlasIndexName = process.env.ATLAS_VECTOR_INDEX_NAME || "vector_index";
      const pipeline = [
        {
          $vectorSearch: {
            index: atlasIndexName,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: topK * 10,
            limit: topK * 2,
            filter: mongoQuery,
          },
        },
        {
          $project: {
            chunkId: 1,
            patient: 1,
            record: 1,
            pageNumber: 1,
            sectionName: 1,
            reportDate: 1,
            reportTitle: 1,
            category: 1,
            extractedText: 1,
            extractionMethod: 1,
            tokenCount: 1,
            vectorScore: { $meta: "vectorSearchScore" },
          },
        },
      ];

      const atlasResults = await ReportChunk.aggregate(pipeline);
      if (atlasResults && atlasResults.length > 0) {
        return atlasResults.map((r) => ({
          ...r,
          matchType: "semantic",
        }));
      }
    } catch (atlasErr) {
      // Note: MongoDB Community Edition does not support $vectorSearch
      console.warn("ℹ️ [Atlas Vector Search Notice]: $vectorSearch not supported on local MongoDB Community Edition; running in-engine cosine similarity.");
    }
  }

  // 5. Primary / Local MongoDB Mode: Fetch security-filtered candidate chunks from MongoDB
  const chunks = await ReportChunk.find(mongoQuery)
    .select("chunkId patient record pageNumber sectionName reportDate reportTitle category extractedText embedding extractionMethod tokenCount")
    .lean();

  if (chunks.length === 0) {
    return [];
  }

  // 6. Compute exact mathematical cosine similarity for each authorized candidate
  const scoredChunks = [];
  for (const chunk of chunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) continue;
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    scoredChunks.push({
      ...chunk,
      vectorScore: similarity,
      matchType: "semantic",
    });
  }

  // 7. Sort descending by cosine similarity
  scoredChunks.sort((a, b) => b.vectorScore - a.vectorScore);

  return scoredChunks.slice(0, topK);
};
