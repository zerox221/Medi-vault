import pgvector from "pgvector/pg";
import {
  getPostgresPool,
  testPostgresConnection,
  isPostgresConfigured,
  getPgvectorVersion,
} from "../../config/postgres.js";
import { getRagConfig } from "../../config/env.js";

let schemaInitialized = false;

/**
 * Initializes the PostgreSQL pgvector extension, table schema, and indexes.
 * Creates report_chunks with vector(3072) storage matching Gemini embedding dimension.
 */
export const initPostgresSchema = async () => {
  if (schemaInitialized) return true;
  if (!isPostgresConfigured()) {
    throw new Error("PostgreSQL is not configured. Please set DATABASE_URL in backend/.env.");
  }

  const isConnected = await testPostgresConnection();
  if (!isConnected) {
    throw new Error("Could not connect to Neon PostgreSQL database. Verify DATABASE_URL and SSL mode.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error("PostgreSQL connection pool could not be initialized.");
  }

  const client = await pool.connect();
  try {
    const config = getRagConfig();
    const dimensions = parseInt(process.env.PGVECTOR_DIMENSIONS || "3072", 10);

    // Verify embedding dimension matches active model
    console.log(
      `🔍 [pgvector Schema]: Target embedding model: '${config.geminiEmbeddingModel}' -> Configuring vector(${dimensions}) storage.`
    );

    await client.query("BEGIN;");

    // 1. Ensure vector extension exists
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");

    // 2. Create report_chunks table with verified 3072-dim vector column
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS report_chunks (
        id BIGSERIAL PRIMARY KEY,
        chunk_id VARCHAR(255) UNIQUE NOT NULL,
        patient_id VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        page_number INT NOT NULL DEFAULT 1,
        section_name VARCHAR(255) DEFAULT 'General',
        report_date VARCHAR(50),
        report_title VARCHAR(255) DEFAULT 'Medical Report',
        category VARCHAR(100) DEFAULT 'Lab Reports',
        extracted_text TEXT NOT NULL,
        token_count INT DEFAULT 0,
        extraction_method VARCHAR(50) DEFAULT 'pdf_text',
        embedding vector(${dimensions}),
        embedding_model VARCHAR(100) DEFAULT 'gemini-embedding-001',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);

    // 3. Security, partition, and text search indexes
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_patient ON report_chunks (patient_id);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_record ON report_chunks (record_id);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_patient_record ON report_chunks (patient_id, record_id);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_report_date ON report_chunks (report_date DESC);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_patient_date ON report_chunks (patient_id, report_date DESC);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_chunks_fts ON report_chunks USING GIN (to_tsvector('english', extracted_text));");

    await client.query("COMMIT;");

    schemaInitialized = true;
    console.log(
      `🐘 [Neon pgvector]: Schema verified. Table 'report_chunks' active with vector(${dimensions}) storage.`
    );
    return true;
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("❌ [Postgres Schema Init Error]:", err.message);
    throw new Error(`Failed to initialize PostgreSQL pgvector schema: ${err.message}`);
  } finally {
    client.release();
  }
};

/**
 * Saves embedded report chunks to PostgreSQL report_chunks table.
 * Purges previous chunks for the recordId to avoid duplicate chunking.
 *
 * @param {Array<Object>} chunks - Array of chunk objects with embeddings
 * @param {string} recordId - Target MedicalRecord ObjectId
 */
export const saveChunksToPostgres = async (chunks, recordId) => {
  if (!chunks || chunks.length === 0) return { success: true, count: 0 };

  await initPostgresSchema();

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error("No PostgreSQL connection pool available to save chunks.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // Purge previous chunks for this record
    await client.query("DELETE FROM report_chunks WHERE record_id = $1;", [recordId.toString()]);

    const insertQuery = `
      INSERT INTO report_chunks (
        chunk_id, patient_id, record_id, page_number, section_name,
        report_date, report_title, category, extracted_text,
        token_count, extraction_method, embedding, embedding_model, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector, $13, $14::jsonb
      )
      ON CONFLICT (chunk_id) DO UPDATE SET
        extracted_text = EXCLUDED.extracted_text,
        embedding = EXCLUDED.embedding,
        section_name = EXCLUDED.section_name,
        page_number = EXCLUDED.page_number,
        updated_at = CURRENT_TIMESTAMP;
    `;

    for (const chunk of chunks) {
      const chunkId = chunk.chunkId || `${recordId}_p${chunk.pageNumber || 1}_${Math.random().toString(36).substring(2, 9)}`;
      const patientId = (chunk.patient || chunk.patientId || "").toString();
      const recId = (chunk.record || chunk.recordId || recordId).toString();
      const pageNumber = parseInt(chunk.pageNumber || 1, 10);
      const sectionName = chunk.sectionName || "General";
      const reportDate = chunk.reportDate || new Date().toISOString().split("T")[0];
      const reportTitle = chunk.reportTitle || "Medical Report";
      const category = chunk.category || "Lab Reports";
      const extractedText = chunk.extractedText || "";
      const tokenCount = parseInt(chunk.tokenCount || 0, 10);
      const extractionMethod = chunk.extractionMethod || "pdf_text";
      const embeddingSql = chunk.embedding && chunk.embedding.length > 0 ? pgvector.toSql(chunk.embedding) : null;
      const embeddingModel = chunk.embeddingModel || "gemini-embedding-001";
      const metadata = JSON.stringify(chunk.metadata || {});

      await client.query(insertQuery, [
        chunkId,
        patientId,
        recId,
        pageNumber,
        sectionName,
        reportDate,
        reportTitle,
        category,
        extractedText,
        tokenCount,
        extractionMethod,
        embeddingSql,
        embeddingModel,
        metadata,
      ]);
    }

    await client.query("COMMIT;");
    console.log(`🐘 [Neon pgvector]: Persisted ${chunks.length} chunks for record ${recordId} into PostgreSQL.`);
    return { success: true, count: chunks.length };
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error(`❌ [PostgreSQL Chunk Storage Error]:`, err.message);
    throw new Error(`Failed to save chunks to PostgreSQL: ${err.message}`);
  } finally {
    client.release();
  }
};

/**
 * Counts chunks in PostgreSQL for a given patient
 */
export const countPatientChunksPostgres = async (patientId) => {
  if (!patientId) return 0;
  await initPostgresSchema();
  const pool = getPostgresPool();
  if (!pool) return 0;

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT COUNT(*) as count FROM report_chunks WHERE patient_id = $1;", [patientId.toString()]);
    return parseInt(res.rows[0]?.count || 0, 10);
  } finally {
    client.release();
  }
};

