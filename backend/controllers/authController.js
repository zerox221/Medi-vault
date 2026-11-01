import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { Admin } from "../models/Admin.js";
import { OTP } from "../models/OTP.js";
import { Activity } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { generateNumericOTP, hashOTP, verifyOTPHash } from "../utils/generateOTP.js";
import { sendVerificationOTPEmail, sendPasswordResetEmail } from "../services/emailService.js";

// Helper to set cookie
const setAuthCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };
  res.cookie("token", token, cookieOptions);
};

/**
 * @desc   Register a new patient
 * @route  POST /api/auth/patient/register
 */
export const registerPatient = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if account already exists across any role
  const existingUser = await User.findOne({ email: normalizedEmail });
  const existingDoctor = await Doctor.findOne({ email: normalizedEmail });
  if (existingUser || existingDoctor) {
    throw new ApiError(409, "An account with this email address already exists.");
  }

  // Create patient user (unverified email initially)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "user",
    isEmailVerified: false,
  });

  // Generate 6-digit OTP
  const rawOtp = generateNumericOTP(6);
  const otpHash = await hashOTP(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OTP.deleteMany({ email: normalizedEmail, purpose: "email_verification" });
  await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "email_verification",
    expiresAt,
  });

  // Dispatch email
  await sendVerificationOTPEmail(normalizedEmail, user.name, rawOtp);

  // Generate token so patient can proceed or verify
  const token = generateToken({ id: user._id, role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Patient registered successfully. A 6-digit verification code has been sent to your email.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    // If Brevo is not configured, supply dev hint
    devOtpNotice: process.env.NODE_ENV !== "production" ? `Dev OTP: ${rawOtp}` : undefined,
  });
});

/**
 * @desc   Register a new doctor
 * @route  POST /api/auth/doctor/register
 */
export const registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    specialization,
    qualification,
    medicalRegistrationNumber,
    registeredCouncil,
    hospitalName,
  } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !specialization ||
    !qualification ||
    !medicalRegistrationNumber ||
    !registeredCouncil
  ) {
    throw new ApiError(
      400,
      "Please provide all required professional registration fields."
    );
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Duplicate checks
  const existingEmail =
    (await User.findOne({ email: normalizedEmail })) ||
    (await Doctor.findOne({ email: normalizedEmail }));
  if (existingEmail) {
    throw new ApiError(409, "An account with this email address already exists.");
  }

  const existingRegNo = await Doctor.findOne({
    medicalRegistrationNumber: medicalRegistrationNumber.trim(),
  });
  if (existingRegNo) {
    throw new ApiError(
      409,
      "A doctor with this medical registration number is already registered."
    );
  }

  // Create doctor (verificationStatus defaults to PENDING)
  const doctor = await Doctor.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "doctor",
    specialization: specialization.trim(),
    qualification: qualification.trim(),
    medicalRegistrationNumber: medicalRegistrationNumber.trim(),
    registeredCouncil: registeredCouncil.trim(),
    hospitalName: hospitalName ? hospitalName.trim() : "",
    verificationStatus: "PENDING",
    isEmailVerified: false,
  });

  // Generate email verification OTP
  const rawOtp = generateNumericOTP(6);
  const otpHash = await hashOTP(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ email: normalizedEmail, purpose: "email_verification" });
  await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "email_verification",
    expiresAt,
  });

  await sendVerificationOTPEmail(normalizedEmail, doctor.name, rawOtp);

  // Log activity
  await Activity.create({
    user: doctor._id,
    userRole: "doctor",
    action: "register",
    description: `Doctor account created for ${doctor.name}. Status: PENDING verification.`,
  });

  const token = generateToken({ id: doctor._id, role: doctor.role });
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Doctor account created. Please submit verification documents to complete validation.",
    token,
    user: {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      medicalRegistrationNumber: doctor.medicalRegistrationNumber,
      verificationStatus: doctor.verificationStatus,
      isEmailVerified: doctor.isEmailVerified,
    },
    devOtpNotice: process.env.NODE_ENV !== "production" ? `Dev OTP: ${rawOtp}` : undefined,
  });
});

