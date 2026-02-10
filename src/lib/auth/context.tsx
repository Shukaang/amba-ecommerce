"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: "SUPERADMIN" | "ADMIN" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string,
    address?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // In the checkAuth function in AuthProvider:
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");

      if (res.ok) {
        const data = await res.json();

        // REMOVE THIS LINE:
        // console.log("Auth check success:", data.user);

        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || "",
          phone: data.user.phone || "",
          address: data.user.address || "",
          role: data.user.role || "CUSTOMER",
          status: data.user.status || "ACTIVE",
          created_at: data.user.created_at,
          updated_at: data.user.updated_at,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", { status: res.status, data });

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // After login, fetch the complete user profile
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log("Complete user data after login:", userData.user);

        // Set user with all fields
        setUser({
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          phone: userData.user.phone || "",
          address: userData.user.address || "",
          role: userData.user.role,
          status: userData.user.status,
          created_at: userData.user.created_at,
          updated_at: userData.user.updated_at,
        });
      } else {
        // Fallback to login response data
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          phone: "",
          address: "",
          role: data.user.role,
          status: "ACTIVE", // Default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      toast.success("Login successful!");

      // Redirect based on role
      if (data.user.role === "CUSTOMER") {
        router.push("/");
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        error.message || "Login failed. Please check your credentials.",
      );
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    address?: string,
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // After registration, fetch the complete user profile
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();

        setUser({
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          phone: userData.user.phone || "",
          address: userData.user.address || "",
          role: userData.user.role,
          status: userData.user.status,
          created_at: userData.user.created_at,
          updated_at: userData.user.updated_at,
        });
      }

      toast.success("Registration successful!");

      // Force redirect and refresh
      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
