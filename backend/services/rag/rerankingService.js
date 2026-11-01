/**
 * Hybrid Scoring, Deduplication & Reranking Service for Medical RAG
 */

export const rerankAndDeduplicateChunks = (vectorResults = [], keywordResults = [], options = {}) => {
  const topK = options.topK || 5;
  const chunkMap = new Map();

  // 1. Process Vector Search Results
  for (const item of vectorResults) {
    const id = item.chunkId;
    if (!chunkMap.has(id)) {
      chunkMap.set(id, {
        chunk: item,
        vectorScore: item.vectorScore || 0,
        keywordScore: 0,
        matchType: "semantic",
        highlightSnippet: item.extractedText ? item.extractedText.slice(0, 180) + "..." : "",
      });
    } else {
      chunkMap.get(id).vectorScore = item.vectorScore || 0;
    }
  }

  // 2. Process Keyword Search Results
  for (const item of keywordResults) {
    const id = item.chunkId;
    if (!chunkMap.has(id)) {
      chunkMap.set(id, {
        chunk: item,
        vectorScore: 0,
        keywordScore: item.keywordScore || 0,
        matchType: item.matchType || "exact",
        highlightSnippet: item.highlightSnippet || item.extractedText.slice(0, 180) + "...",
      });
    } else {
      const entry = chunkMap.get(id);
      entry.keywordScore = item.keywordScore || 0;
      entry.matchType = "hybrid";
      if (item.highlightSnippet) entry.highlightSnippet = item.highlightSnippet;
    }
  }

  // 3. Compute Composite Hybrid Score
  // Weights: 65% vector similarity, 35% keyword match, with boost for exact match in section/title
  const combined = [];
  for (const [id, entry] of chunkMap.entries()) {
    const v = entry.vectorScore;
    const k = entry.keywordScore;

    let hybridScore = 0;
    if (v > 0 && k > 0) {
      // Found in both semantic & keyword searches
      hybridScore = (v * 0.60) + (k * 0.40) + 0.10; // 10% co-occurrence bonus
    } else if (v > 0) {
      hybridScore = v * 0.85;
    } else {
      hybridScore = k * 0.75;
    }

    // Section relevance boost (CBC, Lipid, LFT, etc. get higher relevance than pure "General")
    if (entry.chunk.sectionName && entry.chunk.sectionName !== "General") {
      hybridScore += 0.05;
    }

    combined.push({
      ...entry.chunk,
      hybridScore: Number(Math.min(1.0, hybridScore).toFixed(4)),
      matchType: entry.matchType,
      highlightSnippet: entry.highlightSnippet,
    });
  }

  // 4. Sort descending by hybrid score
  combined.sort((a, b) => b.hybridScore - a.hybridScore);

  // 5. Select top-K most relevant chunks
  return combined.slice(0, topK);
};
