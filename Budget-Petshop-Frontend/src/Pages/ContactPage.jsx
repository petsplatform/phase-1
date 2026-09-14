import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { CONTACT_METHODS } from "../utils/Contact/contact";
import { inquiryApi } from "../api/inquiryApi";

export default function ContactPage() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // UI Interactions state
  const [copiedId, setCopiedId] = useState(null);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle Clipboard Copy
  const handleCopy = (value, id) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Handle Form Validation
  const validateForm = () => {
    const newErrors = {};

    const nameVal = formData.name.trim();
    if (!nameVal) {
      newErrors.name = "Full name is required";
    } else if (nameVal.length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    } else if (nameVal.length > 50) {
      newErrors.name = "Full name must not exceed 50 characters";
    }

    const emailVal = formData.email.trim();
    if (!emailVal) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = "Please enter a valid email address";
    } else if (emailVal.length > 100) {
      newErrors.email = "Email address must not exceed 100 characters";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    const subjectVal = formData.subject.trim();
    if (!subjectVal) {
      newErrors.subject = "Subject is required";
    } else if (subjectVal.length < 2) {
      newErrors.subject = "Subject must be at least 2 characters";
    } else if (subjectVal.length > 100) {
      newErrors.subject = "Subject must not exceed 100 characters";
    }

    const msgVal = formData.message.trim();
    if (!msgVal) {
      newErrors.message = "Message content is required";
    } else if (msgVal.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (msgVal.length > 1000) {
      newErrors.message = "Message must not exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await inquiryApi.create({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setIsSubmitting(false);
      setErrors((prev) => ({
        ...prev,
        submit:
          error.response?.data?.message ||
          error.message ||
          "Message could not be sent. Please try again.",
      }));
    }
  };

  return (
    <main className="bg-white min-h-screen pb-24 font-sans">
      {/* Breadcrumbs */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a8f88]">
          <Link to="/" className="transition hover:text-secondary">
            Home
          </Link>
          <span>/</span>
          <span className="text-secondary font-bold">Contact Us</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="page-shell px-4 py-8 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-on-background sm:text-4xl lg:text-5xl tracking-tight leading-tight">
          We'd Love to Hear From{" "}
          <span className="text-secondary">You & Your Pets</span>
        </h1>
        <p className="mt-4 text-base text-charcoal-text max-w-2xl mx-auto leading-relaxed">
          Have a question about our products, subscription program, or need
          assistance? Get in touch with us and our team will get back to you
          within 24 hours.
        </p>
      </section>

      {/* Main Grid: Form & Info Cards (First Section below Hero) */}
      <section className="page-shell px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Contact Form Container (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[14px] border border-outline p-6 sm:p-10 shadow-[0_25px_50px_rgba(28,40,33,0.04)] text-left">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-secondary animate-ping" />
              <h2 className="text-xl font-bold text-on-background">
                Send a Message
              </h2>
            </div>

            {isSubmitted ? (
              // Success Screen with animations
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-6 animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-on-background">
                  Message Sent Successfully!
                </h3>
                <p className="mt-3 text-sm text-charcoal-text max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. We have received your query and
                  our customer care team (along with our expert advisors) will
                  get back to you shortly.
                </p>
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="rounded-full border border-secondary text-secondary hover:bg-secondary hover:text-white px-6 py-3 text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              // Form Input
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {errors.submit && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                    {errors.submit}
                  </p>
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Name field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="name"
                        className="block text-xs font-bold text-on-background uppercase tracking-wider"
                      >
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-gray-500">Min 2, Max 50 chars</span>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      maxLength={50}
                      onChange={handleChange}
                      placeholder="e.g. Jane Doe"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm bg-background transition-all outline-none ${
                        errors.name
                          ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                          : "border-outline focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="email"
                        className="block text-xs font-bold text-on-background uppercase tracking-wider"
                      >
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-gray-500">Valid email</span>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      maxLength={100}
                      onChange={handleChange}
                      placeholder="e.g. jane@example.com"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm bg-background transition-all outline-none ${
                        errors.email
                          ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                          : "border-outline focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Phone field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="phone"
                        className="block text-xs font-bold text-on-background uppercase tracking-wider"
                      >
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-gray-500">Exact 10 digits</span>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      maxLength={10}
                      onChange={handleChange}
                      placeholder="e.g. 5550000000"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm bg-background transition-all outline-none ${
                        errors.phone
                          ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                          : "border-outline focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Subject field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="subject"
                        className="block text-xs font-bold text-on-background uppercase tracking-wider"
                      >
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-gray-500">Min 2, Max 100 chars</span>
                    </div>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      maxLength={100}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm bg-background transition-all outline-none ${
                        errors.subject
                          ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                          : "border-outline focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.subject}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message field */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="message"
                      className="block text-xs font-bold text-on-background uppercase tracking-wider"
                    >
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">Min 10, Max 1000 chars</span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    maxLength={1000}
                    onChange={handleChange}
                    placeholder="Write details about your query here..."
                    className={`w-full rounded-2xl border px-4 py-3.5 text-sm bg-background transition-all outline-none resize-none ${
                      errors.message
                        ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                        : "border-outline focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Privacy Warning */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-surface-soft/60 border border-outline">
                  <ShieldCheck
                    size={16}
                    className="text-secondary shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-charcoal-text leading-relaxed">
                    We value your privacy. Your information is securely handled
                    and will never be shared with third parties.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-secondary hover:bg-secondary/95 text-white font-bold text-sm px-6 py-4 shadow-lg shadow-secondary/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info Cards Container (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            {CONTACT_METHODS.filter((method) => method.id !== "office").map((method) => {
              const Icon = method.icon;
              const isCopied = copiedId === method.id;
              return (
                <div
                  key={method.id}
                  className="group relative rounded-[14px] border border-outline bg-white p-6 shadow-[0_15px_35px_rgba(28,40,33,0.03)] hover:shadow-[0_20px_45px_rgba(138,114,199,0.08)] hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 mb-5">
                      <Icon size={22} />
                    </div>

                    {/* Title & Info */}
                    <h3 className="text-lg font-bold text-on-background mb-2">
                      {method.title}
                    </h3>
                    <p className="text-xs text-charcoal-text leading-relaxed mb-4">
                      {method.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-outline flex items-center justify-between gap-2">
                    <div className="overflow-hidden">
                      <span className="block text-xs font-semibold text-on-background truncate">
                        {method.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(method.value, method.id)}
                        className="p-2 rounded-lg hover:bg-surface-soft text-charcoal-text hover:text-secondary transition-colors"
                        title="Copy details"
                      >
                        {isCopied ? (
                          <Check size={14} className="text-secondary" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      {/* Action Button */}
                      <a
                        href={method.actionValue}
                        target={
                          method.actionType === "map" ? "_blank" : undefined
                        }
                        rel={
                          method.actionType === "map"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-secondary/10 hover:bg-secondary text-secondary hover:text-white text-[11px] font-bold transition-all duration-200"
                      >
                        Go
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
