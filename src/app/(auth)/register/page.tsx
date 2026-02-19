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
import Header from "@/components/auth/header";
import Footer from "@/components/auth/footer";

export default function RegisterPage() {
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation (same as before)
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setError("Password must contain at least one special character");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#f73a00] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                AS
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Create account</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Join AmbaStore to start shopping.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">FULL NAME</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">EMAIL ADDRESS</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">PASSWORD</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
                <p className="text-xs text-gray-500">
                  Must be 8+ chars with uppercase, lowercase, number & special
                  character
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">CONFIRM PASSWORD</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">PHONE NUMBER (OPTIONAL)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+251 912 345 678"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">ADDRESS (OPTIONAL)</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Addis Ababa, Ethiopia"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                  className="rounded-xl border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
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
      </main>
      <Footer />
    </>
  );
}
