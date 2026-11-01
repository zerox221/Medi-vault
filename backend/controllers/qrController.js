import crypto from "crypto";
import QRCode from "qrcode";
import { QRSession } from "../models/QRSession.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { Doctor } from "../models/Doctor.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendAccessRequestNotification } from "../services/emailService.js";

// Hash token helper
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * @desc   Patient creates a secure QR sharing session
 * @route  POST /api/qr/create
 */
export const createQRSession = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { recordIds, expiryHours } = req.body;

  // Verify records belong to patient
  let selectedRecords = [];
  if (Array.isArray(recordIds) && recordIds.length > 0) {
    const verified = await MedicalRecord.find({
      _id: { $in: recordIds },
      patient: patientId,
    }).select("_id");
    selectedRecords = verified.map((r) => r._id);
  } else {
    // All patient's records
    const all = await MedicalRecord.find({ patient: patientId }).select("_id");
    selectedRecords = all.map((r) => r._id);
  }

  // Generate cryptographically secure random token and 6-digit sharing OTP
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const shareOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashToken(shareOtp);

  const hours = parseInt(expiryHours, 10) || 24;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  // Store hashes in database
  const session = await QRSession.create({
    patient: patientId,
    tokenHash,
    shareOtp,
    otpHash,
    records: selectedRecords,
    status: "active",
    expiryDuration: `${hours} hours`,
    expiresAt,
  });

  // Construct secure sharing payload URL
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const shareUrl = `${clientUrl}/shared-reports/${rawToken}`;

  // Generate QR Code data URL
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: "#1e3a8a",
      light: "#ffffff",
    },
  });

  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "share",
    description: `You generated a QR sharing session for ${selectedRecords.length} reports.`,
  });

  res.status(201).json({
    success: true,
    message: "QR sharing session created successfully.",
    sessionId: session._id,
    shareToken: rawToken,
    shareOtp,
    shareUrl,
    qrDataUrl,
    recordsCount: selectedRecords.length,
    expiresAt,
    expiryDuration: `${hours} hours`,
  });
});

/**
 * @desc   Doctor scans QR code token -> validates & creates pending access request (NO AUTO ACCESS!)
 * @route  POST /api/qr/scan
 */
export const scanQRCode = asyncHandler(async (req, res) => {
  const doctor = req.user;
  const { token, clinicalPurpose } = req.body;

  if (!token) {
    throw new ApiError(400, "QR sharing token is required.");
  }

  // Clean raw token or 6-digit OTP if extracted from URL or typed
  const cleanToken = token.includes("/shared-reports/")
    ? token.split("/shared-reports/")[1].trim()
    : token.trim();

  const tokenHash = hashToken(cleanToken);

  // Find active session by rawToken hash OR by 6-digit shareOtp
  const session = await QRSession.findOne({
    $or: [
      { tokenHash },
      { otpHash: tokenHash },
      { shareOtp: cleanToken },
    ],
    status: { $in: ["active", "scanned"] },
    expiresAt: { $gt: new Date() },
  })
    .populate("patient", "name email phone bloodGroup dateOfBirth gender")
    .populate("records", "title category reportDate");

  if (!session) {
    throw new ApiError(400, "Invalid or expired QR code session / Sharing OTP. Please check the code with the patient.");
  }

  // Check if access request already exists for this session & doctor
  let accessRequest = await AccessRequest.findOne({
    patient: session.patient._id,
    doctor: doctor._id,
    status: "pending",
  });

  if (!accessRequest) {
    // Create new pending access request
    accessRequest = await AccessRequest.create({
      patient: session.patient._id,
      doctor: doctor._id,
      records: session.records.map((r) => r._id),
      purpose: clinicalPurpose || "Doctor consultation via patient QR code scan",
      status: "pending", // CRITICAL: NEVER auto-grant access!
      notes: "Initiated via MediVault QR Code Scan. Awaiting patient authorization.",
    });

    // Notify patient safely
    try {
      await sendAccessRequestNotification(
        session.patient.email,
        session.patient.name,
        doctor.name,
        doctor.specialization || "Doctor",
        accessRequest._id
      );
    } catch (err) {
      console.warn("⚠️ [Notification Warning]:", err.message);
    }
  }

  // Update QR session status
  session.status = "scanned";
  session.scannedByDoctor = doctor._id;
  session.scannedAt = new Date();
  session.accessRequest = accessRequest._id;
  await session.save();

  // Log activity
  await Activity.create({
    user: doctor._id,
    userRole: "doctor",
    action: "scan_qr",
    description: `You scanned QR code for patient ${session.patient.name}. Access request #${accessRequest._id} created with PENDING status.`,
    relatedDoctor: doctor._id,
    relatedPatient: session.patient._id,
  });

  // Return patient info and confirmation screen details WITHOUT medical report file contents
  res.status(200).json({
    success: true,
    message: "QR code scanned successfully. Access request submitted. In accordance with zero-trust privacy rules, records remain locked until patient approves.",
    patient: {
      id: session.patient._id,
      name: session.patient.name,
      email: session.patient.email,
      bloodGroup: session.patient.bloodGroup,
      gender: session.patient.gender,
      age: session.patient.dateOfBirth,
    },
    recordsInToken: session.records.map((r) => ({
      id: r._id,
      title: r.title,
      category: r.category,
      reportDate: r.reportDate,
    })),
    accessRequest: {
      id: accessRequest._id,
      status: accessRequest.status, // "pending"
      purpose: accessRequest.purpose,
    },
    expiryDuration: session.expiryDuration,
  });
});

/**
 * @desc   Get QR session details
 * @route  GET /api/qr/session/:id
 */
export const getQRSessionDetails = asyncHandler(async (req, res) => {
  const session = await QRSession.findById(req.params.id)
    .populate("patient", "name email phone bloodGroup")
    .populate("records", "title category reportDate")
    .populate("scannedByDoctor", "name specialization verificationStatus hospitalName")
    .populate("accessRequest");

  if (!session) {
    throw new ApiError(404, "QR session not found.");
  }

  // Verify requester is patient or doctor
  const isPatient = session.patient._id.toString() === req.user._id.toString();
  const isDoctor = session.scannedByDoctor?._id?.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to view this QR session.");
  }

  res.status(200).json({
    success: true,
    session,
  });
});

/**
 * @desc   Patient revokes or cancels a QR session
 * @route  POST /api/qr/session/:id/revoke
 */
export const revokeQRSession = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const session = await QRSession.findOne({
    _id: req.params.id,
    patient: patientId,
  });

  if (!session) {
    throw new ApiError(404, "QR session not found.");
  }

  session.status = "cancelled";
  await session.save();

  // If there was an associated access request, revoke it
  if (session.accessRequest) {
    await AccessRequest.findByIdAndUpdate(session.accessRequest, {
      status: "revoked",
      revokedDate: new Date(),
    });
  }

  await Activity.create({
    user: patientId,
    userRole: "user",
    action: "revoke",
    description: "You cancelled an active QR sharing session.",
  });

  res.status(200).json({
    success: true,
    message: "QR sharing session successfully revoked.",
  });
});
