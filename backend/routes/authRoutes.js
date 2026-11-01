import express from "express";
import {
  registerPatient,
  registerDoctor,
  verifyEmail,
  resendOTP,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/patient/register", authLimiter, registerPatient);
router.post("/doctor/register", authLimiter, registerDoctor);
router.post("/verify-email", otpLimiter, verifyEmail);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
