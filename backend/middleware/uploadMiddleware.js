import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

// Ensure local uploads directory exists for temporary staging
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  },
});

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10;
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

// Medical Record PDF Filter: strictly PDF only
const medicalPdfFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        "Invalid file format: Medical records must be in PDF format (.pdf) only."
      ),
      false
    );
  }
};

// Doctor verification documents filter: PDF, PNG, JPG/JPEG
const doctorDocumentFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        "Invalid file format: Verification documents must be PDF, PNG, or JPG."
      ),
      false
    );
  }
};

export const uploadMedicalRecord = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: medicalPdfFilter,
});

export const uploadDoctorDocument = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: doctorDocumentFilter,
});
