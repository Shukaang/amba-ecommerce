import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import ChangePasswordForm from "@/components/auth/change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Update your account password",
};

export default async function ChangePasswordPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login?redirectTo=/change-password");
  }

  const user = verifyToken(token);
  if (!user) {
    redirect("/login?redirectTo=/change-password");
  }

  return <ChangePasswordForm />;
}
