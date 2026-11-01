import fs from "fs";
import path from "path";
import os from "os";

/**
 * Optical Character Recognition (OCR) Service for Scanned / Image-only Medical PDFs
 * Uses tesseract.js with fallback mechanisms
 */
export const runOcrOnPage = async (imageBufferOrPath, language = "eng") => {
  const ocrEnabled = process.env.OCR_ENABLED !== "false";
  if (!ocrEnabled) {
    return { success: false, text: "", reason: "OCR is disabled in configuration." };
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker(language);

    const ret = await worker.recognize(imageBufferOrPath);
    await worker.terminate();

    const text = ret.data.text || "";
    return {
      success: true,
      text: text.trim(),
      confidence: ret.data.confidence || 0,
    };
  } catch (error) {
    console.warn("⚠️ [OCR Service Warning]: Could not execute OCR on page:", error.message);
    return { success: false, text: "", reason: error.message };
  }
};

/**
 * Inspects extracted pages from a PDF. If any page has suspiciously low text (< 50 chars),
 * flags it as needing OCR fallback.
 */
export const evaluatePagesForOcr = (pages) => {
  let needsOcr = false;
  const evaluatedPages = pages.map((page) => {
    const isThin = !page.text || page.text.trim().length < 50;
    if (isThin) needsOcr = true;
    return {
      ...page,
      needsOcr: isThin,
      extractionMethod: isThin ? "ocr" : "pdf_text",
    };
  });

  return {
    needsOcr,
    pages: evaluatedPages,
  };
};
