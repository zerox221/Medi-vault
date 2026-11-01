import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const getBrevoConfig = () => {
  const apiKey = (
    process.env.BREVO_API_KEY ||
    process.env["BREVO_API_KEY "] ||
    ""
  ).trim();

  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env["BREVO_SENDER_EMAIL "] ||
    "no-reply@medivault.com"
  ).trim();

  const senderName = (
    process.env.BREVO_SENDER_NAME ||
    process.env["BREVO_SENDER_NAME "] ||
    "MediVault"
  ).trim();

  const smtpUser = (
    process.env.BREVO_SMTP_USER ||
    process.env["BREVO_SMTP_USER "] ||
    process.env.ADMIN_EMAIL ||
    process.env.EMAIL_USER ||
    senderEmail
  ).trim();

  const isConfigured = Boolean(apiKey && apiKey.length > 8);
  const isApiKey = apiKey.startsWith("xkeysib-");
  const isSmtpKey = apiKey.startsWith("xsmtpsib-");

  return {
    apiKey,
    senderEmail,
    senderName,
    smtpUser,
    isConfigured,
    isApiKey,
    isSmtpKey,
  };
};

const initialConfig = getBrevoConfig();
if (initialConfig.isConfigured) {
  if (initialConfig.isApiKey) {
    console.log("📧 [Brevo Configured] REST API mode enabled (API Key: xkeysib-...).");
  } else if (initialConfig.isSmtpKey) {
    console.log("📧 [Brevo Configured] SMTP Relay mode enabled (SMTP Key: xsmtpsib-...).");
  } else {
    console.log("📧 [Brevo Configured] Transactional email service enabled.");
  }
} else {
  console.warn(
    "⚠️  [Brevo Notice] BREVO_API_KEY is not set in .env. Transactional emails (OTPs, notifications) will be logged to console in development mode."
  );
}

export const brevoApiKey = initialConfig.apiKey;
export const senderEmail = initialConfig.senderEmail;
export const senderName = initialConfig.senderName;
export const isBrevoConfigured = initialConfig.isConfigured;
