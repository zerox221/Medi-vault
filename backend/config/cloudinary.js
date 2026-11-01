import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log("☁️  [Cloudinary Configured] Private medical cloud storage ready.");
} else {
  console.warn(
    "⚠️  [Cloudinary Notice] Cloudinary keys not fully provided in .env. Falling back to local secure storage until keys are configured."
  );
}

export { cloudinary, isConfigured as isCloudinaryConfigured };
