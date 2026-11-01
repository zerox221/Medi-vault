import express from "express";
import {
  getAdminDashboard,
  getAllDoctors,
  getPendingDoctors,
  getDoctorDetailsForAdmin,
  verifyDoctor,
  rejectDoctor,
  getAdminActivity,
} from "../controllers/adminController.js";
import { getAllPatients } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

// Dashboard metrics & overview
router.get("/dashboard", getAdminDashboard);

// Doctors management & verification
router.get("/doctors", getAllDoctors);
router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors/:id", getDoctorDetailsForAdmin);
router.post("/doctors/:id/verify", verifyDoctor);
router.post("/doctors/:id/reject", rejectDoctor);

// Patients directory
router.get("/patients", getAllPatients);

// Platform audit logs
router.get("/activity", getAdminActivity);

export default router;
