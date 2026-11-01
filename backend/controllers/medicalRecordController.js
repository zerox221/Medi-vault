import { MedicalRecord } from "../models/MedicalRecord.js";
import { ReportChunk } from "../models/ReportChunk.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadMedicalRecordToCloudinary,
  generateSignedDownloadUrl,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";
import {
  extractTextFromPdf,
  resolveAndExtractRecordText,
} from "../services/pdfExtractionService.js";
import {
  generateMedicalReportSummary,
  extractLabDataFromText,
} from "../services/aiService.js";
import { verifyDoctorRecordAccess } from "../services/sharingService.js";
import { validateMedicalReportFile } from "../utils/fileValidation.js";
import { indexMedicalRecord } from "../services/rag/ragService.js";
import fs from "fs";
import path from "path";

/**
 * @desc   Upload a new medical report PDF
 * @route  POST /api/records/upload
 */
export const uploadRecord = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "Please attach a medical report in PDF format.");
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  // 1. Validate file magic bytes and size
  const validation = validateMedicalReportFile(filePath, originalName);
  if (!validation.valid) {
    try { fs.unlinkSync(filePath); } catch {}
    throw new ApiError(400, validation.error);
  }

  const { reportName, reportType, category, hospital, doctorName, reportDate } = req.body;
  const title = reportName || originalName.replace(/\.[^/.]+$/, "");
  const selectedCategory = category || reportType || "Lab Reports";
  const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(1);

  // 2. Extract text from PDF
  const extractedText = await extractTextFromPdf(filePath);

  // 3. Upload to Cloudinary private medical storage (or local fallback)
  const uploadResult = await uploadMedicalRecordToCloudinary(filePath, originalName, { cleanupLocal: false });

  // 4. Automatically generate AI Medical Summary upon upload
  let aiSummary = null;
  try {
    aiSummary = await generateMedicalReportSummary(extractedText, title, selectedCategory);
  } catch (err) {
    console.warn("⚠️ AI summary generation warning:", err.message);
    aiSummary = extractLabDataFromText(extractedText, title, selectedCategory);
  }

  if (!aiSummary || !aiSummary.summary) {
    aiSummary = extractLabDataFromText(extractedText, title, selectedCategory);
  }

  // 5. Save record and AI summary directly in database
  const record = await MedicalRecord.create({
    patient: patientId,
    title: title.trim(),
    hospital: hospital ? hospital.trim() : (aiSummary?.labName || "Diagnostic Laboratory"),
    category: selectedCategory,
    doctorName: doctorName ? doctorName.trim() : (aiSummary?.doctorName || ""),
    reportDate: reportDate || new Date().toISOString().split("T")[0],
    fileUrl: uploadResult.fileUrl,
    publicId: uploadResult.publicId,
    fileSize: `${fileSizeMb} MB`,
    fileType: "application/pdf",
    extractedText,
    aiSummary,
    tags: ["AI Summary"],
    processingStatus: "uploaded",
  });

  // 6. Automatically trigger RAG pipeline (chunking, embedding, vector storage)
  try {
    const fileSource = fs.existsSync(filePath) ? filePath : Buffer.from(extractedText, "utf8");
    await indexMedicalRecord(record, fileSource);
  } catch (ragErr) {
    console.warn("⚠️ [RAG Index Note]:", ragErr.message);
  } finally {
    // If uploaded to Cloudinary, cleanup temporary upload file now that indexing is complete
    if (uploadResult.publicId && !uploadResult.publicId.startsWith("local_") && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }

  // 7. Log activity
  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "upload",
    description: `You uploaded '${record.title}'.`,
    relatedRecord: record._id,
  });

  res.status(201).json({
    success: true,
    message: "Medical record uploaded and analyzed successfully.",
    record,
  });
});

/**
 * @desc   Get all medical records for authenticated patient
 * @route  GET /api/records
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { search, category, sort } = req.query;

  const query = { patient: patientId };

  if (category && category !== "All Reports" && category !== "All Categories") {
    query.category = new RegExp(category, "i");
  }

  if (search && search.trim()) {
    const q = search.trim();
    query.$or = [
      { title: new RegExp(q, "i") },
      { hospital: new RegExp(q, "i") },
      { doctorName: new RegExp(q, "i") },
      { category: new RegExp(q, "i") },
    ];
  }

  let sortOption = { reportDate: -1, createdAt: -1 };
  if (sort === "oldest") sortOption = { reportDate: 1 };
  if (sort === "title") sortOption = { title: 1 };

  const records = await MedicalRecord.find(query).sort(sortOption);

  res.status(200).json({
    success: true,
    count: records.length,
    records,
  });
});

/**
 * @desc   Get medical record by ID (with ownership or doctor sharing authorization)
 * @route  GET /api/records/:id
 */
