import { MedicalRecord } from "../models/MedicalRecord.js";
import { verifyDoctorRecordAccess } from "../services/sharingService.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware ensuring the authenticated user (patient or doctor)
 * has legitimate authorization to access the specified record (:id or :recordId)
 */
export const verifyRecordAccess = async (req, res, next) => {
  try {
    const recordId = req.params.id || req.params.recordId || req.body.recordId;
    const user = req.user;

    if (!recordId) {
      return next(new ApiError(400, "Record ID is required for access verification."));
    }

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return next(new ApiError(404, "Medical record not found."));
    }

    if (user.role === "user") {
      if (record.patient.toString() !== user._id.toString()) {
        return next(
          new ApiError(
            403,
            "Access Denied: You do not have permission to access another patient's medical record."
          )
        );
      }
    } else if (user.role === "doctor") {
      await verifyDoctorRecordAccess(user._id, record._id);
    } else if (user.role !== "admin") {
      return next(new ApiError(403, "Not authorized to access medical records."));
    }

    req.medicalRecord = record;
    next();
  } catch (error) {
    next(error);
  }
};
