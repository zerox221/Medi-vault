import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "\n⚠️  [MediVault Warning] MONGODB_URI is not set in backend/.env."
    );
    console.warn(
      "👉 Please provide a valid MongoDB connection string in backend/.env to persist data.\n"
    );
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`🍃 [MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name} (Primary Database)`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    // Don't kill process immediately in dev so app can guide developer
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
};
