import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/reset-password";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password for your account",
};

function LoadingSpinner() {
  return (
    <div className="text-center py-10">
      <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
      <p className="text-gray-600">Loading reset password...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
