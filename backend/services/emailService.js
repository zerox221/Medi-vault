import nodemailer from "nodemailer";
import { getBrevoConfig } from "../config/brevo.js";

/**
 * Base MediVault HTML Email Template Wrapper
 */
const renderEmailTemplate = ({ title, preheader, content, callToAction }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 28px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #bfdbfe; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .otp-card { background-color: #eff6ff; border: 1px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; font-family: monospace; }
    .otp-validity { font-size: 12px; color: #64748b; margin-top: 6px; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .security-notice { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e; margin-top: 20px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <h1>MediVault</h1>
      <p>Secure Medical Records Management & Sharing Platform</p>
    </div>
    <div class="body">
      ${content}
      ${
        callToAction
          ? `<div style="text-align: center;"><a href="${callToAction.url}" class="cta-btn">${callToAction.label}</a></div>`
          : ""
      }
      <div class="security-notice">
        🔒 <strong>MediVault Zero-Trust Security:</strong> We will never ask for your password or send medical files as raw attachments. Always log in directly to your verified portal.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MediVault Technologies. All medical data is protected with zero-trust cryptographic access controls.<br>
      This is an automated system notification.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send Transactional Email using Brevo REST API v3 or Brevo SMTP Relay
 */
export const sendEmail = async ({ to, subject, htmlContent }) => {
  const config = getBrevoConfig();

  if (!config.isConfigured) {
    console.log(`\n========================================================`);
    console.log(`📨 [DEV EMAIL SIMULATED] (Brevo API key not set)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================================\n`);
    return { success: true, simulated: true };
  }

  let restError = null;

  // 1. If key is Brevo REST API Key (starts with xkeysib- or general key)
  if (config.isApiKey || !config.isSmtpKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": config.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          sender: {
            name: config.senderName,
            email: config.senderEmail,
          },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📧 [Brevo REST Email Dispatched]: Message ID ${data.messageId} to ${to}`);
        return { success: true, messageId: data.messageId };
      }

      restError = await response.json();
      console.warn("⚠️ [Brevo REST API Notice]:", restError);
    } catch (err) {
      restError = err.message;
      console.warn("⚠️ [Brevo REST Fetch Note]:", err.message);
    }
  }

  // 2. Brevo SMTP Relay (Nodemailer) - Works with xsmtpsib-... SMTP Master Keys
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
      auth: {
        user: config.smtpUser || config.senderEmail,
        pass: config.apiKey,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📧 [Brevo SMTP Email Dispatched]: Message ID ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (smtpErr) {
    console.warn("⚠️ [Brevo SMTP Delivery Note]:", smtpErr.message);

    if (config.isSmtpKey) {
      console.warn(
        "👉 [Brevo Credentials Tip]: Your key starts with 'xsmtpsib-', which is an SMTP key.\n" +
          "   1. Check your Brevo 'Login' username under Settings > SMTP & API > SMTP tab. If it differs from your sender email, add BREVO_SMTP_USER=<login> to .env.\n" +
          "   2. Or generate a REST API key under Settings > SMTP & API > API Keys tab (starts with 'xkeysib-') and set BREVO_API_KEY=xkeysib-... in .env.\n" +
          "   3. Ensure your sender email is verified in Brevo under Senders, Domains & Dedicated IPs."
      );
    }
  }

  // 3. Fallback: Generic SMTP (e.g. Gmail / SendGrid / Custom)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === "true",
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await fallbackTransporter.sendMail({
        from: `"${config.senderName}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`📧 [Custom SMTP Email Dispatched]: Message ID ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (fallbackErr) {
      console.warn("⚠️ [Custom SMTP Fallback Error]:", fallbackErr.message);
    }
  }

  return {
    success: false,
    error: restError || "Email delivery failed. Please check credentials or console for details.",
  };
};

/**
 * 1. Email Verification OTP
 */
