import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
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
      enum: ["pending", "approved", "rejected", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    purpose: {
      type: String,
      default: "Clinical consultation and records review",
    },
    notes: {
      type: String,
      default: "",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    rejectedDate: {
      type: Date,
    },
    revokedDate: {
      type: Date,
    },
    expiryHours: {
      type: Number,
      default: 24,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify active authorization
accessRequestSchema.methods.isActive = function () {
  if (this.status !== "approved") return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
};

export const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