/**
 * Executes a security-scoped vector similarity search using PostgreSQL pgvector (<=> cosine distance).
 *
 * @param {Object} accessScope - { patientIds: string[], recordIds?: string[] }
 * @param {Array<number>} queryEmbedding - 3072-dimensional embedding array
 * @param {Object} options - { topK, category, dateRange }
 */
export const searchVectorPostgres = async (accessScope, queryEmbedding, options = {}) => {
  await initPostgresSchema();

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error("PostgreSQL connection pool not found.");
  }

  const patientIds = (accessScope.patientIds || []).map((id) => id.toString());
  if (patientIds.length === 0) {
    throw new Error("Security Violation: Vector search must be scoped by authorized patient IDs.");
  }

  const recordIds = options.recordIds && options.recordIds.length > 0
    ? options.recordIds.map((id) => id.toString())
    : (accessScope.recordIds && accessScope.recordIds.length > 0
      ? accessScope.recordIds.map((id) => id.toString())
      : null);

  const category = (options.category && options.category !== "All Reports" && options.category !== "All Categories")
    ? `%${options.category}%`
    : null;

  const dateFrom = options.dateRange?.from || null;
  const dateTo = options.dateRange?.to || null;
  const topK = parseInt(options.topK || 5, 10);

  const vectorSql = pgvector.toSql(queryEmbedding);

  const query = `
    SELECT
      chunk_id AS "chunkId",
      patient_id AS "patient",
      record_id AS "record",
      page_number AS "pageNumber",
      section_name AS "sectionName",
      report_date AS "reportDate",
      report_title AS "reportTitle",
      category,
      extracted_text AS "extractedText",
      extraction_method AS "extractionMethod",
      token_count AS "tokenCount",
      1 - (embedding <=> $1::vector) AS "vectorScore"
    FROM report_chunks
    WHERE
      patient_id = ANY($2::text[])
      AND ($3::text[] IS NULL OR record_id = ANY($3::text[]))
      AND ($4::text IS NULL OR category ILIKE $4)
      AND ($5::text IS NULL OR report_date >= $5)
      AND ($6::text IS NULL OR report_date <= $6)
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector ASC
    LIMIT $7;
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(query, [
      vectorSql,
      patientIds,
      recordIds,
      category,
      dateFrom,
      dateTo,
      topK,
    ]);

    return res.rows.map((row) => ({
      chunkId: row.chunkId,
      patient: row.patient,
      record: row.record,
      pageNumber: row.pageNumber,
      sectionName: row.sectionName,
      reportDate: row.reportDate,
      reportTitle: row.reportTitle,
      category: row.category,
      extractedText: row.extractedText,
      extractionMethod: row.extractionMethod,
      tokenCount: row.tokenCount,
      vectorScore: Math.max(0, Math.min(1, parseFloat(row.vectorScore) || 0)),
      matchType: "semantic",
    }));
  } catch (err) {
    console.error("❌ [Postgres Vector Search Error]:", err.message);
    throw new Error(`PostgreSQL Vector Search Error: ${err.message}`);
  } finally {
    client.release();
  }
};

/**
 * Executes a security-scoped full-text and keyword search using PostgreSQL.
 *
 * @param {Object} accessScope - { patientIds: string[], recordIds?: string[] }
 * @param {string} queryText - Clinical terms or values to search
 * @param {Object} options - { limit, category, dateRange, recordIds }
 */
export const searchKeywordPostgres = async (accessScope, queryText, options = {}) => {
  await initPostgresSchema();

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error("PostgreSQL connection pool not found.");
  }

  const cleanQuery = (queryText || "").trim();
  if (!cleanQuery) return [];

  const patientIds = (accessScope.patientIds || []).map((id) => id.toString());
  if (patientIds.length === 0) {
    throw new Error("Security Violation: Keyword search must be scoped by authorized patient IDs.");
  }

  const recordIds = options.recordIds && options.recordIds.length > 0
    ? options.recordIds.map((id) => id.toString())
    : (accessScope.recordIds && accessScope.recordIds.length > 0
      ? accessScope.recordIds.map((id) => id.toString())
      : null);

  const category = (options.category && options.category !== "All Reports" && options.category !== "All Categories")
    ? `%${options.category}%`
    : null;

  const dateFrom = options.dateRange?.from || null;
  const dateTo = options.dateRange?.to || null;
  const limit = parseInt(options.limit || 10, 10);

  const query = `
    SELECT
      chunk_id AS "chunkId",
      patient_id AS "patient",
      record_id AS "record",
      page_number AS "pageNumber",
      section_name AS "sectionName",
      report_date AS "reportDate",
      report_title AS "reportTitle",
      category,
      extracted_text AS "extractedText",
      extraction_method AS "extractionMethod",
      token_count AS "tokenCount",
      CASE
        WHEN extracted_text ILIKE ('%' || $1 || '%') THEN 0.95
        WHEN to_tsvector('english', extracted_text) @@ plainto_tsquery('english', $1) THEN 0.75
        ELSE 0.40
      END AS "keywordScore",
      CASE
        WHEN extracted_text ILIKE ('%' || $1 || '%') THEN 'exact'
        ELSE 'keyword'
      END AS "matchType"
    FROM report_chunks
    WHERE
      patient_id = ANY($2::text[])
      AND ($3::text[] IS NULL OR record_id = ANY($3::text[]))
      AND ($4::text IS NULL OR category ILIKE $4)
      AND ($5::text IS NULL OR report_date >= $5)
      AND ($6::text IS NULL OR report_date <= $6)
      AND (
        to_tsvector('english', extracted_text) @@ plainto_tsquery('english', $1)
        OR extracted_text ILIKE ('%' || $1 || '%')
        OR section_name ILIKE ('%' || $1 || '%')
        OR report_title ILIKE ('%' || $1 || '%')
      )
    ORDER BY
      (CASE WHEN extracted_text ILIKE ('%' || $1 || '%') THEN 1 ELSE 0 END) DESC,
      ts_rank_cd(to_tsvector('english', extracted_text), plainto_tsquery('english', $1)) DESC
    LIMIT $7;
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(query, [
      cleanQuery,
      patientIds,
      recordIds,
      category,
      dateFrom,
      dateTo,
      limit,
    ]);

    return res.rows.map((row) => {
      const text = row.extractedText || "";
      const lowerQuery = cleanQuery.toLowerCase();
      const matchIdx = text.toLowerCase().indexOf(lowerQuery);

      let snippet = "";
      if (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 70);
        const end = Math.min(text.length, matchIdx + cleanQuery.length + 150);
        snippet = (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");
      } else {
        snippet = text.slice(0, 180) + "...";
      }

      return {
        chunkId: row.chunkId,
        patient: row.patient,
        record: row.record,
        pageNumber: row.pageNumber,
        sectionName: row.sectionName,
        reportDate: row.reportDate,
        reportTitle: row.reportTitle,
        category: row.category,
        extractedText: row.extractedText,
        extractionMethod: row.extractionMethod,
        tokenCount: row.tokenCount,
        keywordScore: parseFloat(row.keywordScore) || 0.5,
        matchType: row.matchType,
        highlightSnippet: snippet,
      };
    });
  } catch (err) {
    console.error("❌ [Postgres Keyword Search Error]:", err.message);
    throw new Error(`PostgreSQL Keyword Search Error: ${err.message}`);
  } finally {
    client.release();
  }
};

/**
 * Deletes chunks belonging to a specific record in PostgreSQL.
 */
export const deleteChunksPostgres = async (recordId) => {
  await initPostgresSchema();
  const pool = getPostgresPool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    await client.query("DELETE FROM report_chunks WHERE record_id = $1;", [recordId.toString()]);
    return true;
  } catch (err) {
    console.error("❌ [Postgres Delete Chunks Error]:", err.message);
    throw new Error(`Failed to delete chunks from PostgreSQL: ${err.message}`);
  } finally {
    client.release();
  }
};
