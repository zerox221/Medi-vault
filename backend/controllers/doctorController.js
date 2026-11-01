import { Doctor } from "../models/Doctor.js";
import { DoctorDocument } from "../models/DoctorDocument.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadDoctorDocumentToCloudinary } from "../services/cloudinaryService.js";

/**
 * @desc   Get doctor profile & verification status
 * @route  GET /api/doctors/profile
 */
export const getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.user._id);
  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found.");
  }

  const documents = await DoctorDocument.find({ doctor: doctor._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      medicalRegistrationNumber: doctor.medicalRegistrationNumber,
      registeredCouncil: doctor.registeredCouncil,
      hospitalName: doctor.hospitalName,
      department: doctor.department,
      experience: doctor.experience,
      bio: doctor.bio,
      verificationStatus: doctor.verificationStatus,
      verificationRejectionReason: doctor.verificationRejectionReason,
      isEmailVerified: doctor.isEmailVerified,
      documents,
    },
  });
});

/**
 * @desc   Update doctor profile
 * @route  PUT /api/doctors/profile
 */
export const updateDoctorProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    specialization,
    qualification,
    medicalRegistrationNumber,
    registeredCouncil,
    hospitalName,
    department,
    experience,
    bio,
  } = req.body;

  const doctor = await Doctor.findById(req.user._id);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found.");
  }

  if (name) doctor.name = name.trim();
  if (phone !== undefined) doctor.phone = phone;
  if (specialization) doctor.specialization = specialization.trim();
  if (qualification) doctor.qualification = qualification.trim();
  if (medicalRegistrationNumber) doctor.medicalRegistrationNumber = medicalRegistrationNumber.trim();
  if (registeredCouncil) doctor.registeredCouncil = registeredCouncil.trim();
  if (hospitalName !== undefined) doctor.hospitalName = hospitalName.trim();
  if (department !== undefined) doctor.department = department.trim();
  if (experience !== undefined) doctor.experience = experience.trim();
  if (bio !== undefined) doctor.bio = bio.trim();

  await doctor.save();

  await Activity.create({
    user: doctor._id,
    userRole: "doctor",
    action: "profile_update",
    description: "You updated your professional credentials and clinic details.",
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    doctor,
  });
});

/**
 * @desc   Get doctor dashboard metrics and recently accessed records
 * @route  GET /api/doctors/dashboard
 */
export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  // Active / approved permissions
  const now = new Date();
  const approvedPermissions = await AccessRequest.find({
    doctor: doctorId,
    status: "approved",
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gt: now } }],
  }).populate("patient", "name email phone");

  // Distinct connected patients
  const patientIds = new Set();
  approvedPermissions.forEach((p) => {
    if (p.patient && p.patient._id) {
      patientIds.add(p.patient._id.toString());
    }
  });

  // Pending access requests awaiting patient approval
  const pendingRequestsCount = await AccessRequest.countDocuments({
    doctor: doctorId,
    status: "pending",
  });

  // Approved records accessible by this doctor
  const approvedRecordIds = [];
  approvedPermissions.forEach((p) => {
    p.records.forEach((rId) => approvedRecordIds.push(rId));
  });

  const approvedRecords = await MedicalRecord.find({
    _id: { $in: approvedRecordIds },
  })
    .populate("patient", "name email")
    .sort({ createdAt: -1 })
    .limit(6);

  // Recent doctor activities
  const activities = await Activity.find({
    $or: [{ user: doctorId }, { relatedDoctor: doctorId }],
  })
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalPatients: patientIds.size,
        pendingRequests: pendingRequestsCount,
        approvedRecordsCount: approvedRecordIds.length,
        auditViewsCount: activities.filter((a) => a.action === "view").length,
      },
      recentlyAccessed: approvedRecords,
      activities,
    },
  });
});

/**
 * @desc   Get doctor's patient registry (patients with active/approved access)
 * @route  GET /api/doctors/patients
 */
