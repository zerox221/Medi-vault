import mongoose from "mongoose";

const doctorDocumentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Academic Qualification",
        "Medical License",
        "Hospital Affiliation",
        "Board Certification",
        "Government ID",
        "Other",
      ],
      default: "Medical License",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      default: "",
    },
    format: {
      type: String,
      default: "PDF",
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const DoctorDocument = mongoose.model("DoctorDocument", doctorDocumentSchema);
