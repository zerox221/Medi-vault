import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import { Admin } from "../models/Admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Hardcoded system administrator accounts
const HARDCODED_ADMINS = [
  {
    name: "balam chauhan",
    email: "balamchauhan340@gmail.com",
    password: "Bacardi90ml",
    role: "admin",
  },
  {
    name: "MediVault Super Admin",
    email: "admin@medivault.com",
    password: "Admin@123456",
    role: "admin",
  },
];

export const ensureAdminSeeded = async () => {
  try {
    // Also include any custom credentials specified in environment variables
    const envAdminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env["ADMIN_EMAIL "] ||
      ""
    )
      .toLowerCase()
      .trim();

    const envAdminPassword = (
      process.env.ADMIN_PASSWORD ||
      process.env["ADMIN_PASSWORD "] ||
      ""
    ).trim();

    const envAdminName = (
      process.env.ADMIN_NAME ||
      process.env["ADMIN_NAME "] ||
      ""
    ).trim();

    const adminList = [...HARDCODED_ADMINS];
    if (envAdminEmail && envAdminPassword) {
      if (!adminList.some((a) => a.email.toLowerCase() === envAdminEmail)) {
        adminList.push({
          name: envAdminName || "MediVault Admin",
          email: envAdminEmail,
          password: envAdminPassword,
          role: "admin",
        });
      }
    }

    for (const adm of adminList) {
      const existing = await Admin.findOne({ email: adm.email.toLowerCase() });
      if (!existing) {
        await Admin.create({
          name: adm.name,
          email: adm.email.toLowerCase(),
          password: adm.password,
          role: "admin",
        });
        console.log(`✅ [Hardcoded Admin Initialized in DB]: ${adm.email}`);
      }
    }
  } catch (error) {
    console.warn("⚠️ [Admin Seed Note]:", error.message);
  }
};

const runStandalone = async () => {
  const conn = await connectDB();
  if (!conn) {
    console.error("❌ MongoDB connection failed.");
    process.exit(1);
  }
  await ensureAdminSeeded();
  console.log("✅ Hardcoded administrators confirmed in database.");
  process.exit(0);
};

if (process.argv[1] && process.argv[1].includes("seedAdmin.js")) {
  runStandalone();
}
