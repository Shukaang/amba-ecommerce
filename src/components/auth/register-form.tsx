"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff } from "lucide-react";
import { registerClientSchema } from "@/lib/auth/schemas";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const result = registerClientSchema.safeParse(formData);
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
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.address,
      );
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setGeneralError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="space-y-1 text-center mb-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#f73a00]/10 flex items-center justify-center">
            <img
              src={getSupabaseImage("logo.png", 160)}
              alt="AmbaStore"
              width={80}
              height={80}
            />
          </div>
        </div>
        <CardTitle className="text-3xl text-gray-900 font-bold">
          Create account
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          Join AmbaStore to start shopping.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {generalError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">
              FULL NAME
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className={
                errors.name ? "border-red-500" : "border-gray-300 text-gray-900"
              }
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              EMAIL ADDRESS
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className={
                errors.email
                  ? "border-red-500"
                  : "border-gray-300 text-gray-900"
              }
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={
                  errors.password
                    ? "border-red-500 pr-10"
                    : "border-gray-300 pr-10 text-gray-900"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700">
              CONFIRM PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={
                  errors.confirmPassword
                    ? "border-red-500 pr-10"
                    : "border-gray-300 pr-10 text-gray-900"
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Must be 8+ chars with uppercase, lowercase, number & special
              character
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-2">
          <Button
            type="submit"
            className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-xl py-6"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up to AmbaStore"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#f73a00] hover:underline font-medium"
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
