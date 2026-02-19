import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import UserHeader from "@/components/user/users-header";
import PageTracker from "@/components/tracking/page-tracker";
import Footer from "@/components/user/footer";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AmbaStore - Premium E-commerce",
  description: "Your one-stop shop for premium products",
};

// Simple loading component for header
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
            <div className="flex w-full h-10 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
}

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
                <Suspense fallback={<HeaderSkeleton />}>
                  <UserHeader />
                </Suspense>
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
