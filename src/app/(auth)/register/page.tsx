"use client";

import { RegisterForm } from "@/components/auth/register-form";
import { StoreIcon } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full mx-auto mb-4">
              <StoreIcon />
            </div>

            <h1 className="text-2xl font-bold text-purple-950">AmbaStore</h1>
          </Link>
          <p className="text-gray-600 mt-2">
            Create your account to get started
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            By registering, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
