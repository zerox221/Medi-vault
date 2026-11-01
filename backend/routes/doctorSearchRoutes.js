import express from "express";
import {
  searchAuthorizedPatients,
  getPatientAuthorizedReports,
  searchDoctorReports,
  askDoctorQuestion,
} from "../controllers/doctorSearchController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// All doctor search routes require valid authentication & doctor role
router.use(protect);
router.use(authorizeRoles("doctor"));

// Patient lookups
router.get("/patients/search", searchAuthorizedPatients);
router.get("/patients/:patientId/reports", getPatientAuthorizedReports);

// Search & AI Q&A with rate limiting
router.post("/reports/search", aiLimiter, searchDoctorReports);
router.post("/ai/ask", aiLimiter, askDoctorQuestion);

export default router;
