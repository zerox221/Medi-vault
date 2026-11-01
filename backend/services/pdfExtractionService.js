import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import pdfParse from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const backendServerPath = path.join(backendRoot, "server.js");

/**
 * Normalizes text extracted from PDFs where adjacent table cells have no spacing
 * e.g., "Haemoglobin11.2g/dL13.0 - 17.0LOW" -> "Haemoglobin 11.2 g/dL 13.0 - 17.0 LOW"
 */
export const normalizeExtractedText = (rawText) => {
  if (!rawText) return "";

  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Separate letters touching numbers in table outputs (e.g., "Haemoglobin11.2" -> "Haemoglobin 11.2")
    .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
    // Separate numbers touching units (e.g., "11.2g/dL" -> "11.2 g/dL")
    .replace(/([0-9])([a-zA-Z%])/g, "$1 $2")
    // Separate units touching ranges (e.g., "g/dL13.0" -> "g/dL 13.0")
    .replace(/([a-zA-Z%])([0-9])/g, "$1 $2")
    // Separate ranges touching flags (e.g., "17.0LOW" -> "17.0 LOW", "200HIGH" -> "200 HIGH")
    .replace(/([0-9])(HIGH|LOW|CRITICAL|ABNORMAL|NORMAL)\b/gi, "$1 $2")
    .replace(/[ \t]+/g, " ")
    .trim();
};

/**
 * Primary worker: Extracts text using an isolated child process.
 * This prevents pdf.js module-scoped global state corruption across multiple files.
 */
const extractWithIsolatedProcess = (filePath) => {
  const script = `
    const fs = require('fs');
    const path = require('path');
    const { createRequire } = require('module');
    const serverPath = process.argv[1];
    const targetFile = process.argv[2];
    const backendRequire = createRequire(serverPath);
    const pdfParse = backendRequire('pdf-parse');
    const dataBuffer = fs.readFileSync(targetFile);
    pdfParse(dataBuffer).then(d => {
      process.stdout.write(d.text || '');
      process.exit(0);
    }).catch(err => {
      process.stderr.write(err.message || String(err));
      process.exit(1);
    });
  `;

  const result = spawnSync(process.execPath, ["-e", script, backendServerPath, path.resolve(filePath)], {
    encoding: "utf8",
    maxBuffer: 25 * 1024 * 1024,
    timeout: 15000,
  });

  if (result.status === 0 && result.stdout) {
    return result.stdout;
  }

  if (result.stderr) {
    console.warn("⚠️ [Isolated PDF Parser Note]:", result.stderr.slice(0, 150));
  }
  return "";
};

/**
 * Fallback: Raw PDF stream text scanner for text enclosed in BT/ET blocks or parentheses
 */
const extractRawPdfStreams = (buffer) => {
  try {
    const content = buffer.toString("binary");
    const textMatches = [];
    const streamRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = streamRegex.exec(content)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, "$1").trim();
      if (clean.length > 0 && /^[ -~\t\n\r]+$/.test(clean)) {
        textMatches.push(clean);
      }
    }
    return textMatches.join(" ");
  } catch (err) {
    console.warn("⚠️ [Raw Stream Extractor Error]:", err.message);
    return "";
  }
};

/**
 * Extract raw text from a PDF file path or Buffer
 * Resilient multi-tier strategy: Isolated Worker -> Direct In-Process -> Stream Scanner
 */
export const extractTextFromPdf = async (filePathOrBuffer) => {
  try {
    let targetFilePath = null;
    let isTempFile = false;
    let dataBuffer = null;

    if (typeof filePathOrBuffer === "string") {
      targetFilePath = path.resolve(filePathOrBuffer);
      if (!fs.existsSync(targetFilePath)) {
        console.warn("⚠️ PDF file not found at path:", targetFilePath);
        return "";
      }
      dataBuffer = fs.readFileSync(targetFilePath);
    } else if (Buffer.isBuffer(filePathOrBuffer)) {
      dataBuffer = filePathOrBuffer;
      const tempPath = path.join(os.tmpdir(), `medivault_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
      fs.writeFileSync(tempPath, dataBuffer);
      targetFilePath = tempPath;
      isTempFile = true;
    } else {
      console.warn("⚠️ Invalid PDF input: must be file path string or Buffer.");
      return "";
    }

    let extractedText = "";

    // Tier 1: Isolated child process
    if (targetFilePath && fs.existsSync(targetFilePath)) {
      extractedText = extractWithIsolatedProcess(targetFilePath);
    }

    // Tier 2: Direct in-process pdf-parse
    if (!extractedText || extractedText.trim().length === 0) {
      try {
        const parsed = await pdfParse(dataBuffer);
        extractedText = parsed.text || "";
      } catch (inProcessErr) {
        console.warn("⚠️ [In-Process PDF Parse Warning]:", inProcessErr.message);
      }
    }

    // Tier 3: Direct binary stream text recovery
    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = extractRawPdfStreams(dataBuffer);
    }

    // Clean up temporary file if created
    if (isTempFile && targetFilePath && fs.existsSync(targetFilePath)) {
      try {
        fs.unlinkSync(targetFilePath);
      } catch {}
    }

    const cleanedText = extractedText
      ? extractedText.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim()
      : "";

    return cleanedText;
  } catch (error) {
    console.warn("⚠️ [PDF Extraction Warning]: Could not extract text from PDF:", error.message);
    return "";
  }
};

/**
 * Resolves a local or cached file for a MedicalRecord and extracts text if not already present
 */
export const resolveAndExtractRecordText = async (record) => {
  if (!record) return "";
  if (record.extractedText && record.extractedText.trim().length > 20) {
    return record.extractedText;
  }

  const candidateDirectories = [
    path.resolve("uploads"),
    path.resolve("backend", "uploads"),
    path.resolve(__dirname, "..", "uploads"),
    path.resolve(__dirname, "..", "..", "uploads"),
  ];

  const candidateFilenames = [];
  if (record.publicId) {
    candidateFilenames.push(record.publicId.replace(/^local_/, ""));
  }
  if (record.fileUrl) {
    candidateFilenames.push(path.basename(record.fileUrl));
  }

  for (const dir of candidateDirectories) {
    if (!fs.existsSync(dir)) continue;

    for (const fn of candidateFilenames) {
      const fullPath = path.join(dir, fn);
      if (fs.existsSync(fullPath)) {
        const text = await extractTextFromPdf(fullPath);
        if (text && text.trim().length > 0) return text;
      }
    }

    try {
      const files = fs.readdirSync(dir);
      const sanitizedTitle = (record.title || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      for (const f of files) {
        if (!f.endsWith(".pdf")) continue;
        const sanitizedFile = f.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (sanitizedTitle.length > 3 && sanitizedFile.includes(sanitizedTitle)) {
          const fullPath = path.join(dir, f);
          const text = await extractTextFromPdf(fullPath);
          if (text && text.trim().length > 0) return text;
        }
      }
    } catch {}
  }

  return record.extractedText || "";
};

