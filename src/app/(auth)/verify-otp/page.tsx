import { Metadata } from "next";
import VerifyOtpForm from "@/components/auth/verify-otp";

export const metadata: Metadata = {
  title: "Verify OTP",
  description: "Enter the verification code sent to your email",
};

export default function VerifyOtpPage() {
  return <VerifyOtpForm />;
}
