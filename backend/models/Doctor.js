import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Professional email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid professional email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["doctor"],
      default: "doctor",
    },
    specialization: {
      type: String,
      required: [true, "Medical specialization is required"],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, "Medical qualification is required"],
      trim: true,
    },
    medicalRegistrationNumber: {
      type: String,
      required: [true, "Medical registration number is required"],
      unique: true,
      trim: true,
    },
    registeredCouncil: {
      type: String,
      required: [true, "Registered medical council is required"],
      trim: true,
    },
    hospitalName: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    verificationRejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
