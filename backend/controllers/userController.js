import { User } from "../models/User.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc   Get patient profile
 * @route  GET /api/users/profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User profile not found.");
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      address: user.address,
      emergencyContact: user.emergencyContact,
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "October 2026",
    },
  });
});

/**
 * @desc   Update patient profile
 * @route  PUT /api/users/profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone, gender, dateOfBirth, bloodGroup, address, emergencyContact } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone;
  if (gender !== undefined) user.gender = gender;
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
  if (address !== undefined) user.address = address;
  if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

  await user.save();

  await Activity.create({
    user: user._id,
    userRole: "user",
    action: "profile_update",
    description: "You updated your personal profile details.",
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      address: user.address,
      emergencyContact: user.emergencyContact,
    },
  });
});

/**
 * @desc   Get patient dashboard summary
 * @route  GET /api/users/dashboard
 */
export const getUserDashboard = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  // 1. Total uploaded reports
  const totalReports = await MedicalRecord.countDocuments({ patient: patientId });

  // 2. Active doctor sharing sessions / accessed reports
  const activeShares = await AccessRequest.find({
    patient: patientId,
    status: "approved",
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gt: new Date() } }],
  });

  const accessedReportsCount = activeShares.reduce((acc, curr) => acc + (curr.records?.length || 0), 0);

  // 3. Recent 4 reports
  const recentReports = await MedicalRecord.find({ patient: patientId })
    .sort({ createdAt: -1 })
    .limit(4);

  // 4. Medical timeline reports
  const timeline = await MedicalRecord.find({ patient: patientId })
    .sort({ reportDate: -1, createdAt: -1 })
    .limit(10);

  // 5. Recent activities
  const activities = await Activity.find({ user: patientId })
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalReports,
        reportsAccessed: accessedReportsCount,
        activeSharesCount: activeShares.length,
      },
      recentReports,
      timeline,
      activities,
    },
  });
});

/**
 * @desc   Get patient activity history
 * @route  GET /api/users/activity
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    activities,
  });
});

/**
 * @desc   Get all patients (Admin only)
 * @route  GET /api/users/patients
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  const patients = await User.find().select("-password").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: patients.length,
    patients,
  });
});
