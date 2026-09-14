import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  Heart,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { inquiryApi } from "../api/inquiryApi";
import { copyToClipboard } from "../utils/clipboardUtils";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    petName: "",
    inquiryTopic: "Prescription Approval",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sfTime, setSfTime] = useState("");

  // Live San Francisco Clock
  useEffect(() => {
    const updateSfClock = () => {
      const options = {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setSfTime(new Intl.DateTimeFormat("en-US", options).format(new Date()));
    };
    updateSfClock();
    const interval = setInterval(updateSfClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameVal = formData.name.trim();
    if (!nameVal) {
      newErrors.name = "We'd love to know your name!";
    } else if (nameVal.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (nameVal.length > 50) {
      newErrors.name = "Name must not exceed 50 characters.";
    }

    const emailVal = formData.email.trim();
    if (!emailVal) {
      newErrors.email = "Email is required to write you back.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      newErrors.email = "Email must not exceed 100 characters.";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    const petNameVal = formData.petName.trim();
    if (petNameVal && petNameVal.length < 2) {
      newErrors.petName = "Subject must be at least 2 characters.";
    } else if (petNameVal.length > 100) {
      newErrors.petName = "Subject must not exceed 100 characters.";
    }

    const msgVal = formData.message.trim();
    if (!msgVal) {
      newErrors.message = "Please write a message so we can help.";
    } else if (msgVal.length < 10) {
      newErrors.message = "Messages must be at least 10 characters long.";
    } else if (msgVal.length > 1000) {
      newErrors.message = "Messages must not exceed 1000 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation issues in the form.", {
        icon: "⚠️",
        style: {
          borderRadius: "16px",
          background: "#4B004B",
          color: "#FFF7EF",
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await inquiryApi.create({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.petName || formData.inquiryTopic,
        message: formData.message,
      });

      const petGreeting = formData.petName.trim()
        ? ` and sweet ${formData.petName.trim()}`
        : "";

      toast.success(
        `Thank you, ${formData.name}! We have received your query about "${formData.inquiryTopic}". Our care team will respond to you${petGreeting} within 2 hours! 🐾`,
        {
          duration: 6000,
          icon: "❤️",
          style: {
            borderRadius: "16px",
            background: "#4B004B",
            color: "#FFF7EF",
          },
        },
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        petName: "",
        inquiryTopic: "Prescription Approval",
        message: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = async (text, label) => {
    await copyToClipboard(text);
    toast.success(`${label} copied to clipboard!`, {
      id: "clipboard-toast",
      icon: "📋",
      style: {
        borderRadius: "12px",
        background: "#FFF7EF",
        color: "#4B004B",
        border: "1px solid #4B004B/20",
      },
    });
  };

  return (
    <div
      className="min-h-screen text-brand-purple pb-20 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFF7EF 0%, #FAF6FE 50%, #FFFDFB 100%)",
      }}
    >
      {/* Decorative background vectors/orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-peach/10 blur-[100px] sm:blur-[130px] pointer-events-none animate-pulse duration-[7000ms]"></div>
      <div className="absolute bottom-[25%] right-[-15%] w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full bg-brand-purple/5 blur-[120px] sm:blur-[160px] pointer-events-none animate-pulse duration-[9000ms]"></div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 text-center">
        <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em]  mb-4 sm:mb-10 flex items-center gap-1.5">
          <Link to="/" className="hover:text-brand-purple transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />
          <Link
            to="/contact"
            className="hover:text-brand-purple transition-colors"
          >
            Contact
          </Link>
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-purple/5 border border-brand-purple/10 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-peach animate-spin duration-[4000ms]" />
          <span className="text-brand-purple/95">Happy Pet Rx Care Squad</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-brand-purple leading-[1.1] mb-6">
          We're Here to Help <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B004B] via-[#8A4F2A] to-[#FF9E8A]">
            You & Your Best Friend
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base font-medium text-brand-brown/80 leading-relaxed">
          Need assistance transferring a prescription, checking your order
          status, or finding the perfect wellness essentials for your pet? Our
          support agents and licensed vets are available around the clock.
        </p>
      </section>

      {/* Interactive Main Area (Form + Clock/Map) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Form Card */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-brand-purple/10 rounded-[16px] p-8 sm:p-10 md:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                    Send a Message
                  </h2>
                  <p className="text-brand-brown/70 text-xs sm:text-sm font-semibold mt-1">
                    Fill out the form below and we'll reply right away.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-peach/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-brand-peach" />
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label
                      htmlFor="name"
                      className="text-xs font-bold mb-1.5 pl-1 text-brand-purple/90"
                    >
                      Your Name <span className="text-[#D32F2F]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      minLength={2}
                      maxLength={50}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                      className={`w-full bg-white border ${
                        errors.name
                          ? "border-[#D32F2F]"
                          : "border-brand-purple/10"
                      } focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none px-4 py-3 rounded-2xl text-xs font-semibold text-brand-purple shadow-sm transition-all`}
                    />
                    {errors.name && (
                      <span className="text-[10px] font-bold text-[#D32F2F] mt-1 pl-1">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label
                      htmlFor="email"
                      className="text-xs font-bold mb-1.5 pl-1 text-brand-purple/90"
                    >
                      Email Address <span className="text-[#D32F2F]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      maxLength={100}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. sarah@example.com"
                      className={`w-full bg-white border ${
                        errors.email
                          ? "border-[#D32F2F]"
                          : "border-brand-purple/10"
                      } focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none px-4 py-3 rounded-2xl text-xs font-semibold text-brand-purple shadow-sm transition-all`}
                    />
                    {errors.email && (
                      <span className="text-[10px] font-bold text-[#D32F2F] mt-1 pl-1">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Phone and Pet's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label
                      htmlFor="phone"
                      className="text-xs font-bold mb-1.5 pl-1 text-brand-purple/90"
                    >
                      Phone Number <span className="text-[#D32F2F]">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 10 digit phone number"
                      className={`w-full bg-white border ${
                        errors.phone
                          ? "border-[#D32F2F]"
                          : "border-brand-purple/10"
                      } focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none px-4 py-3 rounded-2xl text-xs font-semibold text-brand-purple shadow-sm transition-all`}
                    />
                    {errors.phone && (
                      <span className="text-[10px] font-bold text-[#D32F2F] mt-1 pl-1">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label
                      htmlFor="petName"
                      className="text-xs font-bold mb-1.5 pl-1 text-brand-purple/90"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="petName"
                      name="petName"
                      minLength={2}
                      maxLength={100}
                      value={formData.petName}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className={`w-full bg-white border ${
                        errors.petName
                          ? "border-[#D32F2F]"
                          : "border-brand-purple/10"
                      } focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none px-4 py-3 rounded-2xl text-xs font-semibold text-brand-purple shadow-sm transition-all`}
                    />
                    {errors.petName && (
                      <span className="text-[10px] font-bold text-[#D32F2F] mt-1 pl-1">
                        {errors.petName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 4: Message */}
                <div className="flex flex-col">
                  <label
                    htmlFor="message"
                    className="text-xs font-bold mb-1.5 pl-1 text-brand-purple/90"
                  >
                    Message <span className="text-[#D32F2F]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    minLength={10}
                    maxLength={1000}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide details about your query, your pet's needs, or order numbers..."
                    className={`w-full bg-white border ${
                      errors.message
                        ? "border-[#D32F2F]"
                        : "border-brand-purple/10"
                    } focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none px-4 py-3.5 rounded-2xl text-xs font-semibold text-brand-purple shadow-sm transition-all resize-none`}
                  />
                  {errors.message && (
                    <span className="text-[10px] font-bold text-[#D32F2F] mt-1 pl-1">
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-purple hover:bg-[#390039] text-white hover:scale-[1.01] active:scale-99 disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 font-bold text-xs py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      <span>Sending Securely...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Secure Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Safety Badges */}
            <div className="pt-6 border-t border-brand-purple/5 mt-8 flex flex-wrap gap-4 items-center justify-between text-[11px] font-semibold text-brand-brown/60">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-[#28A745]" />
                HIPAA & SOC-2 Secure Portal
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-brand-purple" />
                Vet Reviewed Responses
              </span>
            </div>
          </div>

          {/* Right Column: Contact Cards Stacked Vertically */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Card 1: Veterinary & Rx Care */}
            <div className="bg-white/60 hover:bg-white backdrop-blur-md border border-brand-purple/10 p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md group flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-5 group-hover:scale-105 group-hover:bg-brand-purple group-hover:text-brand-cream transition-all duration-300">
                <Heart className="w-6 h-6 fill-current md:fill-none" />
              </div>
              <h3 className="text-lg font-extrabold mb-1">
                Veterinary & Rx Care
              </h3>
              <button
                onClick={() =>
                  handleCopyText("+1 (800) 555-1000", "Phone number")
                }
                className="flex items-center cursor-pointer mt-2 justify-between text-xs font-bold text-brand-purple hover:text-brand-peach transition-colors text-left"
              >
                <span>+1 (800) 555-1000</span>
                <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Card 2: Customer Support */}
            <div className="bg-white/60 hover:bg-white backdrop-blur-md border border-brand-purple/10 p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-5 group-hover:scale-105 group-hover:bg-brand-purple group-hover:text-brand-cream transition-all duration-300">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold mb-1">
                  Customer Support
                </h3>
              </div>
              <button
                onClick={() =>
                  handleCopyText("support@happypetrx.com", "Support email")
                }
                className="flex items-center mt-2 justify-between text-xs font-bold text-brand-purple hover:text-brand-peach transition-colors text-left cursor-pointer"
              >
                <span>support@happypetrx.com</span>
                <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Card 3: 24/7 Availability */}
            <div className="bg-white/60 hover:bg-white backdrop-blur-md border border-brand-purple/10 p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-5 group-hover:scale-105 group-hover:bg-brand-purple group-hover:text-brand-cream transition-all duration-300">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold mb-1">
                  24/7 Availability
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-brand-purple mt-2">
                <span>Available 24/7 for prescriptions & support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
