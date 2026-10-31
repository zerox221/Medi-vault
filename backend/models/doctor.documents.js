
const mongoose = require("mongoose");

const doctorDocumentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },

    medicalRegistrationCertificate: {
      documentUrl: {
        type: String,
        required: true,
      },
      cloudinaryPublicId: {
        type: String,
        required: true,
      },
    },

    medicalDegreeCertificate: {
      documentUrl: {
        type: String,
        required: true,
      },
      cloudinaryPublicId: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const DoctorDocument = mongoose.model(
  "DoctorDocument",
  doctorDocumentSchema
);

module.exports = DoctorDocument;
