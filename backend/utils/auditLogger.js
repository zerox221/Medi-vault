import { Activity } from "../models/Activity.js";

/**
 * Security & Compliance Audit Logger for Medical Record Search and RAG Access
 */
export const logAuditActivity = async ({
  userId,
  userRole,
  action,
  description,
  relatedRecord = null,
  relatedDoctor = null,
  relatedPatient = null,
  metadata = {},
}) => {
  try {
    return await Activity.create({
      user: userId,
      userRole,
      action,
      description,
      relatedRecord: relatedRecord || undefined,
      relatedDoctor: relatedDoctor || undefined,
      relatedPatient: relatedPatient || undefined,
      metadata,
    });
  } catch (err) {
    console.warn("⚠️ [Audit Log Warning]: Could not record audit entry:", err.message);
    return null;
  }
};
