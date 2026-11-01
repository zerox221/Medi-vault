import express from "express";
import {
  uploadRecord,
  getPatientRecords,
  getRecordById,
  getRecordDownloadUrl,
  downloadLocalFile,
  deleteRecord,
  summarizeRecord,
  getRecordProcessingStatus,
} from "../controllers/medicalRecordController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { uploadMedicalRecord } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Fallback local download endpoint (public or with internal verification)
router.get("/local-download/:publicId", downloadLocalFile);

// All routes below require valid JWT authentication
router.use(protect);

// Flexible upload handler accepting "file" or "reportFile"
const uploadMiddlewareHandler = (req, res, next) => {
  uploadMedicalRecord.fields([
    { name: "file", maxCount: 1 },
    { name: "reportFile", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files["file"]?.[0] || req.files["reportFile"]?.[0] || null;
    }
    next();
  });
};

// Patient medical records
router.post(
  "/upload",
  authorizeRoles("user"),
  uploadMiddlewareHandler,
  uploadRecord
);

router.get("/", authorizeRoles("user"), getPatientRecords);

// Single record inspection & signed download link (accessible by patient, authorized doctor, admin)
router.get("/:id", authorizeRoles("user", "doctor", "admin"), getRecordById);
router.get(
  "/:id/processing-status",
  authorizeRoles("user", "doctor", "admin"),
  getRecordProcessingStatus
);
router.get(
  "/:id/download",
  authorizeRoles("user", "doctor", "admin"),
  getRecordDownloadUrl
);

// Delete record (patient who owns it or admin)
router.delete("/:id", authorizeRoles("user", "admin"), deleteRecord);

// Trigger AI summarization
router.post(
  "/:id/summarize",
  authorizeRoles("user", "doctor"),
  summarizeRecord
);

export default router;
