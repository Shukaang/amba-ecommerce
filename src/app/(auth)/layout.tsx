import Header from "@/components/auth/header";
import Footer from "@/components/auth/footer";

export const metadata = {
  title: {
    template: "%s | AmbaStore",
    default: "Authentication | AmbaStore",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        {children}
      </main>
      <Footer />
    </>
  );
}
