import jwt from "jsonwebtoken";

export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
  const secret = process.env.JWT_SECRET || "medivault_super_secret_jwt_key_2026";
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || "medivault_super_secret_jwt_key_2026";
  return jwt.verify(token, secret);
};
