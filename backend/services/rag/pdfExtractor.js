import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { normalizeExtractedText, extractTextFromPdf } from "../pdfExtractionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const backendServerPath = path.join(backendRoot, "server.js");

/**
 * Extracts page-aware text from a PDF file
 * Returns an array of pages: [{ pageNumber: 1, text: "..." }, ...]
 */
export const extractPagesFromPdf = async (filePathOrBuffer) => {
  let targetPath = null;
  let isTemp = false;

  try {
    if (typeof filePathOrBuffer === "string") {
      targetPath = path.resolve(filePathOrBuffer);
    } else if (Buffer.isBuffer(filePathOrBuffer)) {
      targetPath = path.join(os.tmpdir(), `medivault_extract_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
      fs.writeFileSync(targetPath, filePathOrBuffer);
      isTemp = true;
    }

    // Try extracting with isolated worker that preserves form feed / page boundaries
    const script = `
      const fs = require('fs');
      const { createRequire } = require('module');
      const serverPath = process.argv[1];
      const targetFile = process.argv[2];
      const backendRequire = createRequire(serverPath);
      const pdfParse = backendRequire('pdf-parse');
      const buffer = fs.readFileSync(targetFile);

      pdfParse(buffer).then(data => {
        process.stdout.write(JSON.stringify({
          numPages: data.numpages || 1,
          rawText: data.text || ''
        }));
        process.exit(0);
      }).catch(err => {
        process.stderr.write(err.message || String(err));
        process.exit(1);
      });
    `;

    const result = spawnSync(process.execPath, ["-e", script, backendServerPath, targetPath], {
      encoding: "utf8",
      maxBuffer: 30 * 1024 * 1024,
      timeout: 20000,
    });

    let numPages = 1;
    let rawText = "";

    if (result.status === 0 && result.stdout) {
      try {
        const parsed = JSON.parse(result.stdout);
        numPages = parsed.numPages || 1;
        rawText = parsed.rawText || "";
      } catch {
        rawText = result.stdout;
      }
    }

    // Fallback if worker returned empty text
    if (!rawText || rawText.trim().length === 0) {
      rawText = await extractTextFromPdf(targetPath);
    }

    // Clean up temporary file
    if (isTemp && targetPath && fs.existsSync(targetPath)) {
      try { fs.unlinkSync(targetPath); } catch {}
    }

    if (!rawText || rawText.trim().length === 0) {
      return { totalPages: 0, pages: [], fullText: "" };
    }

    // Split pages using multiple boundary heuristics:
    // 1. Form feed \f
    // 2. Explicit "Page X" or "Page X of Y" headers/footers
    let pageSegments = [];

    if (rawText.includes("\f")) {
      pageSegments = rawText.split("\f");
    } else if (/(?:\r?\n|^)\s*Page\s+\d+(?:\s*(?:of|\/)\s*\d+)?\s*(?:\r?\n|$)/i.test(rawText)) {
      // Split on Page X markers while keeping page context
      const parts = rawText.split(/(?=(?:\r?\n|^)\s*Page\s+\d+)/i);
      pageSegments = parts.filter((p) => p.trim().length > 0);
    } else {
      // Single continuous page
      pageSegments = [rawText];
    }

    const pages = [];
    for (let i = 0; i < pageSegments.length; i++) {
      const seg = pageSegments[i];
      const pageNumMatch = seg.match(/Page\s+(\d+)/i);
      const pageNum = pageNumMatch ? parseInt(pageNumMatch[1], 10) : i + 1;
      const normalized = normalizeExtractedText(seg);

      if (normalized.trim().length > 0) {
        pages.push({
          pageNumber: pageNum,
          text: normalized,
          charCount: normalized.length,
        });
      }
    }

    // If no pages were parsed, fall back to single page with all text
    if (pages.length === 0) {
      const normalizedAll = normalizeExtractedText(rawText);
      pages.push({
        pageNumber: 1,
        text: normalizedAll,
        charCount: normalizedAll.length,
      });
    }

    return {
      totalPages: Math.max(numPages, pages.length),
      pages,
      fullText: pages.map((p) => p.text).join("\n\n"),
    };
  } catch (error) {
    console.warn("⚠️ [Page-aware PDF Extractor Warning]:", error.message);
    if (isTemp && targetPath && fs.existsSync(targetPath)) {
      try { fs.unlinkSync(targetPath); } catch {}
    }
    const fallbackText = await extractTextFromPdf(filePathOrBuffer);
    const normalizedFallback = normalizeExtractedText(fallbackText);
    return {
      totalPages: 1,
      pages: [{ pageNumber: 1, text: normalizedFallback, charCount: normalizedFallback.length }],
      fullText: normalizedFallback,
    };
  }
};
