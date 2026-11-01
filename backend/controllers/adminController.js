import { Doctor } from "../models/Doctor.js";
import { DoctorDocument } from "../models/DoctorDocument.js";
import { User } from "../models/User.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendDoctorVerificationEmail } from "../services/emailService.js";

/**
 * @desc   Admin dashboard metrics
 * @route  GET /api/admin/dashboard
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const totalPatients = await User.countDocuments();
  const totalDoctors = await Doctor.countDocuments();
  const pendingDoctors = await Doctor.countDocuments({ verificationStatus: "PENDING" });
  const verifiedDoctors = await Doctor.countDocuments({ verificationStatus: "VERIFIED" });
  const totalRecords = await MedicalRecord.countDocuments();
  const activeShares = await AccessRequest.countDocuments({ status: "approved" });

  const pendingDoctorsList = await Doctor.find({ verificationStatus: "PENDING" })
    .sort({ createdAt: -1 })
    .limit(5);

  const recentActivities = await Activity.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    stats: {
      totalPatients,
      totalDoctors,
      pendingDoctors,
      verifiedDoctors,
      totalRecords,
      activeShares,
    },
    pendingDoctorsList,
    recentActivities,
  });
});

/**
 * @desc   Get all doctors (with optional status filter)
 * @route  GET /api/admin/doctors
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = {};

  if (status && status !== "ALL") {
    query.verificationStatus = status.toUpperCase();
  }

  if (search) {
    const q = search.trim();
    query.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { medicalRegistrationNumber: new RegExp(q, "i") },
      { specialization: new RegExp(q, "i") },
      { hospitalName: new RegExp(q, "i") },
    ];
  }

  const doctors = await Doctor.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

/**
 * @desc   Get pending verification doctors queue
 * @route  GET /api/admin/doctors/pending
 */
export const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ verificationStatus: "PENDING" }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

/**
 * @desc   Get doctor details & uploaded verification documents
 * @route  GET /api/admin/doctors/:id
 */
export const getDoctorDetailsForAdmin = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found.");
  }

  const documents = await DoctorDocument.find({ doctor: doctor._id });

  res.status(200).json({
    success: true,
    doctor,
    documents,
  });
});

/**
 * @desc   Verify & approve doctor credentials
 * @route  POST /api/admin/doctors/:id/verify
 */
export const verifyDoctor = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ApiError(404, "Doctor not found.");
  }

  doctor.verificationStatus = "VERIFIED";
  doctor.verifiedAt = new Date();
  doctor.verifiedBy = adminId;
  doctor.verificationRejectionReason = "";
  await doctor.save();

  // Mark uploaded documents as verified
  await DoctorDocument.updateMany({ doctor: doctor._id }, { status: "Verified", verifiedAt: new Date() });

  // Log activity
  await Activity.create({
    user: adminId,
    userRole: "admin",
    action: "verify_doctor",
    description: `Administrator verified credentials for Dr. ${doctor.name} (Reg #${doctor.medicalRegistrationNumber}).`,
    relatedDoctor: doctor._id,
  });

  // Dispatch email notification
  await sendDoctorVerificationEmail(doctor.email, doctor.name, "VERIFIED");

  res.status(200).json({
    success: true,
    message: `Dr. ${doctor.name} has been verified successfully.`,
    doctor,
  });
});

/**
 * @desc   Reject doctor verification credentials
 * @route  POST /api/admin/doctors/:id/reject
 */
export const rejectDoctor = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const { reason } = req.body;

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found.");
  }

  const rejectionReason = reason || "Submitted documents did not match medical council registration standards.";

  doctor.verificationStatus = "REJECTED";
  doctor.verificationRejectionReason = rejectionReason;
  await doctor.save();

  await DoctorDocument.updateMany({ doctor: doctor._id }, { status: "Rejected" });

  await Activity.create({
    user: adminId,
    userRole: "admin",
    action: "reject_doctor",
    description: `Administrator rejected verification for Dr. ${doctor.name}. Reason: ${rejectionReason}`,
    relatedDoctor: doctor._id,
  });

  await sendDoctorVerificationEmail(doctor.email, doctor.name, "REJECTED", rejectionReason);

  res.status(200).json({
    success: true,
    message: `Verification rejected for Dr. ${doctor.name}.`,
    doctor,
  });
});

/**
 * @desc   Get system-wide audit activity logs
 * @route  GET /api/admin/activity
 */
export const getAdminActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: activities.length,
    activities,
  });
});
