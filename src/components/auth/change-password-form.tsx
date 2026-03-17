"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
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
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePasswordClientSchema } from "@/lib/auth/schemas";

export default function ChangePasswordForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const result = changePasswordClientSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      await refreshUser();

      toast.success("Password changed successfully");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Clear field error when user types
  const handleChange = (field: string, value: string) => {
    if (field === "current") setCurrentPassword(value);
    if (field === "new") setNewPassword(value);
    if (field === "confirm") setConfirmPassword(value);
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#f73a00]/10 flex items-center justify-center">
            <img src="/logo.png" alt="AmbaStore" />
          </div>
        </div>
        <CardTitle className="text-3xl text-gray-900 font-bold">
          Change Password
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          You can change your password once every 30 days.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current" className="text-gray-700">
              CURRENT PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="current"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => handleChange("current", e.target.value)}
                required
                className={`pr-10 border-gray-300 ${errors.currentPassword ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new" className="text-gray-700">
              NEW PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handleChange("new", e.target.value)}
                required
                className={`pr-10 border-gray-300 ${errors.newPassword ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>
            )}
            <p className="text-xs text-gray-500">
              Must be 8+ chars with uppercase, lowercase, number & special
              character
            </p>
          </div>

          <div className="space-y-2 mb-3">
            <Label htmlFor="confirm" className="text-gray-700">
              CONFIRM NEW PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleChange("confirm", e.target.value)}
                required
                className={`pr-10 border-gray-300 ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
