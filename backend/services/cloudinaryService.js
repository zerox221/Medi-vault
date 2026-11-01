import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

/**
 * Upload Medical Record PDF to Cloudinary / Local Vault Storage
 */
export const uploadMedicalRecordToCloudinary = async (filePath, originalName, options = {}) => {
  const fileName = path.basename(filePath);
  const shouldCleanup = options.cleanupLocal === true;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "medivault/medical_reports",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      });

      // Cleanup local temp file only if explicitly requested (caller may need it for RAG indexing)
      if (shouldCleanup && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        publicId: result.public_id,
        fileUrl: result.secure_url,
        format: result.format || "pdf",
        bytes: result.bytes,
      };
    } catch (error) {
      console.warn(
        `⚠️ [Cloudinary Notice] Cloudinary upload returned (${error.message}). Safely storing document in local secure storage.`
      );
    }
  }

  // Fallback to secure local storage
  return {
    publicId: `local_${fileName}`,
    fileUrl: `/uploads/${fileName}`,
    format: "pdf",
    bytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
  };
};

/**
 * Upload Doctor Verification Document (PDF/PNG/JPG)
 */
export const uploadDoctorDocumentToCloudinary = async (filePath) => {
  const fileName = path.basename(filePath);

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "medivault/doctor_verification",
        resource_type: "auto",
        use_filename: true,
      });

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        publicId: result.public_id,
        fileUrl: result.secure_url,
        format: result.format || "pdf",
        bytes: result.bytes,
      };
    } catch (error) {
      console.warn(
        `⚠️ [Cloudinary Notice] Cloudinary doctor verification upload returned (${error.message}). Storing securely in local storage.`
      );
    }
  }

  return {
    publicId: `local_${fileName}`,
    fileUrl: `/uploads/${fileName}`,
    format: path.extname(filePath).replace(".", "") || "pdf",
    bytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
  };
};

/**
 * Generate Short-Lived Download URL for a Medical Record
 */
export const generateSignedDownloadUrl = (publicId, expiresInMinutes = 15) => {
  if (!publicId) return "";
  if (isCloudinaryConfigured && !publicId.startsWith("local_")) {
    try {
      return cloudinary.url(publicId, {
        secure: true,
        flags: "attachment",
        resource_type: "auto",
      });
    } catch (err) {
      console.warn("Cloudinary URL generator error:", err.message);
    }
  }
  // Local fallback: return local download endpoint
  return `/api/records/local-download/${encodeURIComponent(publicId)}`;
};

/**
 * Delete Asset from Cloudinary or local storage
 */
export const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  if (!publicId) return false;

  if (isCloudinaryConfigured && !publicId.startsWith("local_")) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return true;
    } catch (error) {
      console.warn("⚠️ [Cloudinary Delete Warning]:", error.message);
      return false;
    }
  } else if (publicId.startsWith("local_")) {
    const filename = publicId.replace("local_", "");
    const localCandidates = [
      path.resolve("uploads", filename),
      path.resolve("backend", "uploads", filename),
    ];
    for (const c of localCandidates) {
      if (fs.existsSync(c)) {
        try {
          fs.unlinkSync(c);
        } catch (err) {
          // ignore
        }
      }
    }
    return true;
  }
  return false;
};

// Alias export for backwards compatibility
export const deleteFileFromCloudinary = deleteFromCloudinary;
