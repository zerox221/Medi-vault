import express from "express";
import {
  createQRSession,
  scanQRCode,
  getQRSessionDetails,
  revokeQRSession,
} from "../controllers/qrController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Patient generates a fresh QR sharing session
router.post("/create", authorizeRoles("user"), createQRSession);

// Doctor scans the QR code token
router.post("/scan", authorizeRoles("doctor"), scanQRCode);

// Session details inspection
router.get("/session/:id", authorizeRoles("user", "doctor", "admin"), getQRSessionDetails);

// Patient revokes an active QR sharing session
router.post("/session/:id/revoke", authorizeRoles("user"), revokeQRSession);

export default router;
