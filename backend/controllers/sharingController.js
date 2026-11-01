import { AccessRequest } from "../models/AccessRequest.js";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendAccessRequestNotification,
  sendSharingDecisionEmail,
} from "../services/emailService.js";

/**
 * @desc   Doctor sends an access authorization request to a patient
 * @route  POST /api/sharing/request
 */
export const requestAccess = asyncHandler(async (req, res) => {
  const doctor = req.user;
  const { patientEmail, patientId, records, purpose, notes, expiryHours } = req.body;

  let patient = null;
  if (patientId) {
    patient = await User.findById(patientId);
  } else if (patientEmail) {
    patient = await User.findOne({ email: patientEmail.toLowerCase().trim() });
  }

  if (!patient) {
    throw new ApiError(404, "Patient with the provided email or ID was not found.");
  }

  // Create access request
  const accessRequest = await AccessRequest.create({
    patient: patient._id,
    doctor: doctor._id,
    records: records || [],
    purpose: purpose || "Clinical evaluation and medical records review",
    notes: notes || "",
    expiryHours: parseInt(expiryHours, 10) || 24,
    status: "pending",
  });

  // Log activity
  await Activity.create({
    user: doctor._id,
    userRole: "doctor",
    action: "request",
    description: `You requested access to records of ${patient.name}.`,
    relatedDoctor: doctor._id,
    relatedPatient: patient._id,
  });

  // Notify patient via email safely
  try {
    await sendAccessRequestNotification(
      patient.email,
      patient.name,
      doctor.name,
      doctor.specialization || "Physician",
      accessRequest._id
    );
  } catch (err) {
    console.warn("⚠️ [Notification Warning]:", err.message);
  }

  res.status(201).json({
    success: true,
    message: `Access request submitted for ${patient.name}. Awaiting patient approval.`,
    request: accessRequest,
  });
});

/**
 * @desc   Patient views all requests directed to them
 * @route  GET /api/sharing/patient/requests
 */
export const getPatientSharingRequests = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const requests = await AccessRequest.find({ patient: patientId })
    .populate("doctor", "name email phone specialization qualification medicalRegistrationNumber registeredCouncil hospitalName verificationStatus")
    .populate("records", "title category reportDate")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

/**
 * @desc   Doctor views all requests created by them
 * @route  GET /api/sharing/doctor/requests
 */
export const getDoctorSharingRequests = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const requests = await AccessRequest.find({ doctor: doctorId })
    .populate("patient", "name email phone bloodGroup dateOfBirth gender")
    .populate("records", "title category reportDate")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

/**
 * @desc   Patient approves an access request & selects specific reports to share
 * @route  POST /api/sharing/:id/approve
 */
export const approveSharingRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const patientId = req.user._id;
  const { selectedRecords, expiryHours } = req.body;

  const request = await AccessRequest.findOne({
    _id: requestId,
    patient: patientId,
  })
    .populate("doctor", "name email")
    .populate("patient", "name email");

  if (!request) {
    throw new ApiError(404, "Access request not found or does not belong to you.");
  }

  // Verify records belong to this patient
  let permittedRecordIds = request.records;
  if (Array.isArray(selectedRecords) && selectedRecords.length > 0) {
    const verifiedRecords = await MedicalRecord.find({
      _id: { $in: selectedRecords },
      patient: patientId,
    });
    permittedRecordIds = verifiedRecords.map((r) => r._id);
  }

  if (permittedRecordIds.length === 0) {
    // If no records selected, attach all patient's records or reject
    const allRecords = await MedicalRecord.find({ patient: patientId }).select("_id");
    permittedRecordIds = allRecords.map((r) => r._id);
  }

  const hours = parseInt(expiryHours, 10) || request.expiryHours || 24;
  const expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000);

  request.status = "approved";
  request.records = permittedRecordIds;
  request.approvedDate = new Date();
  request.expiryDate = expiryDate;
  request.expiryHours = hours;

  await request.save();

  // Log activity
  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "approve",
    description: `You approved access for Dr. ${request.doctor.name} (${permittedRecordIds.length} records, expires in ${hours} hours).`,
    relatedDoctor: request.doctor._id,
    relatedPatient: patientId,
  });

  // Notify doctor safely
  try {
    await sendSharingDecisionEmail(
      request.doctor.email,
      request.doctor.name,
      request.patient.name,
      "approved"
    );
  } catch (err) {
    console.warn("⚠️ [Notification Warning]:", err.message);
  }

  res.status(200).json({
    success: true,
    message: `Access approved for Dr. ${request.doctor.name}. Records are now securely accessible.`,
    request,
  });
});

/**
 * @desc   Patient declines an access request
 * @route  POST /api/sharing/:id/reject
 */
export const rejectSharingRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const patientId = req.user._id;
  const { reason } = req.body;

  const request = await AccessRequest.findOne({
    _id: requestId,
    patient: patientId,
  })
    .populate("doctor", "name email")
    .populate("patient", "name email");

  if (!request) {
    throw new ApiError(404, "Access request not found.");
  }

  request.status = "rejected";
  request.rejectedDate = new Date();
  if (reason) request.notes = reason;

  await request.save();

  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "reject",
    description: `You rejected the access request from Dr. ${request.doctor.name}.`,
    relatedDoctor: request.doctor._id,
    relatedPatient: patientId,
  });

  try {
    await sendSharingDecisionEmail(
      request.doctor.email,
      request.doctor.name,
      request.patient.name,
      "rejected"
    );
  } catch (err) {
    console.warn("⚠️ [Notification Warning]:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Access request declined.",
    request,
  });
});

/**
 * @desc   Patient revokes previously approved access immediately
 * @route  POST /api/sharing/:id/revoke
 */
export const revokeSharingAccess = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const patientId = req.user._id;

  const request = await AccessRequest.findOne({
    _id: requestId,
    patient: patientId,
  }).populate("doctor", "name email");

  if (!request) {
    throw new ApiError(404, "Access permission not found.");
  }

  request.status = "revoked";
  request.revokedDate = new Date();
  await request.save();

  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "revoke",
    description: `You immediately revoked records access for Dr. ${request.doctor.name}.`,
    relatedDoctor: request.doctor._id,
    relatedPatient: patientId,
  });

  res.status(200).json({
    success: true,
    message: `Access for Dr. ${request.doctor.name} has been immediately revoked.`,
    request,
  });
});

/**
 * @desc   Check active status of an access permission
 * @route  GET /api/sharing/:id/status
 */
export const getSharingStatus = asyncHandler(async (req, res) => {
  const request = await AccessRequest.findById(req.params.id)
    .populate("doctor", "name specialization verificationStatus")
    .populate("patient", "name email");

  if (!request) {
    throw new ApiError(404, "Access request not found.");
  }

  const now = new Date();
  const isExpired = request.expiryDate ? now > request.expiryDate : false;
  const isActive = request.status === "approved" && !isExpired;

  res.status(200).json({
    success: true,
    status: request.status,
    isActive,
    isExpired,
    request,
  });
});
