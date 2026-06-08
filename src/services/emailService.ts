import { Resend } from "resend";
import { env } from "../utils/env";

interface PasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export const sendPasswordResetEmail = async ({
  to,
  resetUrl
}: PasswordResetEmailInput): Promise<void> => {
  if (!resend || !env.emailFrom) {
    if (env.nodeEnv === "development") {
      console.info(`Password reset URL for ${to}: ${resetUrl}`);
    } else {
      console.warn(
        "Password reset email was not sent because Resend is not configured"
      );
    }

    return;
  }

  const { error } = await resend.emails.send({
    from: env.emailFrom,
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
