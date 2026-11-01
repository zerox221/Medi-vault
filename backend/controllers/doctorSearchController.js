import { MedicalRecord } from "../models/MedicalRecord.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAuditActivity } from "../utils/auditLogger.js";
import {
  doctorSearchSchema,
  doctorAskSchema,
} from "../validators/aiRequestSchema.js";
import {
  searchMedicalReports,
  answerMedicalQuestion,
} from "../services/rag/ragService.js";

/**
 * Helper: Retrieves list of authorized patient IDs and record IDs for a doctor.
 * Inspects approved AccessRequests AND fetches user details directly from all shared reports.
 */
const getDoctorAuthorizations = async (doctorId) => {
  const now = new Date();
  const validExpiryCondition = {
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: now } },
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  };

  // 1. Find all approved access requests involving this doctor
  const approvedRequests = await AccessRequest.find({
    doctor: doctorId,
    status: "approved",
    ...validExpiryCondition,
  }).populate("patient", "name email phone bloodGroup dateOfBirth gender");

  const authorizedPatientIds = new Set();
  const authorizedRecordIds = new Set();
  const patientDetailsMap = new Map();
  const patientWithFullAccess = new Set();

  approvedRequests.forEach((req) => {
    // Extract patient ID whether populated as an object or raw ObjectId
    const pId = req.patient?._id
      ? req.patient._id.toString()
      : req.patient
      ? req.patient.toString()
      : null;

    if (pId) {
      authorizedPatientIds.add(pId);
      if (req.patient && typeof req.patient === "object" && req.patient.name) {
        patientDetailsMap.set(pId, req.patient);
      }
    }

    if (Array.isArray(req.records) && req.records.length > 0) {
      req.records.forEach((rId) => {
        const rStr = rId?._id ? rId._id.toString() : rId ? rId.toString() : null;
        if (rStr) authorizedRecordIds.add(rStr);
      });
    } else if (pId) {
      // Patient granted access to all their records
      patientWithFullAccess.add(pId);
    }
  });

  // 2. Fetch user/patient details from all shared medical reports at doctor end
  // If doctor was granted access to specific records, resolve the patient details directly from those records!
  const reportFilter = [];
  if (authorizedRecordIds.size > 0) {
    reportFilter.push({ _id: { $in: Array.from(authorizedRecordIds) } });
  }
  if (authorizedPatientIds.size > 0) {
    reportFilter.push({ patient: { $in: Array.from(authorizedPatientIds) } });
  }

  if (reportFilter.length > 0) {
    const sharedReports = await MedicalRecord.find({ $or: reportFilter })
      .populate("patient", "name email phone bloodGroup dateOfBirth gender")
      .select("patient title category reportDate hospital doctorName");

    for (const report of sharedReports) {
      if (report.patient) {
        const p = report.patient;
        const pId = p._id ? p._id.toString() : p.toString();
        authorizedPatientIds.add(pId);
        authorizedRecordIds.add(report._id.toString());
        if (p && typeof p === "object" && p.name && !patientDetailsMap.has(pId)) {
          patientDetailsMap.set(pId, p);
        }
      }
    }
  }

  // 3. Populate any authorized patient IDs still missing profile details from User model
  const missingPatientIds = Array.from(authorizedPatientIds).filter((id) => !patientDetailsMap.has(id));
  if (missingPatientIds.length > 0) {
    const users = await User.find({ _id: { $in: missingPatientIds } })
      .select("name email phone bloodGroup dateOfBirth gender");
    users.forEach((u) => {
      patientDetailsMap.set(u._id.toString(), u);
    });
  }

  return {
    patientIds: Array.from(authorizedPatientIds),
    recordIds: Array.from(authorizedRecordIds),
    patients: Array.from(patientDetailsMap.values()),
    patientWithFullAccess: Array.from(patientWithFullAccess),
  };
};

