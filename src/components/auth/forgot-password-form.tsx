"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

const STORAGE_KEYS = {
  RESET_EMAIL: "resetEmail",
  COOLDOWN_END: "resendCooldownEnd",
  EXPIRY_END: "otpExpiryEnd",
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      sessionStorage.setItem(STORAGE_KEYS.RESET_EMAIL, email);

      const now = Date.now();
      const cooldownEnd = now + data.cooldownSeconds * 1000;
      const expiryEnd = now + data.expiryMinutes * 60 * 1000;

      localStorage.setItem(STORAGE_KEYS.COOLDOWN_END, cooldownEnd.toString());
      localStorage.setItem(STORAGE_KEYS.EXPIRY_END, expiryEnd.toString());

      toast.success("OTP sent successfully");
      router.push("/verify-otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#f73a00]/10 flex items-center justify-center">
            <Image
              src={getSupabaseImage("logo.png", 160)}
              alt="AmbaStore"
              width={80}
              height={80}
              unoptimized
            />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email to receive a password reset OTP.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-gray-100">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2 mb-3">
            <Label htmlFor="email" className="text-gray-700">
              EMAIL ADDRESS
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-gray-300 text-gray-900 focus:ring-[#f73a00] focus:border-[#f73a00]"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-[#f73a00] transition-colors"
        >
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
