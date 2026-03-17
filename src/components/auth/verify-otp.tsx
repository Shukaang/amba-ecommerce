"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const RESEND_COOLDOWN = 90; // seconds
const OTP_EXPIRY_MINUTES = 10; // 10 minutes

const STORAGE_KEYS = {
  RESET_EMAIL: "resetEmail",
  RESET_TOKEN: "resetToken",
  COOLDOWN_END: "resendCooldownEnd",
  EXPIRY_END: "otpExpiryEnd",
};

export default function VerifyOtpForm() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_MINUTES * 60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load email and timestamps from storage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem(STORAGE_KEYS.RESET_EMAIL);
    if (!storedEmail) {
      router.push("/forgot-password");
      return;
    }
    setEmail(storedEmail);

    const cooldownEndStr = localStorage.getItem(STORAGE_KEYS.COOLDOWN_END);
    if (cooldownEndStr) {
      const cooldownEnd = parseInt(cooldownEndStr, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((cooldownEnd - now) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        localStorage.removeItem(STORAGE_KEYS.COOLDOWN_END);
      }
    } else {
      setCooldownSeconds(0);
    }

    const expiryEndStr = localStorage.getItem(STORAGE_KEYS.EXPIRY_END);
    if (expiryEndStr) {
      const expiryEnd = parseInt(expiryEndStr, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryEnd - now) / 1000));
      setExpirySeconds(remaining);
      if (remaining === 0) {
        localStorage.removeItem(STORAGE_KEYS.EXPIRY_END);
        setError("OTP has expired. Please request a new one.");
      }
    } else {
      router.push("/forgot-password");
    }
  }, [router]);

  // Countdown timer for cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => {
        const newSeconds = cooldownSeconds - 1;
        setCooldownSeconds(newSeconds);
        if (newSeconds === 0) {
          localStorage.removeItem(STORAGE_KEYS.COOLDOWN_END);
        } else {
          const cooldownEnd = Date.now() + newSeconds * 1000;
          localStorage.setItem(
            STORAGE_KEYS.COOLDOWN_END,
            cooldownEnd.toString(),
          );
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expirySeconds > 0) {
      timer = setTimeout(() => {
        const newSeconds = expirySeconds - 1;
        setExpirySeconds(newSeconds);
        if (newSeconds === 0) {
          localStorage.removeItem(STORAGE_KEYS.EXPIRY_END);
          setError("OTP has expired. Please request a new one.");
        } else {
          const expiryEnd = Date.now() + newSeconds * 1000;
          localStorage.setItem(STORAGE_KEYS.EXPIRY_END, expiryEnd.toString());
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [expirySeconds]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char.replace(/\D/g, "");
      });
      setOtp(newOtp);
      const lastIndex = Math.min(pasted.length - 1, 5);
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex]?.focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      localStorage.removeItem(STORAGE_KEYS.COOLDOWN_END);
      localStorage.removeItem(STORAGE_KEYS.EXPIRY_END);
      sessionStorage.setItem(STORAGE_KEYS.RESET_TOKEN, data.token);
      router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || !email) return;

    setResendLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      const cooldownEnd = Date.now() + RESEND_COOLDOWN * 1000;
      const expiryEnd = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

      localStorage.setItem(STORAGE_KEYS.COOLDOWN_END, cooldownEnd.toString());
      localStorage.setItem(STORAGE_KEYS.EXPIRY_END, expiryEnd.toString());

      setCooldownSeconds(RESEND_COOLDOWN);
      setExpirySeconds(OTP_EXPIRY_MINUTES * 60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success("OTP resent successfully");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  const isExpired = expirySeconds <= 0;

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#f73a00]/10 flex items-center justify-center">
            <img src="/logo.png" alt="AmbaStore" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">
          Verify OTP
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter the 6-digit code sent to {email}
        </CardDescription>
        {!isExpired && (
          <p className="text-sm text-gray-500 mt-2">
            Code expires in{" "}
            <span className="font-mono font-medium text-[#f73a00]">
              {formatTime(expirySeconds)}
            </span>
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-gray-700">OTP CODE</Label>
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className="w-12 h-12 text-center text-lg font-bold text-gray-900 bg-white border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                  disabled={loading || isExpired}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
            disabled={loading || isExpired}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldownSeconds > 0 || resendLoading}
              className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                cooldownSeconds > 0 || resendLoading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                  : "bg-gray-100 text-[#f73a00] hover:bg-gray-200"
              }`}
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
            {cooldownSeconds > 0 && (
              <span className="font-mono text-sm font-medium text-[#f73a00] min-w-[3rem]">
                {cooldownSeconds}s
              </span>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Link
          href="/forgot-password"
          className="text-sm text-gray-600 hover:text-[#f73a00] transition-colors"
        >
          ← Back
        </Link>
      </CardFooter>
    </Card>
  );
}
