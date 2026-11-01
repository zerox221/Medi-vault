import { AccessRequest } from "../models/AccessRequest.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validate that a doctor has active, non-expired, non-revoked permission to view or download a specific record
 */
export const verifyDoctorRecordAccess = async (doctorId, recordId) => {
  if (!doctorId || !recordId) {
    throw new ApiError(400, "Doctor ID and Record ID are required for access validation.");
  }

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, "Medical record not found.");
  }

  const now = new Date();
  const validExpiryCondition = {
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: now } },
      { expiresAt: { $gt: now } },
    ],
  };

  // 1. Check if permission has this record ID explicitly
  let permission = await AccessRequest.findOne({
    doctor: doctorId,
    records: record._id,
    status: "approved",
    ...validExpiryCondition,
  });

  // 2. Check if permission is patient-wide (approved for patient with empty records array or all records)
  if (!permission && record.patient) {
    permission = await AccessRequest.findOne({
      doctor: doctorId,
      patient: record.patient,
      status: "approved",
      ...validExpiryCondition,
      $or: [
        { records: { $size: 0 } },
        { records: { $exists: false } },
        { records: record._id },
      ],
    });
  }

  if (!permission) {
    throw new ApiError(
      403,
      "Access Denied: You do not have active patient authorization to view or download this medical record."
    );
  }

  return permission;
};

/**
 * Verify whether a doctor has access to any records of a specific patient
 */
export const getDoctorApprovedRecordsForPatient = async (doctorId, patientId) => {
  const now = new Date();

  const permissions = await AccessRequest.find({
    doctor: doctorId,
    patient: patientId,
    status: "approved",
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: now } },
      { expiresAt: { $gt: now } },
    ],
  }).populate("records");

  const recordIds = new Set();
  permissions.forEach((perm) => {
    perm.records?.forEach((rec) => {
      if (rec && rec._id) {
        recordIds.add(rec._id.toString());
      }
    });
  });

  return Array.from(recordIds);
};
