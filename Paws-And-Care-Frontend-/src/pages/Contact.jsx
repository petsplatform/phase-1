import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Heart,
  ClipboardList,
  Copy,
  Check,
  MessageSquare,
  HeartHandshake,
  Package,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { inquiryApi } from "../api/inquiryApi";

const PawIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function Contact() {
  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [copiedCardId, setCopiedCardId] = useState(null);

  // Input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue =
      type === "checkbox"
        ? checked
        : name === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    // Clear errors inline
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Form validation helper
  const validateForm = () => {
    let tempErrors = {};
    const nameVal = formData.fullName.trim();
    if (!nameVal) {
      tempErrors.fullName = "Full Name is required.";
    } else if (nameVal.length < 2 || nameVal.length > 50) {
      tempErrors.fullName = "Full Name must be between 2 and 50 characters.";
    }

    const emailVal = formData.email.trim();
    if (!emailVal) {
      tempErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) ||
      emailVal.length > 100
    ) {
      tempErrors.email =
        "Please enter a valid email address (max 100 characters).";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      tempErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      tempErrors.phone = "Phone number must be exactly 10 digits.";
    }

    const subjectVal = formData.subject.trim();
    if (!subjectVal) {
      tempErrors.subject = "Subject is required.";
    } else if (subjectVal.length < 2 || subjectVal.length > 100) {
      tempErrors.subject = "Subject must be between 2 and 100 characters.";
    }

    const messageVal = formData.message.trim();
    if (!messageVal) {
      tempErrors.message = "Message details are required.";
    } else if (messageVal.length < 10 || messageVal.length > 1000) {
      tempErrors.message = "Message must be between 10 and 1000 characters.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await inquiryApi.submit({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setIsSubmitting(false);
      setSubmitStatus("error");
      setErrors({
        submit:
          error.message || "Unable to send your message. Please try again.",
      });
    }
  };

  // Copy contact actions helper
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCardId(id);
      setTimeout(() => setCopiedCardId(null), 2000);
    });
  };

  // Scroll to Form helper
  const handleScrollToForm = () => {
    const formElement = document.getElementById("contact-form-section");
    if (formElement) {
      const headerOffset = 90;
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans antialiased">
      {/* ── 1. CONTACT HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-peach/20 border-b border-brand-border/60 py-16 sm:py-20 select-none">
        {/* Soft floating background ornaments */}
        <div className="absolute top-10 left-10 text-brand-peach/30 pointer-events-none transform -rotate-12 animate-pulse hidden md:block">
          <PawIcon className="w-16 h-16" />
        </div>
        <div className="absolute bottom-10 right-10 text-brand-peach/40 pointer-events-none transform rotate-12 hidden md:block">
          <Heart size={44} className="fill-current" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center justify-center gap-1.5 text-xs text-brand-muted mb-2"
          >
            <Link
              to="/"
              className="hover:text-brand-coral transition-colors font-medium"
            >
              Home
            </Link>
            <span className="text-brand-border">/</span>
            <span className="text-brand-text font-semibold">Contact</span>
          </nav>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 bg-brand-coral/10 text-brand-coral font-heading font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" />
            <span>PawsAndCare Support</span>
          </span>

          {/* Title */}
          <h1 className="font-heading font-black text-3xl sm:text-5xl text-brand-text leading-tight tracking-tight">
            We’re Here for You and Your Pet
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-brand-muted max-w-xl mx-auto leading-relaxed">
            Have a question about food ingredients, delivery delays, or need
            customized pet-care advice? Fill out our form or contact our
            specialty lines.
          </p>
        </div>
      </section>

      {/* ── 2. MAIN CONTACT AREA (Two Column Layout) ────────────────────── */}
      <section
        id="contact-form-section"
        className="max-w-6xl mx-auto px-4 py-12 lg:py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Premium Contact Form */}
          <div className="lg:col-span-7 bg-white border border-brand-border/60 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
            <div className="text-left space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
                Send a Message
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Provide your ticket details below and our veterinary care team
                will respond within 2-4 hours.
              </p>
            </div>

            {submitStatus === "success" && (
              <div className="bg-brand-teal/5 border border-brand-teal/20 text-brand-teal rounded-2xl p-5 text-left flex items-start gap-3">
                <Check
                  className="shrink-0 text-brand-teal bg-brand-teal/10 rounded-full p-0.5 mt-0.5"
                  size={18}
                  strokeWidth={3}
                />
                <div className="space-y-1">
                  <h4 className="font-heading font-extrabold text-sm sm:text-base">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Thank you! Your ticket was registered. We have sent a
                    confirmation copy to your email address.
                  </p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-brand-coral/5 border border-brand-coral/20 text-brand-coral rounded-2xl p-5 text-left flex items-start gap-3">
                <span className="shrink-0 text-brand-coral bg-brand-coral/10 rounded-full w-5 h-5 flex items-center justify-center font-heading font-black text-xs">
                  !
                </span>
                <div className="space-y-1">
                  <h4 className="font-heading font-extrabold text-sm sm:text-base">
                    Please Resolve Errors
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Some fields are incomplete or invalid. Please check the
                    highlighted errors and try again.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5 text-left"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-xs sm:text-sm font-heading font-bold text-brand-text"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-brand-bg/10 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans ${
                    errors.fullName
                      ? "border-brand-coral"
                      : "border-brand-border/60"
                  }`}
                />
                {errors.fullName && (
                  <span className="block text-[11px] font-semibold text-brand-coral">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-heading font-bold text-brand-text"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-brand-bg/10 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans ${
                      errors.email
                        ? "border-brand-coral"
                        : "border-brand-border/60"
                    }`}
                  />
                  {errors.email && (
                    <span className="block text-[11px] font-semibold text-brand-coral">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="block text-xs sm:text-sm font-heading font-bold text-brand-text"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="e.g. +1 555-0199"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-brand-bg/10 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans ${
                      errors.phone
                        ? "border-brand-coral"
                        : "border-brand-border/60"
                    }`}
                  />
                  {errors.phone && (
                    <span className="block text-[11px] font-semibold text-brand-coral">
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="block text-xs sm:text-sm font-heading font-bold text-brand-text"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-brand-bg/10 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans ${
                    errors.subject
                      ? "border-brand-coral"
                      : "border-brand-border/60"
                  }`}
                />
                {errors.subject && (
                  <span className="block text-[11px] font-semibold text-brand-coral">
                    {errors.subject}
                  </span>
                )}
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="message"
                    className="block text-xs sm:text-sm font-heading font-bold text-brand-text"
                  >
                    Message *
                  </label>
                  <span className="text-[10px] sm:text-xs text-brand-muted font-sans font-medium">
                    {formData.message.length} / 1000
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  maxLength={1000}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-brand-bg/10 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans resize-y ${
                    errors.message
                      ? "border-brand-coral"
                      : "border-brand-border/60"
                  }`}
                />
                {errors.message && (
                  <span className="block text-[11px] font-semibold text-brand-coral">
                    {errors.message}
                  </span>
                )}
              </div>

              {errors.submit && (
                <span className="block text-[11px] font-semibold text-brand-coral text-left">
                  {errors.submit}
                </span>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full py-4 px-8 font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Dedicated Support Lines */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-left space-y-2 mb-2">
              <span className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
                Specialty Inquiries
              </span>
              <h2 className="font-heading font-black text-2xl text-brand-text">
                Dedicated Support Lines
              </h2>
              <p className="font-sans text-xs text-brand-muted leading-relaxed">
                Need details regarding strategic partnerships, delivery
                exceptions, or medical ingredient clearances? Contact our
                divisions.
              </p>
            </div>

            <div className="space-y-4">
              {/* Card 1: Product & Pet Care Help */}
              <div className="bg-white border border-brand-border/60 rounded-[2rem] p-5 flex flex-col justify-between items-start text-left shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-teal/5 border border-brand-teal/20 flex items-center justify-center text-brand-teal shrink-0">
                      <HeartHandshake size={18} />
                    </div>
                    <h3 className="font-heading font-black text-brand-text text-sm sm:text-base">
                      Product & Pet Care Help
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-muted leading-relaxed">
                    For inquiries about food ingredients, size guide
                    recommendations, or veterinary product approvals.
                  </p>
                </div>

                <div className="pt-4 w-full flex flex-row items-center justify-between gap-3 border-t border-brand-border/40 mt-4">
                  <div className="flex justify-between items-center text-xs font-sans text-brand-muted gap-2">
                    <span>Response Time:</span>
                    <strong className="text-brand-teal">Under 4 Hours</strong>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyText("care@pawsandcare.com", "care")
                    }
                    className="inline-flex items-center justify-center gap-1.5 border border-brand-border hover:border-brand-teal text-brand-text hover:text-brand-teal py-1.5 px-3 rounded-xl text-xs font-heading font-bold transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {copiedCardId === "care" ? (
                      <>
                        <Check
                          size={13}
                          className="text-brand-teal animate-bounce"
                        />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Orders, Returns & Delivery */}
              <div className="bg-white border border-brand-border/60 rounded-[2rem] p-5 flex flex-col justify-between items-start text-left shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-coral/5 border border-brand-coral/20 flex items-center justify-center text-brand-coral shrink-0">
                      <Package size={18} />
                    </div>
                    <h3 className="font-heading font-black text-brand-text text-sm sm:text-base">
                      Orders, Returns & Delivery
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-muted leading-relaxed">
                    For updates on shipments, returns, refund status, or
                    updating delivery addresses.
                  </p>
                </div>

                <div className="pt-4 w-full flex flex-row items-center justify-between gap-3 border-t border-brand-border/40 mt-4">
                  <div className="flex justify-between items-center text-xs font-sans text-brand-muted gap-2">
                    <span>Response Time:</span>
                    <strong className="text-brand-coral">Under 2 Hours</strong>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyText("orders@pawsandcare.com", "orders")
                    }
                    className="inline-flex items-center justify-center gap-1.5 border border-brand-border hover:border-brand-teal text-brand-text hover:text-brand-teal py-1.5 px-3 rounded-xl text-xs font-heading font-bold transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {copiedCardId === "orders" ? (
                      <>
                        <Check
                          size={13}
                          className="text-brand-teal animate-bounce"
                        />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. QUICK HELP CTA (Shortcut actions) ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 select-none">
        <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-[2.5rem] p-8 sm:p-10 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
              FAQ Shortcuts
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-text">
              Need a Faster Answer?
            </h2>
            <p className="font-sans text-xs sm:text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
              Before contacting us, visit our Help Center to resolve standard
              queries immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-2">
            <Link
              to="/faq"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-7 py-3.5 font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>View All FAQs</span>
              <ChevronRight size={14} />
            </Link>

            <Link
              to="/account/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5 rounded-full px-7 py-3.5 font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <ClipboardList size={14} />
              <span>Track Order</span>
            </Link>

            <button
              onClick={handleScrollToForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-brand-border bg-white text-brand-text hover:bg-brand-bg rounded-full px-7 py-3.5 font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <MessageSquare size={14} className="text-brand-coral" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
