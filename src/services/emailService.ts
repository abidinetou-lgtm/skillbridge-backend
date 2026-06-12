import { Resend } from "resend";
import { env } from "../utils/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

interface PasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async ({
  to,
  resetUrl
}: PasswordResetEmailInput): Promise<void> => {
  if (env.nodeEnv !== "production") {
    console.log(`Password reset URL for ${to}: ${resetUrl}`);
  }

  if (!resend) {
    if (env.nodeEnv === "production") {
      throw new Error("RESEND_API_KEY is required to send password reset emails");
    }
    return;
  }

  const { error } = await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: "Reset your SkillBridge password",
    text: [
      "A password reset was requested for your SkillBridge account.",
      "",
      `Reset your password: ${resetUrl}`,
      "",
      "This link expires in one hour. If you did not request it, you can ignore this email."
    ].join("\n")
  });

  if (error) {
    throw new Error(`Resend failed to send password reset email: ${error.message}`);
  }
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const buildVerificationUrl = (token: string): string => {
  const baseUrl = env.appUrl.replace(/\/$/, "");
  return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
};

export const sendVerificationEmail = async (input: {
  to: string;
  firstName: string;
  verificationUrl: string;
  expiresInHours: number;
}): Promise<void> => {
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

  if (env.nodeEnv !== "production") {
    console.log(`Email verification URL for ${input.to}: ${input.verificationUrl}`);
  }

  if (!resend) {
    if (env.nodeEnv === "production") {
      throw new Error("RESEND_API_KEY is required to send verification emails");
    }

    return;
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to: input.to,
    subject,
    html,
    text
  });
};
