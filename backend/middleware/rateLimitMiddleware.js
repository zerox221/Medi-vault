import rateLimit from "express-rate-limit";

// Rate limiter for authentication attempts (login, register, forgot-password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per 15 minutes per IP
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for OTP verification and generation
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max 10 OTP requests per 5 minutes
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 5 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI Q&A and RAG search requests
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 queries per minute per IP
  message: {
    success: false,
    message: "Too many AI medical search queries. Please slow down and try again shortly.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
