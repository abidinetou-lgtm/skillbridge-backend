"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.buildVerificationUrl = void 0;
const resend_1 = require("resend");
const env_1 = require("../utils/env");
const resend = env_1.env.resendApiKey ? new resend_1.Resend(env_1.env.resendApiKey) : null;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const buildVerificationUrl = (token) => {
    const baseUrl = env_1.env.appUrl.replace(/\/$/, "");
    return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
};
exports.buildVerificationUrl = buildVerificationUrl;
const sendVerificationEmail = async (input) => {
    const safeFirstName = escapeHtml(input.firstName);
    const safeVerificationUrl = escapeHtml(input.verificationUrl);
    const subject = "Verify your SkillBridge email address";
    const text = [
        `Hi ${input.firstName},`,
        "",
        "Welcome to SkillBridge. Verify your email address to activate your account:",
        input.verificationUrl,
        "",
        `This verification link expires in ${input.expiresInHours} hours.`,
        "",
        "If you did not create a SkillBridge account, you can ignore this email."
    ].join("\n");
    const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h1 style="color: #2563eb;">SkillBridge</h1>
      <p>Hi ${safeFirstName},</p>
      <p>Welcome to SkillBridge. Verify your email address to activate your account.</p>
      <p>
        <a href="${safeVerificationUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 6px;">
          Verify email address
        </a>
      </p>
      <p>This verification link expires in ${input.expiresInHours} hours.</p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${safeVerificationUrl}">${safeVerificationUrl}</a></p>
      <p>If you did not create a SkillBridge account, you can ignore this email.</p>
    </div>
  `;
    if (env_1.env.nodeEnv !== "production") {
        console.log(`Email verification URL for ${input.to}: ${input.verificationUrl}`);
    }
    if (!resend) {
        if (env_1.env.nodeEnv === "production") {
            throw new Error("RESEND_API_KEY is required to send verification emails");
        }
        return;
    }
    await resend.emails.send({
        from: env_1.env.resendFromEmail,
        to: input.to,
        subject,
        html,
        text
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
//# sourceMappingURL=emailService.js.map