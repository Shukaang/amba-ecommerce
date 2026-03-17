import { Metadata } from "next";
import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join AmbaStore to start shopping",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
