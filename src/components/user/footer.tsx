// components/user/footer.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";

interface FooterProps {
  categories: { id: string; title: string }[];
}

export default function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Compute category links from the passed categories
  const findCategoryId = (keyword: string) => {
    const cat = categories.find((c) => c.title.toLowerCase().includes(keyword));
    return cat ? `/products?category=${cat.id}` : "/products";
  };

  const categoryHrefs = {
    men: findCategoryId("men"),
    women: findCategoryId("women"),
    electronics: findCategoryId("electronics"),
  };

  // Dialog states
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showCookieDialog, setShowCookieDialog] = useState(false);
  const [showShippingRefundDialog, setShowShippingRefundDialog] =
    useState(false); // combined

  // Hide footer on auth pages and admin routes
  if (
    [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-otp",
      "/reset-password",
      "/change-password",
    ].includes(pathname) ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <>
      <footer className="bg-[#ffe9ad] text-slate-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-16">
            {/* Brand - 3 columns */}
            <div className="lg:col-span-3">
              <Link href="/">
                <div className="flex items-center gap-0 mb-8 transition-colors group">
                  <div className="relative h-10 w-10">
                    <ShoppingBag className="h-8 w-8 text-[#f73a00]" />
                  </div>
                  <h2 className="text-2xl relative text-[#f73a00] font-extrabold tracking-tight">
                    AmbaStore
                    <span className="absolute -bottom-2 left-0 w-0 group-hover:w-16 h-0.5 bg-[#f73a00] transition-all duration-500"></span>
                  </h2>
                </div>
              </Link>
              <p className="text-slate-800 leading-relaxed mb-6">
                Redefining premium fashion with curated collections for the
                modern professional. Quality, craftsmanship, and timeless style.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-[#f73a00]/10 transition-all hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-[#f73a00]/10 transition-all hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-[#f73a00]/10 transition-all hover:scale-110"
                  aria-label="Twitter"
                >
                  <Send className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Shop - 3 columns (was 2) */}
            <div className="lg:col-span-3">
              <h6 className="font-bold text-lg mb-6 relative inline-block">
                Shop
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
              </h6>
              <ul className="space-y-3 text-slate-800">
                <li>
                  <Link
                    href="/products?new=true"
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.men}
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Men&apos;s Collection
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.women}
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Women&apos;s Collection
                  </Link>
                </li>
                <li>
                  <Link
                    href={categoryHrefs.electronics}
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Electronics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products?featured=true"
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Best Sellers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal - 3 columns (was 2) */}
            <div className="lg:col-span-3">
              <h6 className="font-bold text-lg mb-6 relative inline-block">
                Legal
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
              </h6>
              <ul className="space-y-3 text-slate-800">
                <li>
                  <button
                    onClick={() => setShowTermsDialog(true)}
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowShippingRefundDialog(true)}
                    className="hover:text-slate-900 transition-colors inline-flex items-center gap-2 group text-left w-full"
                  >
                    <span className="w-0 h-0.5 bg-[#f73a00] group-hover:w-2 transition-all"></span>
                    Shipping & Refund
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact & Newsletter - 3 columns (was 5) */}
            <div className="lg:col-span-3">
              {/* Contact Info */}
              <div className="mb-4">
                <h6 className="font-bold text-lg mb-6 relative inline-block">
                  Support
                  <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#f73a00]"></span>
                </h6>
                <ul className="space-y-4 text-slate-800">
                  <li className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">
                        Customer Support
                      </div>
                      <Link href="tel:+251975931671">
                        <div className="text-sm">+251 975 931 671</div>
                      </Link>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#f73a00] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">Email</div>
                      <Link href="mailto:support@ambaastore.com"></Link>
                      <div className="text-sm">support@ambaastore.com</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-800 text-sm order-2 md:order-1">
                © {currentYear} AmbaStore Inc. All rights reserved.
              </p>
              <div className="flex gap-6 order-1 md:order-2">
                <button
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-slate-800 hover:text-slate-900 transition-colors text-sm"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowTermsDialog(true)}
                  className="text-slate-800 hover:text-slate-900 transition-colors text-sm"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setShowCookieDialog(true)}
                  className="text-slate-800 hover:text-slate-900 transition-colors text-sm"
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
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPrivacyDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#ffe9ad]">
              <h2 className="text-2xl font-bold text-slate-900">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyDialog(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#ffe9ad]">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Information We Collect
                </h3>
                <p className="text-gray-700 mb-4">
                  We collect information you provide directly to us, such as
                  when you create an account, make a purchase, or contact us.
                  This may include your name, email address, phone number,
                  shipping address, and payment information.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How We Use Your Information
                </h3>
                <p className="text-gray-700 mb-3">
                  We use the information we collect to:
                </p>
                <ul className="text-gray-600 mb-4 list-disc pl-6">
                  <li>Process your orders and payments</li>
                  <li>Communicate with you about your orders and account</li>
                  <li>
                    Send you promotional offers and newsletters (with your
                    consent)
                  </li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Information Sharing
                </h3>
                <p className="text-gray-700 mb-4">
                  We do not sell or rent your personal information to third
                  parties. We may share your information with trusted service
                  providers who assist us in operating our website, conducting
                  our business, or servicing you, as long as those parties agree
                  to keep this information confidential.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Data Security
                </h3>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your
                  personal information against unauthorized access, alteration,
                  disclosure, or destruction.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Rights
                </h3>
                <p className="text-gray-700 mb-4">
                  You have the right to access, update, or delete your personal
                  information. To exercise these rights, please contact us at
                  support@ambaastore.com.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Changes to This Policy
                </h3>
                <p className="text-gray-700">
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
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTermsDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-slate-400"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#ffe9ad]">
              <h2 className="text-2xl font-bold text-slate-900">
                Terms of Service
              </h2>
              <button
                onClick={() => setShowTermsDialog(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#ffe9ad]">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acceptance of Terms
                </h3>
                <p className="text-gray-700 mb-4">
                  By accessing and using AmbaStore services, you accept and
                  agree to be bound by these Terms of Service.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Use of Our Services
                </h3>
                <p className="text-gray-700 mb-4">
                  You may use our services only for lawful purposes and in
                  accordance with these Terms. You agree not to use our services
                  in any way that could damage, disable, overburden, or impair
                  our website.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Responsibilities
                </h3>
                <p className="text-gray-700 mb-4">
                  If you create an account, you are responsible for maintaining
                  the security of your account and for all activities that occur
                  under the account. You must notify us immediately of any
                  unauthorized use.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Orders and Payments
                </h3>
                <p className="text-gray-700 mb-4">
                  By placing an order, you agree to pay the specified price for
                  the products. We reserve the right to refuse or cancel any
                  order for any reason, including but not limited to product
                  availability, errors in pricing, or suspected fraud.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping and Returns
                </h3>
                <p className="text-gray-700 mb-4">
                  Our shipping and return policies are outlined separately and
                  are incorporated by reference into these Terms.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Intellectual Property
                </h3>
                <p className="text-gray-700 mb-4">
                  All content on this website, including text, graphics, logos,
                  and images, is the property of AmbaStore and is protected by
                  copyright laws.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Limitation of Liability
                </h3>
                <p className="text-gray-700 mb-4">
                  To the fullest extent permitted by law, AmbaStore shall not be
                  liable for any indirect, incidental, special, or consequential
                  damages arising out of or in connection with your use of our
                  services.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Governing Law
                </h3>
                <p className="text-gray-700">
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
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCookieDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-[#ffe9ad]">
              <h2 className="text-2xl font-bold text-slate-900">
                Cookie Policy
              </h2>
              <button
                onClick={() => setShowCookieDialog(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 bg-[#ffe9ad] overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What Are Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are placed on your computer
                  or mobile device when you visit a website. They are widely
                  used to make websites work more efficiently and provide
                  information to the site owners.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How We Use Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  We use cookies for the following purposes:
                </p>
                <ul className="text-gray-600 mb-4 list-disc pl-6">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Managing Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  Most web browsers allow you to control cookies through their
                  settings. You can choose to block or delete cookies, but this
                  may affect your experience on our website.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Changes to This Policy
                </h3>
                <p className="text-gray-700">
                  We may update this Cookie Policy from time to time. Any
                  changes will be posted on this page.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Us
                </h3>
                <p className="text-gray-700">
                  If you have any questions about our use of cookies, please
                  contact us at support@ambaastore.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Shipping & Refund Dialog */}
      {showShippingRefundDialog && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShippingRefundDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-[#ffe9ad]">
              <h2 className="text-2xl font-bold text-slate-900">
                Shipping & Refund
              </h2>
              <button
                onClick={() => setShowShippingRefundDialog(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#ffe9ad]">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping Information
                </h3>
                <p className="text-gray-700 mb-4">
                  We offer shipping throughout Ethiopia. All orders are
                  processed within 1–2 business days following payment
                  confirmation. Please note that delivery times may vary based
                  on your specific location.
                </p>
                <ul className="text-gray-600 mb-4 list-disc pl-6">
                  <li>
                    <span className="font-medium text-gray-600">
                      Addis Ababa:
                    </span>{" "}
                    15-21 days (Free)
                  </li>
                  <li>
                    <span className="font-medium text-gray-600">
                      Other Ethiopian cities:
                    </span>{" "}
                    21-25 days (Fixed fee)
                  </li>
                </ul>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Return Policy
                </h3>
                <p className="text-gray-700 mb-4">
                  We want you to be completely satisfied with your purchase. If
                  there is any issue with your order, please report it to us
                  with a valid reason within 3–6 hours of delivery. You can
                  reach us via Telegram or Email for a quick resolution.
                </p>
                <p className="text-gray-700 mb-4">
                  To initiate a return, please contact our customer support team
                  with your order number and the reason for your request. Please
                  note that return shipping costs are the responsibility of the
                  customer, except in cases where the item is defective or an
                  error was made on our store.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Refund Process
                </h3>
                <p className="text-gray-700 mb-4">
                  Once your request has been approved by our customer support
                  team, the product must be returned within 24 hours. Please
                  ensure the item is sent back promptly to complete the process.
                </p>
                <p className="text-gray-700 mb-4">
                  Once we receive and inspect your return, we will notify you of
                  the approval or rejection of your refund. Approved refunds
                  will be processed within 3-5 business days to your original
                  payment method.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Exchanges
                </h3>
                <p className="text-gray-700 mb-4">
                  If you need to exchange an item for a different size or color,
                  please return the original item and place a new order. This
                  ensures the fastest processing.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Refund Eligibility
                </h3>
                <p className="text-gray-700 mb-4">
                  To be eligible for a refund, items must be returned within 30
                  days of delivery, in their original condition (unworn,
                  unwashed, with all tags attached). Items marked as final sale
                  are not eligible for refund.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Partial Refunds
                </h3>
                <p className="text-gray-700 mb-4">
                  In some cases, only partial refunds are granted (if
                  applicable):
                </p>
                <ul className="text-gray-600 mb-4 list-disc pl-6">
                  <li>Items with obvious signs of use</li>
                  <li>Any item not in its original condition</li>
                  <li>Any item returned more than 30 days after delivery</li>
                </ul>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sale Items
                </h3>
                <p className="text-gray-700 mb-4">
                  Only regular‑priced items may be refunded. Sale items are
                  non‑refundable unless otherwise stated.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping Costs
                </h3>
                <p className="text-gray-700">
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