export const sendVerificationOTPEmail = async (email, name, otp) => {
  console.log(`\n========================================================`);
  console.log(`🔑 [VERIFICATION OTP FOR ${email}]: ${otp}`);
  console.log(`========================================================\n`);

  const content = `
    <h2 style="margin-top:0; color:#1e293b;">Verify Your MediVault Account</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for registering on MediVault. To activate your account and secure your medical vault, please enter the one-time verification code below:</p>
    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-validity">Code expires in 10 minutes</div>
    </div>
    <p>If you did not initiate this registration, please disregard this email.</p>
  `;

  const html = renderEmailTemplate({
    title: "Verify Your MediVault Account",
    preheader: `Your MediVault verification code is ${otp}`,
    content,
  });

  return sendEmail({
    to: email,
    subject: `MediVault Verification Code: ${otp}`,
    htmlContent: html,
  });
};

/**
 * 2. Password Reset OTP
 */
export const sendPasswordResetEmail = async (email, name, otp) => {
  console.log(`\n========================================================`);
  console.log(`🔑 [PASSWORD RESET OTP FOR ${email}]: ${otp}`);
  console.log(`========================================================\n`);

  const content = `
    <h2 style="margin-top:0; color:#1e293b;">Password Reset Request</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>We received a request to reset the password for your MediVault account. Use the secure authorization code below to complete your password reset:</p>
    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-validity">Code expires in 10 minutes</div>
    </div>
    <p>If you did not request a password reset, please secure your account immediately.</p>
  `;

  const html = renderEmailTemplate({
    title: "Reset Your MediVault Password",
    preheader: `Your MediVault password reset code is ${otp}`,
    content,
  });

  return sendEmail({
    to: email,
    subject: `MediVault Password Reset Code: ${otp}`,
    htmlContent: html,
  });
};

/**
 * 3. Doctor Verification Status Notification
 */
export const sendDoctorVerificationEmail = async (email, doctorName, isApproved, rejectionReason = "") => {
  const approved = isApproved === true || isApproved === "VERIFIED" || isApproved === "approved";
  const content = approved
    ? `
      <h2 style="margin-top:0; color:#059669;">Congratulations! Your Account is Verified</h2>
      <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
      <p>Your medical credentials and council registration have been reviewed and approved by the MediVault administration team.</p>
      <p>You can now access your doctor dashboard, scan patient sharing QR codes, and review authorized patient records.</p>
    `
    : `
      <h2 style="margin-top:0; color:#dc2626;">Verification Application Update</h2>
      <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
      <p>We were unable to verify your medical council registration with the submitted documents.</p>
      <div style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:14px; margin:16px 0; color:#991b1b;">
        <strong>Reason for status:</strong> ${rejectionReason || "Uploaded documents did not match medical council registration standards."}
      </div>
      <p>Please log in to your profile and upload updated medical certificates for expedited re-verification.</p>
    `;

  const html = renderEmailTemplate({
    title: approved ? "Doctor Account Approved" : "Doctor Verification Update",
    preheader: approved ? "Your MediVault medical profile is verified" : "Action required on your MediVault doctor profile",
    content,
    callToAction: {
      label: approved ? "Access Doctor Dashboard" : "Update Credentials",
      url: `${process.env.CLIENT_URL || "http://localhost:5173"}/doctor/login`,
    },
  });

  return sendEmail({
    to: email,
    subject: approved ? "MediVault Doctor Verification Approved" : "MediVault Doctor Verification Update",
    htmlContent: html,
  });
};

/**
 * 4. Record Access Notification
 */
