import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  CheckCircle,
  ChevronRight,
  Globe,
  Shield,
  User,
  Tag,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { createInquiryApi } from "../helper/axiosInstance";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!value.trim()) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters long";
      } else if (value.trim().length > 50) {
        error = "Name must be 50 characters or fewer";
      } else if (!nameRegex.test(value.trim())) {
        error = "Name can only contain letters and spaces";
      }
    }
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Email address is required";
      } else if (value.trim().length > 100) {
        error = "Email must be 100 characters or fewer";
      } else if (!emailRegex.test(value.trim())) {
        error = "Please enter a valid email address";
      }
    }
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (value.trim() && digitsOnly.length !== 10) {
        error = "Phone number must be exactly 10 digits";
      }
    }
    if (name === "subject") {
      if (!value) {
        error = "Please select a subject";
      }
    }
    if (name === "message") {
      if (!value.trim()) {
        error = "Message is required";
      } else if (value.trim().length < 10) {
        error = "Message must be at least 10 characters long";
      } else if (value.trim().length > 1000) {
        error = "Message must be 1000 characters or fewer";
      }
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ["name", "email", "phone", "subject", "message"];
    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    };
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error("Please resolve the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInquiryApi({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
      });
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success(
        "Your message has been sent successfully! We'll get back to you within 24 hours.",
      );
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setErrors({});
      setTouched({});
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error || "Failed to send message. Please try again.");
    }
  };

  const contactMethods = [
    {
      icon: <Phone className="h-6 w-6" />,
      label: "Call Us Toll-Free",
      value: "1-800-738-6337",
      subtext: "Speak with a licensed pharmacist",
      href: "tel:18007386337",
      color: "primary-green",
      bgColor: "bg-primary-green/10",
      borderColor: "border-primary-green/20",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      label: "Email Support",
      value: "support@petmedsdirect.com",
      subtext: "We respond within 24 hours",
      href: "mailto:support@petmedsdirect.com",
      color: "medical-teal",
      bgColor: "bg-medical-teal/10",
      borderColor: "border-medical-teal/20",
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      label: "Emergency Line",
      value: "1-888-738-6337",
      subtext: "24/7 pet emergency support",
      href: "tel:18887386337",
      color: "primary-green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
  ];

  const storeHours = [
    { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM EST", isOpen: true },
    { day: "Saturday", hours: "9:00 AM – 5:00 PM EST", isOpen: true },
    { day: "Sunday", hours: "10:00 AM – 3:00 PM EST", isOpen: true },
    { day: "Holidays", hours: "Hours may vary", isOpen: false },
  ];

  const getCurrentDayIndex = () => {
    const day = new Date().getDay();
    if (day >= 1 && day <= 5) return 0; // Mon-Fri
    if (day === 6) return 1; // Saturday
    return 2; // Sunday
  };

  return (
    <main className="overflow-hidden">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-28 pb-8 sm:pt-14 sm:pb-14 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-green/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-medical-teal/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-blue/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
            <Link to="/" className="hover:text-primary-green transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-deep-navy font-semibold">Contact Us</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-green/10 border border-primary-green/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="h-4 w-4 text-primary-green" />
              <span className="text-xs font-bold text-primary-green tracking-wide uppercase">
                Licensed Pet Pharmacy
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-deep-navy leading-[1.1]">
              Get in <span className="text-primary-green">Touch</span> With Us
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Have a question about your pet's prescription, need help placing
              an order, or want to consult with our licensed pharmacists? We're
              here to help your furry family members.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Main Content: Form + Map/Info ─── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ─── Contact Form (Left Column) ─── */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
                <div className="mb-8">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 font-medium">
                    Fill out the form below and our team will get back to you
                    promptly.
                  </p>
                </div>

                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-primary-green/10 flex items-center justify-center mb-6">
                      <CheckCircle className="h-10 w-10 text-primary-green" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-deep-navy mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-slate-600 font-medium max-w-sm">
                      Thank you for reaching out. Our team will review your
                      message and respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5"
                  >
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                        >
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            id="contact-name"
                            type="text"
                            name="name"
                            maxLength={50}
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="John Doe"
                            className={`w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border text-sm text-deep-navy placeholder:text-slate-400 focus:outline-none transition-all ${
                              touched.name && errors.name
                                ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900"
                                : "border-slate-200 focus:border-primary-green/50 focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                            }`}
                          />
                        </div>
                        {touched.name && errors.name && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                        >
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="h-4 w-4" />
                          </div>
                          <input
                            id="contact-email"
                            type="email"
                            maxLength={100}
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="john@example.com"
                            className={`w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border text-sm text-deep-navy placeholder:text-slate-400 focus:outline-none transition-all ${
                              touched.email && errors.email
                                ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900"
                                : "border-slate-200 focus:border-primary-green/50 focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                            }`}
                          />
                        </div>
                        {touched.email && errors.email && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                        >
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Phone className="h-4 w-4" />
                          </div>
                          <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            maxLength={10}
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="(555) 123-4567"
                            className={`w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border text-sm text-deep-navy placeholder:text-slate-400 focus:outline-none transition-all ${
                              touched.phone && errors.phone
                                ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900"
                                : "border-slate-200 focus:border-primary-green/50 focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                            }`}
                          />
                        </div>
                        {touched.phone && errors.phone && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                        >
                          Subject <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Tag className="h-4 w-4" />
                          </div>
                          <select
                            id="contact-subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full h-12 pl-10 pr-10 rounded-xl bg-slate-50 border text-sm text-deep-navy focus:outline-none transition-all appearance-none cursor-pointer ${
                              touched.subject && errors.subject
                                ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900"
                                : "border-slate-200 focus:border-primary-green/50 focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                            }`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 12px center",
                            }}
                          >
                            <option value="">Select a subject</option>
                            <option value="prescription">
                              Prescription Inquiry
                            </option>
                            <option value="order">Order Support</option>
                            <option value="shipping">
                              Shipping & Delivery
                            </option>
                            <option value="returns">Returns & Refunds</option>
                            <option value="pharmacy">
                              Pharmacy Consultation
                            </option>
                            <option value="account">Account Help</option>
                            <option value="feedback">
                              Feedback & Suggestions
                            </option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        {touched.subject && errors.subject && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errors.subject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                      >
                        Message <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <textarea
                          id="contact-message"
                          name="message"
                          rows="5"
                          maxLength={1000}
                          value={formData.message}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Tell us how we can help with your pet's medication needs..."
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border text-sm text-deep-navy placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
                            touched.message && errors.message
                              ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900"
                              : "border-slate-200 focus:border-primary-green/50 focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                          }`}
                        />
                      </div>
                      {touched.message && errors.message && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-13 rounded-xl bg-primary-green hover:bg-dark-green disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-primary-green/20 hover:shadow-xl hover:shadow-primary-green/30 flex items-center justify-center gap-2.5 group cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-slate-400 font-medium mt-3">
                      By submitting, you agree to our{" "}
                      <a
                        href="#"
                        className="text-primary-green hover:underline"
                      >
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-primary-green hover:underline"
                      >
                        Terms of Service
                      </a>
                      .
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* ─── Contact Info Cards (Right Column) ─── */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.href}
                  className={`group relative flex flex-col justify-center rounded-2xl border ${method.borderColor} ${method.bgColor} p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 flex-1`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${method.bgColor} text-${method.color} mb-4 transition-transform group-hover:scale-110`}
                  >
                    {method.icon}
                  </div>
                  <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    {method.label}
                  </h3>
                  <p className="text-sm font-bold text-deep-navy leading-snug">
                    {method.value}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {method.subtext}
                  </p>
                  <ChevronRight className="absolute top-6 right-5 h-4 w-4 text-slate-300 group-hover:text-primary-green transition-all group-hover:translate-x-1" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
