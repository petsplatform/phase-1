import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { inquiryApi } from "../../api/inquiryApi";
import {
  Phone,
  Mail,
  Send,
  ChevronRight,
  MessageSquare,
  Heart,
  AlertCircle,
} from "lucide-react";

const ContactPage = () => {
  const { addToast } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Select a subject",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const nameVal = formData.name.trim();
    if (!nameVal) {
      newErrors.name = "Full name is required";
    } else if (nameVal.length < 2 || nameVal.length > 50) {
      newErrors.name = "Full name must be between 2 and 50 characters";
    }

    const emailVal = formData.email.trim();
    if (!emailVal) {
      newErrors.email = "Email address is required";
    } else if (!emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Please enter a valid email address";
    } else if (emailVal.length > 100) {
      newErrors.email = "Email address cannot exceed 100 characters";
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits";
      }
    }

    if (formData.subject === "Select a subject") {
      newErrors.subject = "Please select an inquiry subject";
    }

    const msgVal = formData.message.trim();
    if (!msgVal) {
      newErrors.message = "Message details are required";
    } else if (msgVal.length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    } else if (msgVal.length > 1000) {
      newErrors.message = "Message cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await inquiryApi.submit({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      addToast({
        title: "Message Sent Successfully!",
        message: "Thank you. Our care team will get back to you shortly.",
        type: "success",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Select a subject",
        message: "",
      });
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      addToast({
        title: "Submission Failed",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Could not send inquiry. Please try again later.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 md:py-20 bg-[#F8FAFC] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30 text-left">
      <div className="container-custom max-w-6xl">
        {/* Breadcrumb navigation */}
        <div className="mb-10 text-xs font-bold text-[#627D98] flex items-center gap-1.5 uppercase tracking-wider">
          <Link to="/" className="hover:text-[#087BC1] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43]">Contact Us</span>
        </div>

        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#087BC1]/20 bg-[#EAF5FC] text-[#087BC1] text-xs font-extrabold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087BC1] animate-pulse" />
            <span>Licensed Pet Pharmacy</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl sm:text-5xl text-[#073B66] leading-[1.15] tracking-tight">
            Get in <span className="text-[#087BC1] font-black">Touch</span> With
            Us
          </h1>
          <p className="text-sm sm:text-base text-[#66788A] mt-5 leading-relaxed font-semibold max-w-2xl mx-auto">
            Have a question about your pet's prescription, need help placing an
            order, or want to consult with our licensed pharmacists? We're here
            to help your furry family members.
          </p>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* LEFT: Send Us a Message Form Card */}
          <div className="lg:col-span-7 bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="font-jakarta font-extrabold text-2xl text-[#073B66] mb-1">
              Send Us a Message
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] mb-8 font-semibold">
              Fill out the form below and our team will get back to you
              promptly.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-[#073B66] uppercase tracking-wider flex">
                    <span>Full Name</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`bg-[#F8FAFC] border ${errors.name ? "border-red-500 focus:ring-red-500/20" : "border-[#D9E8F2] focus:border-[#087BC1]"} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 transition-all font-semibold`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-[#073B66] uppercase tracking-wider flex">
                    <span>Email Address</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`bg-[#F8FAFC] border ${errors.email ? "border-red-500 focus:ring-red-500/20" : "border-[#D9E8F2] focus:border-[#087BC1]"} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 transition-all font-semibold`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-[#073B66] uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className={`bg-[#F8FAFC] border ${errors.phone ? "border-red-500 focus:ring-red-500/20" : "border-[#D9E8F2] focus:border-[#087BC1]"} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 transition-all font-semibold`}
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-[#073B66] uppercase tracking-wider flex">
                    <span>Subject</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`bg-[#F8FAFC] border ${errors.subject ? "border-red-500 focus:ring-red-500/20" : "border-[#D9E8F2] focus:border-[#087BC1]"} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 transition-all cursor-pointer font-semibold`}
                  >
                    <option value="Select a subject" disabled>
                      Select a subject
                    </option>
                    <option value="General Support">General Support</option>
                    <option value="Prescription Verification">
                      Prescription Verification
                    </option>
                    <option value="Order Assistance">Order Assistance</option>
                    <option value="Pharmacist Consultation">
                      Pharmacist Consultation
                    </option>
                    <option value="Feedback">Feedback</option>
                  </select>
                  {errors.subject && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.subject}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-[#073B66] uppercase tracking-wider flex">
                  <span>Message</span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help with your pet's medication needs..."
                  className={`bg-[#F8FAFC] border ${errors.message ? "border-red-500 focus:ring-red-500/20" : "border-[#D9E8F2] focus:border-[#087BC1]"} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 transition-all resize-y font-semibold`}
                />
                {errors.message && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#087BC1] hover:bg-[#073B66] text-white font-bold text-sm py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#087BC1]/15 hover:shadow-[#087BC1]/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {isSubmitting ? "Sending Message..." : "Send Message"}
                  </span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#66788A] text-center mt-2 font-semibold">
                By submitting, you agree to our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-[#087BC1] hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  to="/terms-conditions"
                  className="text-[#087BC1] hover:underline"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </form>
          </div>

          {/* RIGHT: Contact Information Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
            {/* Card 1: Call Us */}
            <a
              href="tel:+18007386337"
              className="group bg-[#EAF5FC]/50 border border-[#087BC1]/15 rounded-2xl p-6 flex items-center justify-between gap-4 transition-all duration-300 hover:bg-[#EAF5FC] hover:shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EAF5FC] text-[#087BC1] flex items-center justify-center shrink-0">
                  <Phone className="w-5.5 h-5.5" />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-[#087BC1] uppercase tracking-widest">
                    Call Us Toll-Free
                  </h4>
                  <p className="text-sm font-bold text-[#073B66] mt-0.5">
                    1-800-555-333
                  </p>
                  <p className="text-[11px] text-[#66788A] font-semibold mt-0.5">
                    Speak with a licensed pharmacist
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#087BC1] group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Card 2: Email */}
            <a
              href="mailto:support@vetsupplyexpress.com"
              className="group bg-[#EBF5FB]/50 border border-[#18A9E5]/15 rounded-2xl p-6 flex items-center justify-between gap-4 transition-all duration-300 hover:bg-[#EBF5FB] hover:shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EBF5FB] text-[#18A9E5] flex items-center justify-center shrink-0">
                  <Mail className="w-5.5 h-5.5" />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-[#18A9E5] uppercase tracking-widest">
                    Email Support
                  </h4>
                  <p className="text-sm font-bold text-[#073B66] mt-0.5">
                    support@vetsupplyexpress.com
                  </p>
                  <p className="text-[11px] text-[#66788A] font-semibold mt-0.5">
                    We respond within 24 hours
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#18A9E5] group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Card 4: Emergency Line */}
            <a
              href="tel:+18008384357"
              className="group bg-[#FFF3E8]/50 border border-[#F28A16]/15 rounded-2xl p-6 flex items-center justify-between gap-4 transition-all duration-300 hover:bg-[#FFF3E8] hover:shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF3E8] text-[#F28A16] flex items-center justify-center shrink-0">
                  <Heart className="w-5.5 h-5.5" />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-[#F28A16] uppercase tracking-widest">
                    Emergency Line
                  </h4>
                  <p className="text-sm font-bold text-[#073B66] mt-0.5">
                    1-800-555-333
                  </p>
                  <p className="text-[11px] text-[#66788A] font-semibold mt-0.5">
                    24/7 pet emergency support
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#F28A16] group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
