// app/not-found.tsx (Simpler version)
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#f73a00]/30">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button
            asChild
            className="flex bg-[#f73a00] text-white items-center gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4 underline">Need help?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="text-sm text-[#f73a00] hover:text-[#f73a00]/90 hover:underline"
            >
              Browse Products
            </Link>
            <Link
              href="/"
              className="text-sm text-[#f73a00] hover:text-[#f73a00]/90 hover:underline"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
