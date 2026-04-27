"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema } from "@/lib/auth/schemas";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      setGeneralError(
        err.message || "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="space-y-1 text-center mb-4">
        <div className="flex justify-center">
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
        <CardTitle className="text-3xl text-gray-900 font-bold">
          Welcome back
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          Access the world's finest fashion collections.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {generalError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-gray-900">
            <Label htmlFor="email" className="text-gray-700">
              EMAIL ADDRESS
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-red-500" : "border-gray-300"}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-700">
                PASSWORD
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-[#f73a00] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative text-gray-900 mb-3">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={
                  errors.password
                    ? "border-red-500 pr-10"
                    : "border-gray-300 pr-10"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to AmbaStore"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-[#f73a00] hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
            <p className="text-gray-600">Loading form...</p>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
