import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An account with this ${field} already exists.`;
    error = new ApiError(409, message);
  }

  // Handle Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    const maxMb = process.env.MAX_FILE_SIZE_MB || 10;
    error = new ApiError(400, `File size exceeds the allowed limit of ${maxMb} MB.`);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode || 500).json(response);
};

export const notFound = (req, res, next) => {
  const error = new ApiError(404, `API route not found: ${req.originalUrl}`);
  next(error);
};
