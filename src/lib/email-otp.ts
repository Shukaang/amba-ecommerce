import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_OTP_API_KEY);
const fromEmail = "AmbaStore <auth@recover.ambaastore.com>";

export async function sendOtpEmail({
  to,
  otp,
  name,
}: {
  to: string;
  otp: string;
  name: string;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #00014a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">AmbaStore</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Use the following OTP code to proceed:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; letter-spacing: 10px; font-size: 36px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          AmbaStore – Addis Ababa, Ethiopia<br />
          <a href="mailto:support@ambaastore.com" style="color: #f73a00;">support@ambaastore.com</a>
        </p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Password Reset OTP – AmbaStore",
      html,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("OTP email error:", error);
    return { success: false, error };
  }
}