export const getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const now = new Date();

  // Find all requests involving this doctor
  const permissions = await AccessRequest.find({
    doctor: doctorId,
  })
    .populate("patient", "-password")
    .populate("records");

  // Map to distinct patients with record counts and latest request status
  const patientMap = new Map();

  permissions.forEach((perm) => {
    if (!perm.patient) return;
    const patId = perm.patient._id.toString();

    if (!patientMap.has(patId)) {
      patientMap.set(patId, {
        id: perm.patient._id,
        name: perm.patient.name,
        email: perm.patient.email,
        phone: perm.patient.phone || "+91 9XXXX XXXXX",
        age: perm.patient.dateOfBirth || 30,
        gender: perm.patient.gender || "Patient",
        bloodGroup: perm.patient.bloodGroup || "O+",
        address: perm.patient.address || "",
        sharedRecordCount: 0,
        lastVisit: perm.updatedAt ? new Date(perm.updatedAt).toLocaleDateString() : "Recent",
        status: perm.status === "approved" ? "Active" : perm.status === "pending" ? "Pending" : "Inactive",
      });
    }

    // If approved and not expired, add to shared count
    const isStillActive =
      perm.status === "approved" &&
      (!perm.expiryDate || new Date(perm.expiryDate) > now);

    if (isStillActive) {
      const p = patientMap.get(patId);
      p.sharedRecordCount += perm.records?.length || 0;
      p.status = "Active";
    }
  });

  const patients = Array.from(patientMap.values());

  res.status(200).json({
    success: true,
    count: patients.length,
    patients,
  });
});

/**
 * @desc   Get access requests for this doctor
 * @route  GET /api/doctors/requests
 */
export const getDoctorRequests = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const requests = await AccessRequest.find({ doctor: doctorId })
    .populate("patient", "name email phone dateOfBirth gender bloodGroup")
    .populate("records", "title category reportDate")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

/**
 * @desc   Get shared records approved for this doctor (ONLY approved!)
 * @route  GET /api/doctors/records
 */
export const getDoctorSharedRecords = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const now = new Date();

  // Find all approved, non-expired permissions for this doctor
  const permissions = await AccessRequest.find({
    doctor: doctorId,
    status: "approved",
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: now } },
      { expiresAt: { $gt: now } },
    ],
  });

  const recordIds = new Set();
  const patientIdsWithFullAccess = [];

  permissions.forEach((p) => {
    if (Array.isArray(p.records) && p.records.length > 0) {
      p.records.forEach((rId) => recordIds.add(rId.toString()));
    } else if (p.patient) {
      patientIdsWithFullAccess.push(p.patient);
    }
  });

  const orConditions = [];
  if (recordIds.size > 0) {
    orConditions.push({ _id: { $in: Array.from(recordIds) } });
  }
  if (patientIdsWithFullAccess.length > 0) {
    orConditions.push({ patient: { $in: patientIdsWithFullAccess } });
  }

  const records = orConditions.length > 0
    ? await MedicalRecord.find({ $or: orConditions })
        .populate("patient", "name email phone")
        .sort({ createdAt: -1 })
    : [];

  res.status(200).json({
    success: true,
    count: records.length,
    records,
  });
});

/**
 * @desc   Upload doctor verification credentials/documents
 * @route  POST /api/doctors/verification-documents
 */
export const uploadVerificationDocument = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { title, category } = req.body;

  if (!req.file) {
    throw new ApiError(400, "Please attach a verification document (PDF, PNG, JPG).");
  }

  if (!title) {
    throw new ApiError(400, "Document title is required.");
  }

  // Upload to Cloudinary private folder
  const uploadResult = await uploadDoctorDocumentToCloudinary(req.file.path);

  const document = await DoctorDocument.create({
    doctor: doctorId,
    title: title.trim(),
    category: category || "Medical License",
    fileUrl: uploadResult.fileUrl,
    publicId: uploadResult.publicId,
    fileSize: `${(uploadResult.bytes / (1024 * 1024)).toFixed(1)} MB`,
    format: uploadResult.format,
    status: "Pending",
  });

  // Set doctor status to PENDING verification
  await Doctor.findByIdAndUpdate(doctorId, { verificationStatus: "PENDING" });

  await Activity.create({
    user: doctorId,
    userRole: "doctor",
    action: "document_upload",
    description: `Uploaded verification document: '${document.title}' (${document.category}). Awaiting admin review.`,
  });

  res.status(201).json({
    success: true,
    message: "Verification document uploaded successfully and submitted for admin review.",
    document,
  });
});