/**
 * Resolves target patient ID from various user inputs:
 * - Direct patient ObjectId
 * - MedicalRecord ID (fetches user details from report)
 * - 'PAT-' formatted ID or partial suffix
 * - Patient email
 */
const resolveTargetPatientId = async (inputPatientId, auth, doctorId) => {
  if (!inputPatientId) return null;
  const clean = inputPatientId.toString().trim();

  // 1. Direct match with authorized patient IDs
  if (auth.patientIds.includes(clean)) {
    return clean;
  }

  // 2. Check if input is a MedicalRecord ID, and fetch patient from report
  try {
    const recordMatch = await MedicalRecord.findById(clean).populate("patient");
    if (recordMatch && recordMatch.patient) {
      const pId = (recordMatch.patient._id || recordMatch.patient).toString();
      if (auth.patientIds.includes(pId)) {
        return pId;
      }
      // If doctor has approved access request for this record, grant authorization
      const now = new Date();
      const hasRecordAccess = await AccessRequest.findOne({
        doctor: doctorId,
        records: recordMatch._id,
        status: "approved",
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: now } },
          { expiresAt: { $gt: now } },
        ],
      });
      if (hasRecordAccess) {
        auth.patientIds.push(pId);
        auth.recordIds.push(recordMatch._id.toString());
        return pId;
      }
    }
  } catch {
    // clean may not be a valid ObjectId
  }

  // 3. Suffix / 'PAT-' formatted string match against authorized patients
  const suffix = clean.replace(/^PAT-/i, "").toLowerCase();
  const matchedPatient = auth.patients.find((p) => {
    const idStr = (p._id || p.id || "").toString().toLowerCase();
    return (
      idStr === clean.toLowerCase() ||
      idStr.endsWith(suffix) ||
      (p.email && p.email.toLowerCase() === clean.toLowerCase())
    );
  });

  if (matchedPatient) {
    return (matchedPatient._id || matchedPatient.id).toString();
  }

  return clean;
};

/**
 * @desc   Search authorized patients for doctor
 * @route  GET /api/doctors/patients/search
 */
export const searchAuthorizedPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { q } = req.query;

  const auth = await getDoctorAuthorizations(doctorId);
  let matchingPatients = auth.patients;

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    matchingPatients = matchingPatients.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.toLowerCase().includes(term)) ||
        p._id.toString() === term
    );
  }

  res.status(200).json({
    success: true,
    count: matchingPatients.length,
    patients: matchingPatients,
  });
});

/**
 * @desc   Get authorized reports for a specific patient
 * @route  GET /api/doctors/patients/:patientId/reports
 */
export const getPatientAuthorizedReports = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { patientId } = req.params;

  const auth = await getDoctorAuthorizations(doctorId);
  const targetPatientId = await resolveTargetPatientId(patientId, auth, doctorId);

  // Strict authorization check: Doctor must have active consent for this patient
  if (!auth.patientIds.includes(targetPatientId)) {
    throw new ApiError(
      403,
      "Access Denied: You do not have active patient authorization to view reports for this patient."
    );
  }

  const query = { patient: targetPatientId };
  // If not granted full access to all records, restrict to explicitly approved record IDs
  if (!auth.patientWithFullAccess.includes(targetPatientId) && auth.recordIds.length > 0) {
    query._id = { $in: auth.recordIds };
  }

  const records = await MedicalRecord.find(query)
    .select("title category reportDate hospital doctorName fileSize fileUrl publicId processingStatus chunkCount")
    .sort({ reportDate: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: records.length,
    records,
  });
});

/**
 * @desc   Search reports across authorized patients (Exact Keyword or Semantic Hybrid)
 * @route  POST /api/doctors/reports/search
 */
