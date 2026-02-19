"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribed(true);
        toast.success("Successfully subscribed!");
        setEmail("");
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-24">
        <div className="bg-gradient-to-br from-[#fa6400]/5 via-[#fa6400]/10 to-[#fa6400]/5 dark:from-[#fa6400]/10 dark:via-[#fa6400]/5 dark:to-[#fa6400]/10 rounded-3xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fa6400]/20 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-[#fa6400]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            You're All Set! 🎉
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Thank you for subscribing! Check your inbox for a special welcome
            offer.
          </p>
          <Button
            variant="outline"
            onClick={() => setSubscribed(false)}
            className="mt-4"
          >
            Subscribe Another Email
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-24">
      <div className="relative bg-gradient-to-br from-[#2d1b4d] to-[#1a1035] dark:from-[#1a1035] dark:to-[#0d0a1a] rounded-3xl p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-8">
            <Mail className="h-8 w-8 text-[#fa6400]" />
          </div>

          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h3>

          <p className="text-white/70 mb-10 text-lg">
            Get early access to new collections and exclusive offers delivered
            straight to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 pr-4 py-6 w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-[#fa6400] focus:ring-[#fa6400]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#fa6400] hover:bg-[#fa6400]/90 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-[#fa6400]/25 transition-all group"
            >
              {loading ? (
                "Subscribing..."
              ) : (
                <>
                  Subscribe
                  <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="text-white/50 text-xs mt-6">
            By subscribing, you agree to our Privacy Policy and Terms of
            Service. No spam, unsubscribe anytime.
          </p>

          <div className="flex items-center justify-center gap-6 mt-10 pt-6 border-t border-white/10">
            <span className="text-white/40 text-sm">✓ 100% Secure</span>
            <span className="text-white/40 text-sm">✓ No Spam</span>
            <span className="text-white/40 text-sm">✓ Unsubscribe Anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
