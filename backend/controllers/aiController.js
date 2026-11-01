import { MedicalRecord } from "../models/MedicalRecord.js";
import { ReportChunk } from "../models/ReportChunk.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateMedicalReportSummary } from "../services/aiService.js";
import { verifyDoctorRecordAccess } from "../services/sharingService.js";
import { resolveAndExtractRecordText } from "../services/pdfExtractionService.js";
import { logAuditActivity } from "../utils/auditLogger.js";
import {
  patientAskSchema,
  patientSearchSchema,
} from "../validators/aiRequestSchema.js";
import {
  searchMedicalReports,
  answerMedicalQuestion,
  indexMedicalRecord,
} from "../services/rag/ragService.js";
import path from "path";
import fs from "fs";

/**
 * @desc   Trigger AI summary for a medical report
 * @route  POST /api/ai/summarize/:recordId
 */
export const summarizeRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  // Validate access: patient owns or doctor has active sharing
  if (user.role === "user") {
    if (record.patient.toString() !== user._id.toString()) {
      throw new ApiError(403, "Not authorized to access this record.");
    }
  } else if (user.role === "doctor") {
    await verifyDoctorRecordAccess(user._id, record._id);
  }

  // Ensure text is extracted from PDF if not already present
  let text = await resolveAndExtractRecordText(record);
  if (text && (!record.extractedText || record.extractedText.trim().length === 0)) {
    record.extractedText = text;
  }

  const aiSummary = await generateMedicalReportSummary(text, record.title, record.category);

  record.aiSummary = aiSummary;
  await record.save();

  await Activity.create({
    user: user._id,
    userRole: user.role,
    action: "ai_summary",
    description: `Generated AI clinical analysis for '${record.title}'.`,
    relatedRecord: record._id,
  });

  res.status(200).json({
    success: true,
    message: "Medical report summarized successfully.",
    aiSummary,
  });
});

/**
 * @desc   Get AI summary for a medical report
 * @route  GET /api/ai/summary/:recordId
 */
export const getRecordSummary = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  if (user.role === "user") {
    if (record.patient.toString() !== user._id.toString()) {
      throw new ApiError(403, "Not authorized to access this record.");
    }
  } else if (user.role === "doctor") {
    await verifyDoctorRecordAccess(user._id, record._id);
  }

  // If AI summary not already generated, automatically generate and persist to database
  if (!record.aiSummary || !record.aiSummary.summary) {
    try {
      const text = await resolveAndExtractRecordText(record);
      if (text && text.trim().length > 0) {
        record.extractedText = text;
        record.aiSummary = await generateMedicalReportSummary(text, record.title, record.category);
        await record.save();
      }
    } catch (autoErr) {
      console.warn("⚠️ Auto AI summary generation note:", autoErr.message);
    }
  }

  res.status(200).json({
    success: true,
    title: record.title,
    category: record.category,
    reportDate: record.reportDate,
    aiSummary: record.aiSummary || null,
  });
});

/**
 * @desc   Patient asks a natural language question about their own reports (RAG Q&A)
 * @route  POST /api/ai/ask
 */
export const askPatientQuestion = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const validated = patientAskSchema.parse(req.body);

  // Strict isolation: only query chunks owned by authenticated patient
  const accessFilter = { patient: patientId };
  if (validated.recordId) {
    // Check patient owns this record
    const record = await MedicalRecord.findOne({ _id: validated.recordId, patient: patientId });
    if (!record) {
      throw new ApiError(404, "Selected medical record not found in your vault.");
    }
    accessFilter.record = validated.recordId;
  }

  const response = await answerMedicalQuestion({
    accessFilter,
    question: validated.question,
    userRole: "user",
    options: {
      topK: validated.topK || 5,
      category: validated.category,
      dateRange: validated.dateRange,
      recordIds: validated.recordId ? [validated.recordId] : undefined,
    },
  });

  // Log patient activity
  await logAuditActivity({
    userId: patientId,
    userRole: "user",
    action: "ai_qa",
    description: `You asked AI assistant: '${validated.question}'.`,
    relatedPatient: patientId,
    metadata: {
      question: validated.question,
      status: response.status,
      sourcesCount: response.sources?.length || 0,
    },
  });

  res.status(200).json({
    success: true,
    ...response,
  });
});

/**
 * @desc   Patient searches their own reports for medical terms, test names, and values
 * @route  POST /api/ai/search
 */
export const searchPatientReports = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const validated = patientSearchSchema.parse(req.body);

  // Strict isolation: only search chunks owned by authenticated patient
  const accessFilter = { patient: patientId };
  if (validated.recordId) {
    const record = await MedicalRecord.findOne({ _id: validated.recordId, patient: patientId });
    if (!record) {
      throw new ApiError(404, "Selected medical report not found in your vault.");
    }
    accessFilter.record = validated.recordId;
  }

  const searchOutput = await searchMedicalReports({
    accessFilter,
    query: validated.query,
    options: {
      topK: validated.limit || 10,
      mode: validated.mode || "hybrid",
      category: validated.category,
      dateRange: validated.dateRange,
      recordIds: validated.recordId ? [validated.recordId] : undefined,
    },
  });

  await logAuditActivity({
    userId: patientId,
    userRole: "user",
    action: "ai_search",
    description: `You searched medical reports for '${validated.query}'.`,
    relatedPatient: patientId,
    metadata: {
      query: validated.query,
      mode: validated.mode,
      resultCount: searchOutput.count,
    },
  });

  res.status(200).json({
    success: true,
    query: validated.query,
    mode: validated.mode,
    count: searchOutput.count,
    results: searchOutput.results,
  });
});

/**
 * @desc   Reprocess a medical report into RAG vector store
 * @route  POST /api/ai/reprocess/:recordId
 */
export const reprocessRecordRag = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  if (user.role === "user") {
    if (record.patient.toString() !== user._id.toString()) {
      throw new ApiError(403, "Not authorized to modify this record.");
    }
  } else if (user.role !== "admin") {
    throw new ApiError(403, "Not authorized to reprocess records.");
  }

  // Find file path on disk or uploads
  let filePath = null;
  const candidateDirectories = [
    path.resolve("uploads"),
    path.resolve("backend", "uploads"),
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "backend", "uploads"),
  ];

  const candidateFilenames = [];
  if (record.publicId) candidateFilenames.push(record.publicId.replace(/^local_/, ""));
  if (record.fileUrl) candidateFilenames.push(path.basename(record.fileUrl));

  for (const dir of candidateDirectories) {
    if (!fs.existsSync(dir)) continue;
    for (const fn of candidateFilenames) {
      const fullPath = path.join(dir, fn);
      if (fs.existsSync(fullPath)) {
        filePath = fullPath;
        break;
      }
    }
    if (filePath) break;
  }

  if (!filePath && record.extractedText) {
    // If original file not on disk, construct from buffer of extracted text
    filePath = Buffer.from(record.extractedText, "utf8");
  }

  if (!filePath) {
    throw new ApiError(404, "Report source file not found on disk for indexing.");
  }

  const result = await indexMedicalRecord(record, filePath);

  res.status(200).json({
    success: true,
    message: "Report successfully indexed into vector search.",
    details: result,
  });
});