export const sendRecordAccessNotification = async (patientEmail, patientName, doctorName, reportTitle) => {
  const content = `
    <h2 style="margin-top:0; color:#1e293b;">Medical Record Accessed</h2>
    <p>Hello <strong>${patientName}</strong>,</p>
    <p>This is an automated security notification to inform you that <strong>Dr. ${doctorName}</strong> has accessed your authorized medical report:</p>
    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin:16px 0;">
      📄 <strong>${reportTitle}</strong><br>
      ⏰ Accessed at: ${new Date().toLocaleString()}
    </div>
    <p>You can revoke access permissions at any time from your MediVault dashboard under <em>Share Records</em>.</p>
  `;

  const html = renderEmailTemplate({
    title: "Medical Record Access Notification",
    preheader: `Dr. ${doctorName} viewed your medical record '${reportTitle}'`,
    content,
    callToAction: {
      label: "View Access Log",
      url: `${process.env.CLIENT_URL || "http://localhost:5173"}/user/activity`,
    },
  });

  return sendEmail({
    to: patientEmail,
    subject: `MediVault Audit: Record '${reportTitle}' Accessed`,
    htmlContent: html,
  });
};

/**
 * 5. Access Request Notification (Doctor requests access to Patient's records)
 */
export const sendAccessRequestNotification = async (
  patientEmail,
  patientName,
  doctorName,
  specialization,
  accessRequestId
) => {
  console.log(`\n========================================================`);
  console.log(`📋 [ACCESS REQUEST FOR ${patientEmail}] from Dr. ${doctorName} (Request ID: ${accessRequestId})`);
  console.log(`========================================================\n`);

  const content = `
    <h2 style="margin-top:0; color:#1e293b;">Doctor Access Authorization Request</h2>
    <p>Hello <strong>${patientName}</strong>,</p>
    <p><strong>Dr. ${doctorName}</strong> (${specialization || "Doctor"}) has requested permission to access your medical records on MediVault.</p>
    <p>MediVault operates on a zero-trust model: <strong>no doctor can view your health records without your explicit approval.</strong></p>
    <p>Please log in to your patient portal to review which records are requested and approve or deny access.</p>
  `;

  const html = renderEmailTemplate({
    title: "Medical Access Request",
    preheader: `Dr. ${doctorName} requested access to your medical records`,
    content,
    callToAction: {
      label: "Review Access Request",
      url: `${process.env.CLIENT_URL || "http://localhost:5173"}/user/sharing`,
    },
  });

  return sendEmail({
    to: patientEmail,
    subject: `MediVault Action Required: Dr. ${doctorName} Requested Record Access`,
    htmlContent: html,
  });
};

/**
 * 6. Sharing Decision Email (Patient approved or rejected Doctor's request)
 */
export const sendSharingDecisionEmail = async (
  doctorEmail,
  doctorName,
  patientName,
  decision
) => {
  const isApproved = decision === "approved";
  console.log(`\n========================================================`);
  console.log(`📋 [SHARING DECISION]: ${patientName} ${decision.toUpperCase()} request for Dr. ${doctorName} (${doctorEmail})`);
  console.log(`========================================================\n`);

  const content = isApproved
    ? `
      <h2 style="margin-top:0; color:#059669;">Access Request Approved</h2>
      <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
      <p>Patient <strong>${patientName}</strong> has approved your request to view their designated medical records.</p>
      <p>You can now view these records directly from your MediVault doctor dashboard for the authorized duration.</p>
    `
    : `
      <h2 style="margin-top:0; color:#dc2626;">Access Request Declined</h2>
      <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
      <p>Patient <strong>${patientName}</strong> has declined your record access request.</p>
      <p>If you believe this was in error, please consult directly with your patient during their clinic visit.</p>
    `;

  const html = renderEmailTemplate({
    title: isApproved ? "Patient Record Access Approved" : "Patient Record Access Declined",
    preheader: isApproved
      ? `${patientName} approved your record access request`
      : `${patientName} declined your record access request`,
    content,
    callToAction: isApproved
      ? {
          label: "View Patient Records",
          url: `${process.env.CLIENT_URL || "http://localhost:5173"}/doctor/dashboard`,
        }
      : undefined,
  });

  return sendEmail({
    to: doctorEmail,
    subject: isApproved
      ? `MediVault: ${patientName} Approved Your Access Request`
      : `MediVault: Access Request Declined by ${patientName}`,
    htmlContent: html,
  });
};
