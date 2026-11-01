import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shareOtp: {
      type: String,
    },
    otpHash: {
      type: String,
      index: true,
    },
    records: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord",
      },
    ],
    status: {
      type: String,
      enum: ["active", "scanned", "approved", "rejected", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    scannedByDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    scannedAt: {
      type: Date,
    },
    accessRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
    },
    expiryDuration: {
      type: String,
      default: "24 hours",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup after expiry
    },
  },
  {
    timestamps: true,
  }
);

export const QRSession = mongoose.model("QRSession", qrSessionSchema);
