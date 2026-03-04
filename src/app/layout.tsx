import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import PageTracker from "@/components/tracking/page-tracker";
import UserHeader from "@/components/user/users-header";
import Footer from "@/components/user/footer";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AmbaStore - Premium E-commerce",
  description: "Your one-stop shop for premium products",
};

// Simple loading component for footer
function FooterSkeleton() {
  return (
    <footer className="bg-[#00014a] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse"></div>
      </div>
    </footer>
  );
}

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
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <PageTracker />
              <div className="w-full min-h-screen flex flex-col">
                <UserHeader />
                <main className="flex-1">{children}</main>
                <Suspense fallback={<FooterSkeleton />}>
                  <Footer />
                </Suspense>
              </div>
              <Toaster position="top-right" />
              <div id="cart-animation-element" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
