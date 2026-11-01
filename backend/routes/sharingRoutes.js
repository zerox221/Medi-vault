import express from "express";
import {
  requestAccess,
  getPatientSharingRequests,
  getDoctorSharingRequests,
  approveSharingRequest,
  rejectSharingRequest,
  revokeSharingAccess,
  getSharingStatus,
} from "../controllers/sharingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Doctor requests access to patient records
router.post("/request", authorizeRoles("doctor"), requestAccess);

// Patient sharing requests
router.get("/patient/requests", authorizeRoles("user"), getPatientSharingRequests);

// Doctor sharing requests
router.get("/doctor/requests", authorizeRoles("doctor"), getDoctorSharingRequests);

// Patient decisions on sharing requests
router.post("/:id/approve", authorizeRoles("user"), approveSharingRequest);
router.post("/:id/reject", authorizeRoles("user"), rejectSharingRequest);
router.post("/:id/revoke", authorizeRoles("user"), revokeSharingAccess);

// Check access status (patient or doctor)
router.get("/:id/status", authorizeRoles("user", "doctor", "admin"), getSharingStatus);

export default router;
