import crypto from "crypto";
import bcrypt from "bcryptjs";

export const generateNumericOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

export const verifyOTPHash = async (otp, hashedOtp) => {
  return bcrypt.compare(otp, hashedOtp);
};
