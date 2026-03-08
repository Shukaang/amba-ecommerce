import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Header from "@/components/auth/header";
import Footer from "@/components/auth/footer";
import ResetPasswordForm from "./ResetPasswordForm";

// Simple loading component
function LoadingSpinner() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
        <p className="text-gray-600">Loading reset password...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<LoadingSpinner />}>
        <ResetPasswordForm />
      </Suspense>
      <Footer />
    </>
  );
}
