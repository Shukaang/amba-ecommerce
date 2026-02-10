"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.name || user.email}</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.role === "CUSTOMER" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Browse Products</CardTitle>
                  <CardDescription>View our product catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/products">
                    <Button className="w-full">Go to Products</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>View your order history</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/orders">
                    <Button className="w-full">View Orders</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "ADMIN" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Manage Products</CardTitle>
                  <CardDescription>
                    Add, edit, or delete products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/products">
                    <Button className="w-full">Manage Products</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Orders</CardTitle>
                  <CardDescription>
                    View and update order statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/orders">
                    <Button className="w-full">Manage Orders</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>
                    View and manage user accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/users">
                    <Button className="w-full">Manage Users</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
