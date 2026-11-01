/**
 * Environment Configuration & Startup Validator for MediVault Backend
 * Configured for MongoDB (Primary Database) & Google Gemini AI Medical RAG
 */

export const getRagConfig = () => {
  return {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE, 10) || 450,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP, 10) || 50,
    topK: parseInt(process.env.RAG_TOP_K, 10) || 5,
    similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.25,
    maxContextTokens: parseInt(process.env.RAG_MAX_CONTEXT_TOKENS, 10) || 3000,
    maxAnswerTokens: parseInt(process.env.RAG_MAX_ANSWER_TOKENS, 10) || 600,
    geminiApiKey: (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim(),
    geminiModel: (process.env.AI_MODEL || "gemini-3.5-flash").trim(),
    geminiEmbeddingModel: (process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001").trim(),
    useAtlasVectorSearch: process.env.USE_ATLAS_VECTOR_SEARCH === "true",
    atlasVectorIndexName: process.env.ATLAS_VECTOR_INDEX_NAME || "vector_index",
    ocrEnabled: process.env.OCR_ENABLED !== "false",
    ocrLanguage: process.env.OCR_LANGUAGE || "eng",
  };
};

export const validateEnv = () => {
  const missing = [];

  // Required critical variables
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    console.error(`\n❌ [MediVault Config Error] Missing essential environment variables: ${missing.join(", ")}`);
    console.error(`👉 Please update your backend/.env file before running in production.\n`);
  }

  const rag = getRagConfig();

  // 1. Database & Search Capabilities Logging
  console.log(`🍃 [Database]: MongoDB configured as primary database for application data.`);

  if (process.env.VECTOR_STORE === "postgres" || (process.env.DATABASE_URL && process.env.VECTOR_STORE !== "mongodb")) {
    console.log(`🐘 [Vector Store]: Neon PostgreSQL pgvector active for 3072-dim embeddings & similarity search.`);
  } else if (rag.useAtlasVectorSearch) {
    console.log(`☁️ [Vector Search]: MongoDB Atlas native $vectorSearch enabled (Index: '${rag.atlasVectorIndexName}').`);
  } else {
    console.log(`🔍 [Vector Search]: Local MongoDB In-Engine Cosine Similarity active.`);
  }

  console.log(`🔎 [Keyword Search]: MongoDB multi-term clinical regex & text search active.`);

  // 2. AI & RAG Configuration Notice (Google Gemini)
  if (rag.geminiApiKey) {
    console.log(`🤖 [RAG Engine] Google Gemini provider active (Chat: ${rag.geminiModel}, Embeddings: ${rag.geminiEmbeddingModel}).`);
  } else {
    console.log(`🤖 [RAG Engine] Hybrid clinical engine active (Local fallback vectorizer). Add GEMINI_API_KEY in backend/.env.`);
  }

  return {
    isProduction: process.env.NODE_ENV === "production",
    port: process.env.PORT || 5001,
    rag,
  };
};
