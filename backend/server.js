import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "fs";

// Load environment variables
dotenv.config();

// Normalize any trailing spaces on keys and values in process.env
Object.keys(process.env).forEach((key) => {
  const trimmedKey = key.trim();
  if (trimmedKey !== key) {
    process.env[trimmedKey] = process.env[key];
  }
  if (typeof process.env[trimmedKey] === "string") {
    process.env[trimmedKey] = process.env[trimmedKey].trim();
  }
});

// Validate environment variables & log active AI providers
import { validateEnv } from "./config/env.js";
validateEnv();

// Connect Database & Ensure Admin Seeded
import { connectDB } from "./config/db.js";
import { ensureAdminSeeded } from "./utils/seedAdmin.js";
import { initPostgresSchema } from "./services/rag/postgresVectorStore.js";

connectDB().then((conn) => {
  if (conn) {
    ensureAdminSeeded();
  }
});

// Test Neon PostgreSQL connection and initialize pgvector schema on startup
if (process.env.VECTOR_STORE === "postgres" || process.env.DATABASE_URL) {
  initPostgresSchema()
    .then((ready) => {
      if (ready) {
        console.log("🚀 [MediVault Boot]: Neon PostgreSQL pgvector ready for medical RAG.");
      }
    })
    .catch((err) => {
      console.error("❌ [MediVault Boot Error]: Neon PostgreSQL initialization failed:", err.message);
    });
}

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import doctorSearchRoutes from "./routes/doctorSearchRoutes.js";
import sharingRoutes from "./routes/sharingRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Middlewares
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security headers with cross-origin asset allowance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Cross-Origin Resource Sharing
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in development for ease of testing
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing & cookies
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET || "medivault-secret"));

// Static uploads serving for local fallback
app.use("/uploads", express.static(uploadsDir));

// Health Check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "MediVault API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/doctors", doctorSearchRoutes);
app.use("/api/doctor", doctorSearchRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/sharing", sharingRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Process-level crash protection
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ [Unhandled Promise Rejection]:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("⚠️ [Uncaught Exception]:", error);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🏥 [MediVault Server Running]`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