export const searchDoctorReports = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const validated = doctorSearchSchema.parse(req.body);

  const auth = await getDoctorAuthorizations(doctorId);

  if (auth.patientIds.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No authorized patients or shared records found.",
      count: 0,
      results: [],
    });
  }

  // 1. Build security access filter
  const accessFilter = {};

  if (validated.patientId) {
    const targetPatientId = await resolveTargetPatientId(validated.patientId, auth, doctorId);

    // Single patient targeted: verify permission
    if (!auth.patientIds.includes(targetPatientId)) {
      throw new ApiError(
        403,
        "Access Denied: You do not have permission to search reports for this patient."
      );
    }
    accessFilter.patient = targetPatientId;

    if (!auth.patientWithFullAccess.includes(targetPatientId) && auth.recordIds.length > 0) {
      accessFilter.record = { $in: auth.recordIds };
    }
  } else {
    // Cross-patient search: strictly bounded to all authorized patients
    accessFilter.patient = { $in: auth.patientIds };
    if (auth.recordIds.length > 0 && auth.patientWithFullAccess.length === 0) {
      accessFilter.record = { $in: auth.recordIds };
    }
  }

  // 2. Execute secure search
  const searchOutput = await searchMedicalReports({
    accessFilter,
    query: validated.query,
    options: {
      topK: validated.limit || 15,
      mode: validated.mode || "hybrid",
      category: validated.category,
      dateRange: validated.dateRange,
      recordIds: validated.recordIds,
    },
  });

  // Attach patient names to results for doctor convenience
  const patientMap = new Map(auth.patients.map((p) => [p._id.toString(), p.name]));
  const enrichedResults = searchOutput.results.map((r) => ({
    ...r,
    patientName: patientMap.get(r.patientId) || "Authorized Patient",
  }));

  // 3. Audit Logging
  await logAuditActivity({
    userId: doctorId,
    userRole: "doctor",
    action: "ai_search",
    description: `Dr. ${req.user.name} searched medical reports for '${validated.query}' (${enrichedResults.length} matches found).`,
    relatedDoctor: doctorId,
    relatedPatient: validated.patientId || undefined,
    metadata: {
      query: validated.query,
      mode: validated.mode,
      resultCount: enrichedResults.length,
      scope: validated.patientId ? "single_patient" : "all_authorized_patients",
    },
  });

  res.status(200).json({
    success: true,
    query: validated.query,
    mode: validated.mode,
    count: enrichedResults.length,
    results: enrichedResults,
  });
});

/**
 * @desc   Doctor asks an AI medical question about an authorized patient's reports
 * @route  POST /api/doctors/ai/ask
 */
export const askDoctorQuestion = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const validated = doctorAskSchema.parse(req.body);

  const auth = await getDoctorAuthorizations(doctorId);
  const targetPatientId = await resolveTargetPatientId(validated.patientId, auth, doctorId);

  // Enforce patient authorization
  if (!auth.patientIds.includes(targetPatientId)) {
    throw new ApiError(
      403,
      "Access Denied: You do not have active patient authorization to ask questions about this patient's records."
    );
  }

  const accessFilter = { patient: targetPatientId };
  if (!auth.patientWithFullAccess.includes(targetPatientId) && auth.recordIds.length > 0) {
    accessFilter.record = { $in: auth.recordIds };
  }

  const response = await answerMedicalQuestion({
    accessFilter,
    question: validated.question,
    userRole: "doctor",
    options: {
      topK: validated.topK || 5,
      category: validated.category,
      dateRange: validated.dateRange,
      recordIds: validated.recordIds,
    },
  });

  // Audit Logging
  await logAuditActivity({
    userId: doctorId,
    userRole: "doctor",
    action: "ai_qa",
    description: `Dr. ${req.user.name} asked clinical AI question for patient #${targetPatientId}: '${validated.question}'.`,
    relatedDoctor: doctorId,
    relatedPatient: targetPatientId,
    metadata: {
      question: validated.question,
      status: response.status,
      sourceCount: response.sources?.length || 0,
    },
  });

  res.status(200).json({
    success: true,
    ...response,
  });
});
