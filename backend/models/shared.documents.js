
const mongoose = require("mongoose");

const qrSessionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    sharedRecordIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord",
      },
    ],

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REVOKED", "EXPIRED"],
      default: "PENDING",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const QRSession = mongoose.model("QRSession", qrSessionSchema);

module.exports = QRSession;
