import { verifyToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { Admin } from "../models/Admin.js";

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new ApiError(401, "Not authorized: Authentication token is missing")
      );
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(
        new ApiError(401, "Not authorized: Invalid or expired token")
      );
    }

    // 4. Find user by role and id
    let user = null;
    if (decoded.role === "user") {
      user = await User.findById(decoded.id).select("-password");
    } else if (decoded.role === "doctor") {
      user = await Doctor.findById(decoded.id).select("-password");
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    }

    if (!user) {
      return next(
        new ApiError(401, "Not authorized: User account no longer exists")
      );
    }

    req.user = user;
    req.user.role = decoded.role;
    next();
  } catch (error) {
    next(new ApiError(401, "Authentication failed", [error.message]));
  }
};