/**
 * @desc   Verify email with OTP
 * @route  POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and 6-digit OTP code are required.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find active OTP record
  const otpRecord = await OTP.findOne({
    email: normalizedEmail,
    purpose: "email_verification",
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired verification code. Please request a new one.");
  }

  const isMatch = await verifyOTPHash(otp.trim(), otpRecord.otpHash);
  if (!isMatch) {
    throw new ApiError(400, "Incorrect verification code. Please check and try again.");
  }

  // Update user verification status
  let updatedAccount = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { isEmailVerified: true },
    { new: true }
  );

  let role = "user";
  if (!updatedAccount) {
    updatedAccount = await Doctor.findOneAndUpdate(
      { email: normalizedEmail },
      { isEmailVerified: true },
      { new: true }
    );
    role = "doctor";
  }

  if (!updatedAccount) {
    throw new ApiError(404, "User account not found.");
  }

  // Remove used OTP
  await OTP.deleteMany({ email: normalizedEmail, purpose: "email_verification" });

  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    user: {
      id: updatedAccount._id,
      name: updatedAccount.name,
      email: updatedAccount.email,
      role,
      isEmailVerified: true,
    },
  });
});

/**
 * @desc   Resend email verification OTP
 * @route  POST /api/auth/resend-otp
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const account =
    (await User.findOne({ email: normalizedEmail })) ||
    (await Doctor.findOne({ email: normalizedEmail }));

  if (!account) {
    throw new ApiError(404, "No account found with this email address.");
  }

  const rawOtp = generateNumericOTP(6);
  const otpHash = await hashOTP(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ email: normalizedEmail, purpose: "email_verification" });
  await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "email_verification",
    expiresAt,
  });

  await sendVerificationOTPEmail(normalizedEmail, account.name, rawOtp);

  res.status(200).json({
    success: true,
    message: "A new verification code has been dispatched to your email.",
    devOtpNotice: process.env.NODE_ENV !== "production" ? `Dev OTP: ${rawOtp}` : undefined,
  });
});

/**
 * @desc   Authenticate user (Patient, Doctor, or Admin)
 * @route  POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  let account = null;
  let userRole = role;

  // If role is specified, look in that model first (with Admin fallback)
  if (role === "admin") {
    account = await Admin.findOne({ email: normalizedEmail }).select("+password");
    userRole = "admin";
  } else if (role === "doctor") {
    account = await Doctor.findOne({ email: normalizedEmail }).select("+password");
    userRole = "doctor";
    if (!account) {
      const adminAcc = await Admin.findOne({ email: normalizedEmail }).select("+password");
      if (adminAcc) {
        account = adminAcc;
        userRole = "admin";
      }
    }
  } else if (role === "user" || role === "patient") {
    account = await User.findOne({ email: normalizedEmail }).select("+password");
    userRole = "user";
    if (!account) {
      const adminAcc = await Admin.findOne({ email: normalizedEmail }).select("+password");
      if (adminAcc) {
        account = adminAcc;
        userRole = "admin";
      }
    }
  } else {
    // Probe models in order: Admin, User, Doctor
    account = await Admin.findOne({ email: normalizedEmail }).select("+password");
    if (account) {
      userRole = "admin";
    } else {
      account = await User.findOne({ email: normalizedEmail }).select("+password");
      if (account) {
        userRole = "user";
      } else {
        account = await Doctor.findOne({ email: normalizedEmail }).select("+password");
        if (account) {
          userRole = "doctor";
        }
      }
    }
  }

  if (!account) {
    throw new ApiError(401, "Invalid email or password credentials.");
  }

  const isPasswordMatch = await account.matchPassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid email or password credentials.");
  }

  const token = generateToken({ id: account._id, role: userRole });
  setAuthCookie(res, token);

  // Log activity
  await Activity.create({
    user: account._id,
    userRole,
    action: "login",
    description: `${account.name} logged in successfully.`,
    ipAddress: req.ip || "",
  });

  const responseUser = {
    id: account._id,
    name: account.name,
    email: account.email,
    role: userRole,
    isEmailVerified: account.isEmailVerified,
    phone: account.phone || "",
    avatar: account.avatar || "",
  };

  if (userRole === "doctor") {
    responseUser.specialization = account.specialization;
    responseUser.qualification = account.qualification;
    responseUser.medicalRegistrationNumber = account.medicalRegistrationNumber;
    responseUser.registeredCouncil = account.registeredCouncil;
    responseUser.hospitalName = account.hospitalName;
    responseUser.verificationStatus = account.verificationStatus;
  }

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: responseUser,
  });
});

/**
 * @desc   Get current authenticated user profile
 * @route  GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  const responseUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    phone: user.phone || "",
    avatar: user.avatar || "",
  };

  if (user.role === "doctor") {
    responseUser.specialization = user.specialization;
    responseUser.qualification = user.qualification;
    responseUser.medicalRegistrationNumber = user.medicalRegistrationNumber;
    responseUser.registeredCouncil = user.registeredCouncil;
    responseUser.hospitalName = user.hospitalName;
    responseUser.verificationStatus = user.verificationStatus;
    responseUser.department = user.department;
    responseUser.experience = user.experience;
    responseUser.bio = user.bio;
  } else if (user.role === "user") {
    responseUser.gender = user.gender;
    responseUser.dateOfBirth = user.dateOfBirth;
    responseUser.bloodGroup = user.bloodGroup;
    responseUser.address = user.address;
  }

  res.status(200).json({
    success: true,
    user: responseUser,
  });
});

/**
 * @desc   Logout user and clear auth cookies
 * @route  POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  if (req.user) {
    await Activity.create({
      user: req.user._id,
      userRole: req.user.role,
      action: "logout",
      description: `${req.user.name} logged out.`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

/**
 * @desc   Request password reset OTP
 * @route  POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please provide your registered email address.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const account =
    (await User.findOne({ email: normalizedEmail })) ||
    (await Doctor.findOne({ email: normalizedEmail }));

  // Always return success message to prevent user enumeration attacks
  if (!account) {
    return res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset code has been sent.",
    });
  }

  const rawOtp = generateNumericOTP(6);
  const otpHash = await hashOTP(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ email: normalizedEmail, purpose: "password_reset" });
  await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "password_reset",
    expiresAt,
  });

  await sendPasswordResetEmail(normalizedEmail, account.name, rawOtp);

  res.status(200).json({
    success: true,
    message: "If an account with this email exists, a password reset code has been sent.",
    devOtpNotice: process.env.NODE_ENV !== "production" ? `Dev OTP: ${rawOtp}` : undefined,
  });
});

/**
 * @desc   Reset password using OTP
 * @route  POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP code, and new password are required.");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await OTP.findOne({
    email: normalizedEmail,
    purpose: "password_reset",
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired password reset code. Please request a new code.");
  }

  const isMatch = await verifyOTPHash(otp.trim(), otpRecord.otpHash);
  if (!isMatch) {
    throw new ApiError(400, "Incorrect password reset code.");
  }

  // Update password
  let account = await User.findOne({ email: normalizedEmail });
  if (account) {
    account.password = newPassword;
    await account.save();
  } else {
    account = await Doctor.findOne({ email: normalizedEmail });
    if (account) {
      account.password = newPassword;
      await account.save();
    }
  }

  if (!account) {
    throw new ApiError(404, "User account not found.");
  }

  await OTP.deleteMany({ email: normalizedEmail, purpose: "password_reset" });

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password.",
  });
});
