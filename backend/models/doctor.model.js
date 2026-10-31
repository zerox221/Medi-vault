
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    qualification: {
      type: String,
      required: true,
    },

    medicalRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    registeredCouncil: {
      type: String,
      required: true,
    },

    hospitalName: {
      type: String,
      default: "",
    },

    // Doctor verification status
    verificationStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"],
      default: "NOT_SUBMITTED",
    },

    // Reference to uploaded verification documents
    documents: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorDocument",
      default: null,
    },

    // Patients who have shared access
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
