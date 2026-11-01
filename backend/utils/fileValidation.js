import fs from "fs";
import crypto from "crypto";

const DEFAULT_MAX_SIZE_MB = 20;

/**
 * Validates an uploaded medical report file before processing
 * Checks magic bytes, size limits, and basic structure
 */
export const validateMedicalReportFile = (fileOrBuffer, originalName = "report.pdf") => {
  let buffer;
  let size;

  if (Buffer.isBuffer(fileOrBuffer)) {
    buffer = fileOrBuffer;
    size = buffer.length;
  } else if (typeof fileOrBuffer === "string") {
    if (!fs.existsSync(fileOrBuffer)) {
      return { valid: false, error: "Report file does not exist on disk." };
    }
    const stats = fs.statSync(fileOrBuffer);
    size = stats.size;
    // Read first 1024 bytes for magic byte verification
    const fd = fs.openSync(fileOrBuffer, "r");
    buffer = Buffer.alloc(Math.min(1024, size));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
  } else if (fileOrBuffer && fileOrBuffer.buffer) {
    buffer = fileOrBuffer.buffer;
    size = fileOrBuffer.size || buffer.length;
  } else {
    return { valid: false, error: "Invalid file format provided for medical validation." };
  }

  // 1. Non-empty check
  if (!size || size < 64) {
    return { valid: false, error: "Uploaded file is empty or corrupted (under 64 bytes)." };
  }

  // 2. Max size check
  const maxMb = parseFloat(process.env.MAX_FILE_SIZE_MB) || DEFAULT_MAX_SIZE_MB;
  const maxBytes = maxMb * 1024 * 1024;
  if (size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the permitted limit of ${maxMb}MB. Please compress your medical report.`,
    };
  }

  // 3. PDF Magic Bytes Check (%PDF- = 0x25 0x50 0x44 0x46)
  const header = buffer.slice(0, 5).toString("ascii");
  if (!header.startsWith("%PDF-")) {
    return {
      valid: false,
      error: "Security validation failed: File is not a valid PDF document (invalid magic bytes).",
    };
  }

  return {
    valid: true,
    fileSizeMb: (size / (1024 * 1024)).toFixed(2),
  };
};

/**
 * Computes SHA-256 hash of a file or buffer for duplicate upload detection
 */
export const computeFileHash = (filePathOrBuffer) => {
  try {
    const hash = crypto.createHash("sha256");
    if (Buffer.isBuffer(filePathOrBuffer)) {
      hash.update(filePathOrBuffer);
    } else if (typeof filePathOrBuffer === "string" && fs.existsSync(filePathOrBuffer)) {
      const data = fs.readFileSync(filePathOrBuffer);
      hash.update(data);
    }
    return hash.digest("hex");
  } catch {
    return null;
  }
};
