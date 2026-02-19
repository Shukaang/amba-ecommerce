"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      // Pass the complete updated user data including timestamps
      updateUser({
        ...user,
        ...data.user,
        phone: formData.phone,
        address: formData.address,
        updated_at: new Date().toISOString(),
      });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <Card className="lg:col-span-2 bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Personal Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-white border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00] text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled
                      className="bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+251 912 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-white border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00] text-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700">
                    Shipping Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Addis Ababa, Ethiopia"
                    value={formData.address}
                    onChange={handleChange}
                    className="bg-white border-gray-300 focus:ring-[#f73a00] focus:border-[#f73a00] text-gray-700"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Account Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Account
                </Label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === "SUPERADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Account Status
                </Label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : user.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Member Since
                </Label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Last Updated
                </Label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 text-gray-700"
                  asChild
                >
                  <a href="/change-password">Change Password</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