export const getRecordById = asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId).populate("patient", "name email phone bloodGroup dateOfBirth gender");

  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  // Access validation:
  if (user.role === "user") {
    if (record.patient._id.toString() !== user._id.toString()) {
      throw new ApiError(403, "Access Denied: You do not have permission to view another patient's medical records.");
    }
  } else if (user.role === "doctor") {
    await verifyDoctorRecordAccess(user._id, record._id);

    await Activity.create({
      user: user._id,
      userRole: "doctor",
      action: "view",
      description: `Dr. ${user.name} reviewed '${record.title}' for patient ${record.patient.name}.`,
      relatedRecord: record._id,
      relatedDoctor: user._id,
      relatedPatient: record.patient._id,
    });
  } else if (user.role !== "admin") {
    throw new ApiError(403, "Not authorized to access medical records.");
  }

  // Ensure AI summary exists; if missing, automatically generate and save to database
  if (!record.aiSummary || !record.aiSummary.summary) {
    try {
      const text = await resolveAndExtractRecordText(record);
      if (text && text.trim().length > 0) {
        record.extractedText = text;
        const generatedSummary = await generateMedicalReportSummary(text, record.title, record.category);
        record.aiSummary = generatedSummary;
        await record.save();
      }
    } catch (autoErr) {
      console.warn("⚠️ Auto AI summary generation on record retrieval:", autoErr.message);
    }
  }

  res.status(200).json({
    success: true,
    record,
  });
});

/**
 * @desc   Get RAG processing and chunk status for a medical record
 * @route  GET /api/records/:id/processing-status
 */
export const getRecordProcessingStatus = asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  if (user.role === "user") {
    if (record.patient.toString() !== user._id.toString()) {
      throw new ApiError(403, "Access Denied: You do not own this medical file.");
    }
  } else if (user.role === "doctor") {
    await verifyDoctorRecordAccess(user._id, record._id);
  }

  const chunkCount = await ReportChunk.countDocuments({ record: recordId });

  res.status(200).json({
    success: true,
    recordId,
    processingStatus: record.processingStatus || (chunkCount > 0 ? "completed" : "uploaded"),
    chunkCount: chunkCount || record.chunkCount || 0,
    pageCount: record.pageCount || 1,
    processingError: record.processingError || "",
  });
});

/**
 * @desc   Generate short-lived signed download URL for medical record
 * @route  GET /api/records/:id/download
 */
export const getRecordDownloadUrl = asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const user = req.user;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  if (user.role === "user") {
    if (record.patient.toString() !== user._id.toString()) {
      throw new ApiError(403, "Access Denied: You do not own this medical file.");
    }
  } else if (user.role === "doctor") {
    await verifyDoctorRecordAccess(user._id, record._id);

    await Activity.create({
      user: user._id,
      userRole: "doctor",
      action: "download",
      description: `Dr. ${user.name} downloaded medical record '${record.title}'.`,
      relatedRecord: record._id,
    });
  } else if (user.role !== "admin") {
    throw new ApiError(403, "Not authorized to download this file.");
  }

  const downloadUrl = generateSignedDownloadUrl(record.publicId, 15);

  res.status(200).json({
    success: true,
    downloadUrl,
    fileUrl: record.fileUrl,
    fileName: `${record.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    expiresInMinutes: 15,
  });
});

/**
 * @desc   Local file download stream fallback
 * @route  GET /api/records/local-download/:publicId
 */
export const downloadLocalFile = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  const fileName = publicId.replace(/^local_/, "");
  
  const possiblePaths = [
    path.resolve("uploads", fileName),
    path.resolve(process.cwd(), "uploads", fileName),
    path.resolve(process.cwd(), "backend", "uploads", fileName),
  ];

  let foundPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
    throw new ApiError(404, "File not found on local storage.");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  const stream = fs.createReadStream(foundPath);
  stream.pipe(res);
});

/**
 * @desc   Delete a medical report permanently
 * @route  DELETE /api/records/:id
 */
export const deleteRecord = asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const patientId = req.user._id;

  const record = await MedicalRecord.findOne({
    _id: recordId,
    patient: patientId,
  });

  if (!record) {
    throw new ApiError(404, "Medical record not found or you do not have permission to delete it.");
  }

  // Remove from Cloudinary
  await deleteFromCloudinary(record.publicId, "raw");

  // Remove RAG chunks
  await ReportChunk.deleteMany({ record: recordId });

  await record.deleteOne();

  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "delete",
    description: `You deleted '${record.title}'.`,
  });

  res.status(200).json({
    success: true,
    message: "Medical record permanently deleted.",
  });
});

/**
 * @desc   Generate or re-generate AI summary for a medical report
 * @route  POST /api/records/:id/summarize
 */
export const summarizeRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  // Access validation:
  if (req.user.role === "user") {
    if (record.patient.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access Denied: You do not have permission to summarize this patient's medical record.");
    }
  } else if (req.user.role === "doctor") {
    await verifyDoctorRecordAccess(req.user._id, record._id);
  }

  let text = await resolveAndExtractRecordText(record);
  if (text && (!record.extractedText || record.extractedText.trim().length === 0)) {
    record.extractedText = text;
  }

  const summary = await generateMedicalReportSummary(text, record.title, record.category);
  record.aiSummary = summary;
  await record.save();

  // If record has no RAG chunks, automatically index into RAG vector store
  try {
    const chunkCount = await ReportChunk.countDocuments({ record: record._id });
    if (chunkCount === 0) {
      await indexMedicalRecord(record, Buffer.from(text || record.extractedText || "", "utf8"));
    }
  } catch (ragErr) {
    console.warn("⚠️ [Summarize Auto-Index Note]:", ragErr.message);
  }

  await Activity.create({
    user: req.user._id,
    userRole: req.user.role,
    action: "ai_summary",
    description: `Generated AI clinical summary for '${record.title}'.`,
    relatedRecord: record._id,
  });

  res.status(200).json({
    success: true,
    message: "AI clinical summary generated successfully.",
    aiSummary: summary,
  });
});
