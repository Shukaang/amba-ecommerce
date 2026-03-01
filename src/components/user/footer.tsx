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
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/supabaseClient";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showCookieDialog, setShowCookieDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false); // new state
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
    <>
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
                Redefining premium fashion with curated collections for the
                modern professional. Quality, craftsmanship, and timeless style.
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
                      className="hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={categoryHrefs.men}
                      className="hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                      Men&apos;s Collection
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={categoryHrefs.women}
                      className="hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                      Women&apos;s Collection
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={categoryHrefs.accessories}
                      className="hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                      Accessories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?featured=true"
                      className="hover:text-white transition-colors inline-flex items-center gap-2 group"
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
                Company & Legal
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
              </h6>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setShowPrivacyDialog(true)}
                    className="hover:text-white transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTermsDialog(true)}
                    className="hover:text-white transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowShippingDialog(true)}
                    className="hover:text-white transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Shipping & Returns
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowRefundDialog(true)} // replaced Link with button
                    className="hover:text-white transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Refund Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact & Newsletter - 5 columns */}
            <div className="lg:col-span-5">
              {/* Contact Info */}
              <div className="mb-4">
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
                      <div className="text-sm">+251912345678</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Email</div>
                      <div className="text-sm">support@ambaastore.com</div>
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
                  <button className="w-full px-4 py-2.5 bg-[#f73a00] hover:bg-[#f73a00]/90 rounded-lg font-medium transition-colors text-sm">
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
                <button
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowTermsDialog(true)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setShowCookieDialog(true)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
      {showPrivacyDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPrivacyDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#00014a]">
              <h2 className="text-2xl font-bold text-gray-200">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#00014a]">
              <div className="prose max-w-none">
                <p className="text-gray-400 mb-6">Effective Date: 22/2/2026</p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Information We Collect
                </h3>
                <p className="text-gray-400 mb-4">
                  We collect information you provide directly to us, such as
                  when you create an account, make a purchase, or contact us.
                  This may include your name, email address, phone number,
                  shipping address, and payment information.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  How We Use Your Information
                </h3>
                <p className="text-gray-400 mb-3">
                  We use the information we collect to:
                </p>
                <ul className="text-gray-400 mb-4 list-disc pl-6">
                  <li>Process your orders and payments</li>
                  <li>Communicate with you about your orders and account</li>
                  <li>
                    Send you promotional offers and newsletters (with your
                    consent)
                  </li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Information Sharing
                </h3>
                <p className="text-gray-400 mb-4">
                  We do not sell or rent your personal information to third
                  parties. We may share your information with trusted service
                  providers who assist us in operating our website, conducting
                  our business, or servicing you, as long as those parties agree
                  to keep this information confidential.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Data Security
                </h3>
                <p className="text-gray-400 mb-4">
                  We implement appropriate security measures to protect your
                  personal information against unauthorized access, alteration,
                  disclosure, or destruction.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Your Rights
                </h3>
                <p className="text-gray-400 mb-4">
                  You have the right to access, update, or delete your personal
                  information. To exercise these rights, please contact us at
                  support@ambaastore.com.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Changes to This Policy
                </h3>
                <p className="text-gray-400">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new policy on this
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Dialog */}
      {showTermsDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTermsDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#00014a]">
              <h2 className="text-2xl font-bold text-gray-200">
                Terms of Service
              </h2>
              <button
                onClick={() => setShowTermsDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#00014a]">
              <div className="prose max-w-none">
                <p className="text-gray-400 mb-6">Effective Date: 22/2/2026</p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Acceptance of Terms
                </h3>
                <p className="text-gray-400 mb-4">
                  By accessing and using AmbaStore services, you accept and
                  agree to be bound by these Terms of Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Use of Our Services
                </h3>
                <p className="text-gray-400 mb-4">
                  You may use our services only for lawful purposes and in
                  accordance with these Terms. You agree not to use our services
                  in any way that could damage, disable, overburden, or impair
                  our website.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Account Responsibilities
                </h3>
                <p className="text-gray-400 mb-4">
                  If you create an account, you are responsible for maintaining
                  the security of your account and for all activities that occur
                  under the account. You must notify us immediately of any
                  unauthorized use.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Orders and Payments
                </h3>
                <p className="text-gray-400 mb-4">
                  By placing an order, you agree to pay the specified price for
                  the products. We reserve the right to refuse or cancel any
                  order for any reason, including but not limited to product
                  availability, errors in pricing, or suspected fraud.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Shipping and Returns
                </h3>
                <p className="text-gray-400 mb-4">
                  Our shipping and return policies are outlined separately and
                  are incorporated by reference into these Terms.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Intellectual Property
                </h3>
                <p className="text-gray-400 mb-4">
                  All content on this website, including text, graphics, logos,
                  and images, is the property of AmbaStore and is protected by
                  copyright laws.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Limitation of Liability
                </h3>
                <p className="text-gray-400 mb-4">
                  To the fullest extent permitted by law, AmbaStore shall not be
                  liable for any indirect, incidental, special, or consequential
                  damages arising out of or in connection with your use of our
                  services.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Governing Law
                </h3>
                <p className="text-gray-400">
                  These Terms shall be governed by the laws of the Federal
                  Democratic Republic of Ethiopia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Policy Dialog */}
      {showCookieDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCookieDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-[#00014a]">
              <h2 className="text-2xl font-bold text-gray-200">
                Cookie Policy
              </h2>
              <button
                onClick={() => setShowCookieDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 bg-[#00014a] overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <p className="text-gray-400 mb-6">Effective Date: 22/2/2026</p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  What Are Cookies
                </h3>
                <p className="text-gray-400 mb-4">
                  Cookies are small text files that are placed on your computer
                  or mobile device when you visit a website. They are widely
                  used to make websites work more efficiently and provide
                  information to the site owners.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  How We Use Cookies
                </h3>
                <p className="text-gray-400 mb-4">
                  We use cookies for the following purposes:
                </p>
                <ul className="text-gray-400 mb-4 list-disc pl-6">
                  <li>
                    Essential cookies: Necessary for the website to function
                    properly
                  </li>
                  <li>
                    Performance cookies: Help us understand how visitors
                    interact with our website
                  </li>
                  <li>
                    Functional cookies: Remember your preferences and settings
                  </li>
                  <li>
                    Marketing cookies: Used to deliver relevant advertisements
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Managing Cookies
                </h3>
                <p className="text-gray-400 mb-4">
                  Most web browsers allow you to control cookies through their
                  settings. You can choose to block or delete cookies, but this
                  may affect your experience on our website.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Changes to This Policy
                </h3>
                <p className="text-gray-400">
                  We may update this Cookie Policy from time to time. Any
                  changes will be posted on this page.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Contact Us
                </h3>
                <p className="text-gray-400">
                  If you have any questions about our use of cookies, please
                  contact us at support@ambaastore.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping & Returns Dialog */}
      {showShippingDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShippingDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#00014a]">
              <h2 className="text-2xl font-bold text-gray-200">
                Shipping & Returns
              </h2>
              <button
                onClick={() => setShowShippingDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#00014a]">
              <div className="prose max-w-none">
                <p className="text-gray-400 mb-6">Effective Date: 22/2/2026</p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Shipping Information
                </h3>
                <p className="text-gray-400 mb-4">
                  We offer shipping within Ethiopia and internationally. Orders
                  are processed within 1-2 business days after payment
                  confirmation. Delivery times vary based on your location.
                </p>
                <ul className="text-gray-400 mb-4 list-disc pl-6">
                  <li>
                    <span className="font-medium text-gray-300">
                      Addis Ababa:
                    </span>{" "}
                    1-3 business days (Free)
                  </li>
                  <li>
                    <span className="font-medium text-gray-300">
                      Other Ethiopian cities:
                    </span>{" "}
                    3-7 business days (Fixed fee)
                  </li>
                  <li>
                    <span className="font-medium text-gray-300">
                      International:
                    </span>{" "}
                    7-21 business days (calculated at checkout)
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Return Policy
                </h3>
                <p className="text-gray-400 mb-4">
                  We want you to be completely satisfied with your purchase. If
                  for any reason you are not, you may return unworn, unwashed
                  items within 30 days of delivery for a full refund or
                  exchange.
                </p>
                <p className="text-gray-400 mb-4">
                  To initiate a return, please contact our customer support with
                  your order number and reason for return. Return shipping costs
                  are the responsibility of the customer unless the item is
                  defective or we made an error.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Refund Process
                </h3>
                <p className="text-gray-400 mb-4">
                  Once we receive and inspect your return, we will notify you of
                  the approval or rejection of your refund. Approved refunds
                  will be processed within 5-7 business days to your original
                  payment method.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Exchanges
                </h3>
                <p className="text-gray-400 mb-4">
                  If you need to exchange an item for a different size or color,
                  please return the original item and place a new order. This
                  ensures the fastest processing.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Contact Us
                </h3>
                <p className="text-gray-400">
                  For any shipping or return questions, email us at
                  support@ambaastore.com or call +251912345678.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Policy Dialog */}
      {showRefundDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowRefundDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#00014a]">
              <h2 className="text-2xl font-bold text-gray-200">
                Refund Policy
              </h2>
              <button
                onClick={() => setShowRefundDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#00014a]">
              <div className="prose max-w-none">
                <p className="text-gray-400 mb-6">Effective Date: 22/2/2026</p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Refund Eligibility
                </h3>
                <p className="text-gray-400 mb-4">
                  To be eligible for a refund, items must be returned within 30
                  days of delivery, in their original condition (unworn,
                  unwashed, with all tags attached). Items marked as final sale
                  are not eligible for refund.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  How to Request a Refund
                </h3>
                <p className="text-gray-400 mb-4">
                  To request a refund, please email support@ambaastore.com with
                  your order number, the items you wish to return, and the
                  reason for return. We will provide you with return
                  instructions.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Refund Processing Time
                </h3>
                <p className="text-gray-400 mb-4">
                  Once we receive and inspect your return, we will notify you of
                  the approval. If approved, your refund will be processed
                  within 5-7 business days to your original payment method.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Partial Refunds
                </h3>
                <p className="text-gray-400 mb-4">
                  In some cases, only partial refunds are granted (if
                  applicable):
                </p>
                <ul className="text-gray-400 mb-4 list-disc pl-6">
                  <li>Items with obvious signs of use</li>
                  <li>Any item not in its original condition</li>
                  <li>Any item returned more than 30 days after delivery</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Late or Missing Refunds
                </h3>
                <p className="text-gray-400 mb-4">
                  If you haven't received a refund after the stated time, first
                  check your bank account. Then contact your credit card
                  company. If it's still not resolved, contact us at
                  support@ambaastore.com.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Sale Items
                </h3>
                <p className="text-gray-400 mb-4">
                  Only regular‑priced items may be refunded. Sale items are
                  non‑refundable unless otherwise stated.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Exchanges
                </h3>
                <p className="text-gray-400 mb-4">
                  We only replace items if they are defective or damaged. If you
                  need to exchange it for the same item, contact us at
                  support@ambaastore.com.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Shipping Costs
                </h3>
                <p className="text-gray-400">
                  Return shipping costs are the responsibility of the customer
                  unless the return is due to our error (e.g., wrong item
                  shipped) or the item is defective.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
