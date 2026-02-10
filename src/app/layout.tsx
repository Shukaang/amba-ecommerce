import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import UserHeader from "@/components/user/users-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AmbaStore - Premium E-commerce",
  description: "Your one-stop shop for premium products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col">
                <UserHeader />
                <main className="flex-1">{children}</main>
                {/* You might want to add a footer here later */}
              </div>
              <Toaster position="top-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
