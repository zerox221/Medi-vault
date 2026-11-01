import crypto from "crypto";
import { cleanMedicalText } from "./textCleaningService.js";

// Clinical section header patterns commonly found in pathology & radiology reports
const SECTION_HEADERS = [
  { pattern: /(?:complete\s*blood\s*count|cbc|hematology|haematology)\b/i, name: "Complete Blood Count (CBC)" },
  { pattern: /(?:differential\s*leucocyte\s*count|dlc)\b/i, name: "Differential Leucocyte Count" },
  { pattern: /(?:lipid\s*profile|cholesterol\s*profile)\b/i, name: "Lipid Profile" },
  { pattern: /(?:liver\s*function\s*test|lft|hepatic\s*panel)\b/i, name: "Liver Function Test (LFT)" },
  { pattern: /(?:kidney\s*function\s*test|kft|renal\s*panel|rft)\b/i, name: "Kidney Function Test (KFT)" },
  { pattern: /(?:thyroid\s*profile|thyroid\s*function\s*test|tft)\b/i, name: "Thyroid Profile" },
  { pattern: /(?:urine\s*routine|urine\s*analysis|urinalysis)\b/i, name: "Urine Analysis" },
  { pattern: /(?:blood\s*glucose|blood\s*sugar|hba1c|glycated\s*hemoglobin)\b/i, name: "Diabetes & Blood Sugar" },
  { pattern: /(?:cardiac\s*markers|cardiology|ecg|echocardiogram)\b/i, name: "Cardiology" },
  { pattern: /(?:radiology|x-ray|ct\s*scan|mri|ultrasound|usg)\b/i, name: "Radiology & Imaging" },
  { pattern: /(?:remarks|interpretation|clinical\s*notes|comments)\b/i, name: "Remarks / Interpretation" },
  { pattern: /(?:findings|impression|diagnosis|conclusion)\b/i, name: "Findings / Impression" },
  { pattern: /(?:patient\s*details|patient\s*name|specimen|demographics)\b/i, name: "Patient Details" },
];

/**
 * Estimates token count from text (~4 chars per token)
 */
export const estimateTokenCount = (text) => {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
};

/**
 * Identifies the clinical section of a line or block of text
 */
export const detectSectionName = (text, currentSection = "General") => {
  if (!text) return currentSection;
  for (const sec of SECTION_HEADERS) {
    if (sec.pattern.test(text)) {
      return sec.name;
    }
  }
  return currentSection;
};

/**
 * Splits extracted pages of a medical report into contextual, medical-aware chunks
 *
 * @param {Array} pages - Array of { pageNumber, text, extractionMethod }
 * @param {Object} metadata - { patientId, recordId, reportTitle, reportDate, category }
 * @param {Object} options - { chunkSizeTokens: 450, chunkOverlapTokens: 50 }
 */
export const chunkMedicalReport = (pages, metadata, options = {}) => {
  const targetTokens = options.chunkSizeTokens || 450;
  const overlapTokens = options.chunkOverlapTokens || 50;

  const targetChars = targetTokens * 4; // ~1800 chars
  const overlapChars = overlapTokens * 4; // ~200 chars

  const chunks = [];
  let chunkSequence = 0;

  for (const page of pages) {
    const pageNum = page.pageNumber || 1;
    const pageText = cleanMedicalText(page.text || "");
    const extractionMethod = page.extractionMethod || "pdf_text";

    if (!pageText || pageText.trim().length === 0) continue;

    // Split page text into logical blocks (lines/paragraphs)
    const rawLines = pageText.split("\n");
    const lines = [];

    // Combine adjacent lines if they form a single test row (e.g. test name on line 1, value on line 2)
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;
      lines.push(line);
    }

    let currentSection = "General";
    let currentBlock = [];
    let currentBlockChars = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const detected = detectSectionName(line, currentSection);
      const isNewSection = detected !== currentSection && detected !== "General";

      // If a new major clinical section starts or the block exceeds target size, seal chunk
      if (
        (isNewSection && currentBlock.length > 0 && currentBlockChars > targetChars * 0.4) ||
        currentBlockChars + line.length > targetChars
      ) {
        const chunkText = currentBlock.join("\n");
        chunkSequence++;
        const chunkId = `${metadata.recordId}_p${pageNum}_c${chunkSequence}`;

        chunks.push({
          chunkId,
          patient: metadata.patientId,
          record: metadata.recordId,
          pageNumber: pageNum,
          sectionName: currentSection,
          reportDate: metadata.reportDate || new Date().toISOString().split("T")[0],
          reportTitle: metadata.reportTitle || "Medical Report",
          category: metadata.category || "Lab Reports",
          extractedText: chunkText,
          tokenCount: estimateTokenCount(chunkText),
          extractionMethod,
          metadata: {
            detectedSection: currentSection,
            pageNumber: pageNum,
          },
        });

        // Retain overlap lines for context continuity
        const overlapLines = [];
        let overlapCharsCount = 0;
        for (let j = currentBlock.length - 1; j >= 0; j--) {
          if (overlapCharsCount + currentBlock[j].length <= overlapChars) {
            overlapLines.unshift(currentBlock[j]);
            overlapCharsCount += currentBlock[j].length;
          } else {
            break;
          }
        }

        currentBlock = [...overlapLines];
        currentBlockChars = overlapCharsCount;

        if (isNewSection) {
          currentSection = detected;
        }
      } else if (isNewSection) {
        currentSection = detected;
      }

      currentBlock.push(line);
      currentBlockChars += line.length + 1;
    }

    // Push remaining block for this page
    if (currentBlock.length > 0) {
      const chunkText = currentBlock.join("\n");
      chunkSequence++;
      const chunkId = `${metadata.recordId}_p${pageNum}_c${chunkSequence}`;

      chunks.push({
        chunkId,
        patient: metadata.patientId,
        record: metadata.recordId,
        pageNumber: pageNum,
        sectionName: currentSection,
        reportDate: metadata.reportDate || new Date().toISOString().split("T")[0],
        reportTitle: metadata.reportTitle || "Medical Report",
        category: metadata.category || "Lab Reports",
        extractedText: chunkText,
        tokenCount: estimateTokenCount(chunkText),
        extractionMethod,
        metadata: {
          detectedSection: currentSection,
          pageNumber: pageNum,
        },
      });
    }
  }

  return chunks;
};
