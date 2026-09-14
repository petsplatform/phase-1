import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Timer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import logo from "../../assets/Logo/footer-logo.png";
import petLoginImg from "../../assets/Authentication/loginbg.png";
import { authApi } from "../../api/authApi";
import { CUSTOMER_BLOCKED_REASON_KEY } from "../../api/sessionStorage";

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [demoOtp, setDemoOtp] = useState("482910");
  const [otpToken, setOtpToken] = useState("");
  const [timer, setTimer] = useState(0);

  // Validation and UI states
  const [errors, setErrors] = useState({});
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [blockedReason, setBlockedReason] = useState("");

  const otpInputsRef = useRef([]);

  useEffect(() => {
    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason(reason);
    }
  }, []);

  // Timer countdown handler
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Form validations for email
  const validateEmailForm = () => {
    const newErrors = {};
    const emailVal = email.trim();
    if (!emailVal) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = "Please enter a valid email address";
    } else if (emailVal.length > 100) {
      newErrors.email = "Email address must not exceed 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit email to request OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!validateEmailForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setBlockedReason("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }

    try {
      const response = await authApi.requestLoginOtp({ email: email.trim() });
      setOtpToken(response.otpToken || response.token || "");
      setIsSubmitting(false);
      setStep(2);
      setTimer(30);
      setResendMessage("");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setDemoOtp(response.otp || "");
      setBlockedReason("");
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    } catch (error) {
      setIsSubmitting(false);
      const isBlocked =
        error.response?.status === 403 || error.response?.data?.isBlocked;
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Could not send OTP. Please try again.";
      if (isBlocked) {
        setBlockedReason(msg);
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
      } else {
        setBlockedReason("");
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      }
      setErrors({
        email: msg,
      });
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (timer > 0) return;

    try {
      const response = await authApi.requestLoginOtp({ email: email.trim() });
      setOtpToken(response.otpToken || response.token || "");
      setTimer(30);
      setDemoOtp(response.otp || "");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setResendMessage("A new OTP code has been sent!");

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (error) {
      setOtpError(
        error.response?.data?.message ||
          error.message ||
          "Could not resend OTP. Please try again.",
      );
    }
  };

  // OTP inputs keyboard interaction
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (value !== "" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          otpInputsRef.current[index - 1]?.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Submit OTP to Login
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const enteredOtp = otp.join("");

    if (enteredOtp.length < 6) {
      setOtpError("Please enter all 6 digits of the OTP code");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.verifyLoginOtp({ otpToken, code: enteredOtp });
      setIsSubmitting(false);
      setStep(3); // Go to Success Step

      // Redirect to homepage after successful notification
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setOtpError(
        error.response?.data?.message ||
          error.message ||
          "Invalid verification code. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans lg:h-screen lg:overflow-hidden">
      {/* Back button (Top Left) */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 rounded-full border border-outline bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal-text backdrop-blur-md transition hover:border-secondary hover:text-secondary hover:shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Store</span>
      </Link>

      {/* Split Screen Layout */}
      <div className="flex w-full lg:h-full">
        {/* Left Side: Illustration Pane (Hidden on Mobile/Tablet) */}
        <div className="relative hidden w-1/2 lg:block lg:h-full">
          {/* Main Pet Image */}
          <img
            src={petLoginImg}
            alt="Cute puppy and kitten"
            className="h-full w-full object-cover"
          />
          {/* Ambient Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />

          {/* Tagline Card (Glassmorphism) */}
          <div className="absolute bottom-12 left-12 right-12 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={20} className="text-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Exclusive Club
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white font-display">
              Healthy & Happy Pets <br />
              Start with Budget PetShop
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Sign in to manage your wishlist, track orders, unlock member-only
              price discounts, and receive tailored care recommendations for
              your furry friends.
            </p>
          </div>
        </div>

        {/* Right Side: Form Pane */}
        <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:h-full lg:overflow-y-auto">
          <div className="w-full max-w-md text-left">
            {/* Logo and Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <Link to="/">
                <img
                  src={logo}
                  alt="Budget PetShop Logo"
                  className="h-24 w-auto object-contain mb-4 transition transform hover:scale-105"
                />
              </Link>

              {step === 1 && (
                <>
                  <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                    Welcome Back!
                  </h1>
                  <p className="text-sm text-charcoal-text mt-1.5">
                    Enter your email to receive a secure login OTP
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                    Verify Your Email
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <span className="text-sm font-semibold text-charcoal-text truncate max-w-[240px]">
                      {email}
                    </span>
                    <button
                      onClick={() => setStep(1)}
                      className="p-1 text-secondary hover:bg-secondary/10 rounded-full transition cursor-pointer"
                      title="Edit email"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                    Access Granted
                  </h1>
                  <p className="text-sm text-charcoal-text mt-1.5">
                    Preparing your pet parent dashboard...
                  </p>
                </>
              )}
            </div>

            {blockedReason && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600 flex-shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-800">
                      Account Blocked
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-red-700">
                      {blockedReason}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      Please contact customer support to resolve this issue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Enter Email Form */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6" noValidate>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Email Address *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">
                      Valid email
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      maxLength={100}
                      placeholder="e.g., alex@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (blockedReason) {
                          setBlockedReason("");
                        }
                        if (typeof window !== "undefined") {
                          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
                        }
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-4 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${
                        errors.email
                          ? "border-accent bg-rose-50 ring-2 ring-accent/10 focus:border-accent"
                          : "border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-accent font-medium flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-secondary/95 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP Form */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* Resend Success Message Alert */}
                {resendMessage && (
                  <div className="rounded-xl bg-surface-tint border border-primary/20 px-4 py-3 text-xs text-primary font-semibold flex items-center gap-2 animate-fade-in-up">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    {resendMessage}
                  </div>
                )}

                {/* OTP Input Fields Row */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Enter Verification Code *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">
                      Exact 6 digits
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2.5">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className={`w-12 h-14 text-xl font-bold text-center rounded-xl border bg-white focus:outline-none transition duration-200 ${
                          otpError
                            ? "border-accent ring-2 ring-accent/10 focus:border-accent"
                            : "border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="mt-2 text-xs text-accent font-medium text-center flex items-center justify-center gap-1.5">
                      <AlertCircle size={12} />
                      {otpError}
                    </p>
                  )}
                </div>

                {/* Resend Section & Timer */}
                <div className="flex justify-center items-center">
                  {timer > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-text font-semibold bg-surface-soft px-3 py-1.5 rounded-full border border-outline">
                      <Timer
                        size={14}
                        className="text-secondary animate-pulse"
                      />
                      <span>
                        Resend code in{" "}
                        <strong className="text-on-background font-bold">
                          {timer}s
                        </strong>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="flex items-center gap-1.5 text-xs text-secondary font-bold hover:text-secondary/85 hover:underline cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Resend verification code</span>
                    </button>
                  )}
                </div>

                {/* Submit Verification Code */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-secondary/95 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Verifying code...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                {demoOtp ? (
                  <div className="rounded-2xl bg-surface-soft border border-outline-strong p-4 text-center">
                    <p className="text-xs text-charcoal-text leading-relaxed">
                      Development OTP returned by the backend:
                    </p>
                    <p className="text-lg font-mono font-extrabold text-secondary mt-1.5 tracking-widest bg-white rounded-xl py-1.5 px-4 inline-block border border-outline">
                      {demoOtp}
                    </p>
                  </div>
                ) : null}
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {step === 3 && (
              <div className="rounded-3xl bg-surface-tint border border-primary/20 p-8 text-center animate-fade-in-up shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-primary font-display">
                  Login Successful!
                </h3>
                <p className="text-xs text-charcoal-text mt-2">
                  Welcome to Budget PetShop! Redirecting you to the home
                  store...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
