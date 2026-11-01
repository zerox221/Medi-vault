import express from "express";
import {
  summarizeRecord,
  getRecordSummary,
  askPatientQuestion,
  searchPatientReports,
  reprocessRecordRag,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(protect);

// Patient RAG Q&A and Medical Report Search
router.post("/ask", authorizeRoles("user"), aiLimiter, askPatientQuestion);
router.post("/search", authorizeRoles("user"), aiLimiter, searchPatientReports);
router.post("/reprocess/:recordId", authorizeRoles("user", "admin"), reprocessRecordRag);

// Summarize or retrieve clinical AI summary
router.post(
  "/summarize/:recordId",
  authorizeRoles("user", "doctor", "admin"),
  summarizeRecord
);

router.get(
  "/summary/:recordId",
  authorizeRoles("user", "doctor", "admin"),
  getRecordSummary
);

export default router;
