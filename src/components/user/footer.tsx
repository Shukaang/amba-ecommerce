"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Diamond,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/supabaseClient";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [categoryHrefs, setCategoryHrefs] = useState({
    men: "/products",
    women: "/products",
    accessories: "/products",
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchCategoryIds = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("categories")
          .select("id, title")
          .limit(20);

        if (data) {
          const findId = (keyword: string) => {
            const cat = data.find((c) =>
              c.title.toLowerCase().includes(keyword),
            );
            return cat ? `/products?category=${cat.id}` : "/products";
          };

          setCategoryHrefs({
            men: findId("men"),
            women: findId("women"),
            accessories: findId("accessories"),
          });
        }
      } catch (error) {
        console.error("Error fetching category IDs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryIds();
  }, []);

  if (["/login", "/register"].includes(pathname)) return null;
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#00014a] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-16">
          {/* Brand - 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-8">
              <div className="relative">
                <Diamond className="h-8 w-8 text-[#f73a00]" />
              </div>
              <h2 className="text-2xl text-[#f73a00] font-extrabold tracking-tight">
                AmbaStore
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Redefining premium fashion with curated collections for the modern
              professional. Quality, craftsmanship, and timeless style.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop - 2 columns */}
          <div className="lg:col-span-2">
            <h6 className="font-bold text-lg mb-6 relative inline-block">
              Shop
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
            </h6>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-4 w-24 bg-white/10 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link
                    href="/products?new=true"
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.men}
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Men&apos;s Collection
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.women}
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Women&apos;s Collection
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.accessories}
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Accessories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products?featured=true"
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Best Sellers
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Company - 2 columns */}
          <div className="lg:col-span-2">
            <h6 className="font-bold text-lg mb-6 relative inline-block">
              Company
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
            </h6>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  className="hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                  Sustainability
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                  Journal
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/press"
                  className="hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter - 5 columns */}
          <div className="lg:col-span-5">
            {/* Contact Info */}
            <div className="mb-8">
              <h6 className="font-bold text-lg mb-6 relative inline-block">
                Support
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
              </h6>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-white">
                      Customer Support
                    </div>
                    <div className="text-sm">+251991868812</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <div className="text-sm">support@amba-store.com</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-white">Visit Us</div>
                    <div className="text-sm">Bole, Addis Ababa, Ethiopia</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-white font-medium mb-2">Newsletter</p>
              <p className="text-sm text-gray-400 mb-3">
                Subscribe to our newsletter for the latest fashion updates.
              </p>
              <form className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#f73a00] text-sm"
                  aria-label="Email for newsletter"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-[#f73a00] hover:bg-[#f73a00]/90 rounded-lg font-medium transition-colors text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm order-2 md:order-1">
              © {currentYear} AmbaStore Inc. All rights reserved.
            </p>
            <div className="flex gap-6 order-1 md:order-2">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
