"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AuthFooter() {
  const currentYear = new Date().getFullYear();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  return (
    <>
      <footer className="bg-gray-100 border-t border-gray-200 py-5">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <div className="flex justify-center gap-6 mb-4">
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-sm hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className="text-sm hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setShowCookie(true)}
              className="text-sm hover:text-gray-900 transition-colors"
            >
              Cookie Policy
            </button>
          </div>
          <p className="text-sm">
            © {currentYear} AmbaStore. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Dialogs */}
      {showPrivacy && (
        <Dialog title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <PrivacyContent />
        </Dialog>
      )}
      {showTerms && (
        <Dialog title="Terms of Service" onClose={() => setShowTerms(false)}>
          <TermsContent />
        </Dialog>
      )}
      {showCookie && (
        <Dialog title="Cookie Policy" onClose={() => setShowCookie(false)}>
          <CookieContent />
        </Dialog>
      )}
    </>
  );
}

// Reusable dialog component
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// Content components (copy from your user footer, adjust colors if needed)
function PrivacyContent() {
  return (
    <div className="prose max-w-none">
      <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Information We Collect
      </h3>
      <p className="text-gray-700 mb-4">
        We collect information you provide directly to us, such as when you
        create an account, make a purchase, or contact us. This may include your
        name, email address, phone number, shipping address, and payment
        information.
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
        <li>Send you promotional offers and newsletters (with your consent)</li>
        <li>Improve our website and services</li>
        <li>Comply with legal obligations</li>
      </ul>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Information Sharing
      </h3>
      <p className="text-gray-700 mb-4">
        We do not sell or rent your personal information to third parties. We
        may share your information with trusted service providers who assist us
        in operating our website, conducting our business, or servicing you, as
        long as those parties agree to keep this information confidential.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Data Security
      </h3>
      <p className="text-gray-700 mb-4">
        We implement appropriate security measures to protect your personal
        information against unauthorized access, alteration, disclosure, or
        destruction.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rights</h3>
      <p className="text-gray-700 mb-4">
        You have the right to access, update, or delete your personal
        information. To exercise these rights, please contact us at
        support@ambaastore.com.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Changes to This Policy
      </h3>
      <p className="text-gray-700">
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new policy on this page.
      </p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="prose max-w-none">
      <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Acceptance of Terms
      </h3>
      <p className="text-gray-700 mb-4">
        By accessing and using AmbaStore services, you accept and agree to be
        bound by these Terms of Service.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Use of Our Services
      </h3>
      <p className="text-gray-700 mb-4">
        You may use our services only for lawful purposes and in accordance with
        these Terms. You agree not to use our services in any way that could
        damage, disable, overburden, or impair our website.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Account Responsibilities
      </h3>
      <p className="text-gray-700 mb-4">
        If you create an account, you are responsible for maintaining the
        security of your account and for all activities that occur under the
        account. You must notify us immediately of any unauthorized use.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Orders and Payments
      </h3>
      <p className="text-gray-700 mb-4">
        By placing an order, you agree to pay the specified price for the
        products. We reserve the right to refuse or cancel any order for any
        reason, including but not limited to product availability, errors in
        pricing, or suspected fraud.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Shipping and Returns
      </h3>
      <p className="text-gray-700 mb-4">
        Our shipping and return policies are outlined separately and are
        incorporated by reference into these Terms.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Intellectual Property
      </h3>
      <p className="text-gray-700 mb-4">
        All content on this website, including text, graphics, logos, and
        images, is the property of AmbaStore and is protected by copyright laws.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Limitation of Liability
      </h3>
      <p className="text-gray-700 mb-4">
        To the fullest extent permitted by law, AmbaStore shall not be liable
        for any indirect, incidental, special, or consequential damages arising
        out of or in connection with your use of our services.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Governing Law
      </h3>
      <p className="text-gray-700">
        These Terms shall be governed by the laws of the Federal Democratic
        Republic of Ethiopia.
      </p>
    </div>
  );
}

function CookieContent() {
  return (
    <div className="prose max-w-none">
      <p className="text-gray-600 mb-6">Effective Date: 22/2/2026</p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        What Are Cookies
      </h3>
      <p className="text-gray-700 mb-4">
        Cookies are small text files that are placed on your computer or mobile
        device when you visit a website. They are widely used to make websites
        work more efficiently and provide information to the site owners.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        How We Use Cookies
      </h3>
      <p className="text-gray-700 mb-4">
        We use cookies for the following purposes:
      </p>
      <ul className="text-gray-600 mb-4 list-disc pl-6">
        <li>
          Essential cookies: Necessary for the website to function properly
        </li>
        <li>
          Performance cookies: Help us understand how visitors interact with our
          website
        </li>
        <li>Functional cookies: Remember your preferences and settings</li>
        <li>Marketing cookies: Used to deliver relevant advertisements</li>
      </ul>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Managing Cookies
      </h3>
      <p className="text-gray-700 mb-4">
        Most web browsers allow you to control cookies through their settings.
        You can choose to block or delete cookies, but this may affect your
        experience on our website.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Changes to This Policy
      </h3>
      <p className="text-gray-700">
        We may update this Cookie Policy from time to time. Any changes will be
        posted on this page.
      </p>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
      <p className="text-gray-700">
        If you have any questions about our use of cookies, please contact us at
        support@ambaastore.com.
      </p>
    </div>
  );
}
