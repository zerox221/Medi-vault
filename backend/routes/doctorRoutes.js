import express from "express";
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorDashboard,
  getDoctorPatients,
  getDoctorRequests,
  getDoctorSharedRecords,
  uploadVerificationDocument,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { uploadDoctorDocument } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("doctor"));

router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.get("/dashboard", getDoctorDashboard);
router.get("/patients", getDoctorPatients);
router.get("/requests", getDoctorRequests);
router.get("/records", getDoctorSharedRecords);

// Doctor verification document upload
router.post(
  "/verification-documents",
  uploadDoctorDocument.single("document"),
  uploadVerificationDocument
);

export default router;
