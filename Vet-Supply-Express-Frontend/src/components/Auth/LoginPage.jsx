import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { ShieldCheck, Truck, Clock, ArrowRight, Mail, KeyRound, Plus, ShieldAlert } from "lucide-react";
import { authApi } from "../../api/authApi";
import { CUSTOMER_BLOCKED_REASON_KEY, AUTH_CHANGE_EVENT } from "../../api/authStorage";

const LoginPage = () => {
  const { loginUser } = useContext(AuthContext);
  const { addToast } = useContext(AppContext);
  const navigate = useNavigate();

  // Step state: "email" or "otp"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  const otpInputsRef = useRef([]);

  // Check stored blocked reason on mount and listen for real-time auth change events
  useEffect(() => {
    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) setBlockedReason(reason);

    const handleAuthChange = () => {
      const updatedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (updatedReason) {
        setBlockedReason(updatedReason);
        setEmailError("");
        setStep("email");
      } else {
        setBlockedReason("");
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  // Resend Timer Countdown
  useEffect(() => {
    let interval = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Autofocus the first OTP field when step transitions
  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      setTimeout(() => {
        otpInputsRef.current[0].focus();
      }, 100);
    }
  }, [step]);

  // Email validation check
  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) return "Email address is required.";
    if (!regex.test(val)) return "Please enter a valid email address.";
    return "";
  };

  // Submit email to trigger OTP code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setBlockedReason("");
    localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setIsSending(true);

    try {
      const data = await authApi.requestLoginOtp({ email });
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason("");
      const token = data?.otpToken || data;
      setOtpToken(token);
      setStep("otp");
      setResendTimer(30);
      setOtpValues(["", "", "", "", "", ""]);
      addToast({
        title: "Code Sent",
        message: "Verification code sent to your email successfully.",
        type: "wishlist"
      });
    } catch (error) {
      console.error("Error requesting login OTP:", error);
      const rawMsg = (error.response?.data?.message || error.message || "").toLowerCase();
      const isBlocked =
        Boolean(error.response?.data?.isBlocked) ||
        rawMsg.includes("blocked") ||
        rawMsg.includes("deactivated") ||
        rawMsg.includes("suspended");

      if (isBlocked) {
        const reason =
          error.response?.data?.message ||
          error.message ||
          "Your account has been blocked. Please contact support.";
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
        setBlockedReason(reason);
        setEmailError("");
      } else {
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        setBlockedReason("");
        const errMsg = error.response?.data?.message || "Failed to request verification code.";
        setEmailError(errMsg);
        addToast({
          title: "Authentication Error",
          message: errMsg,
          type: "error"
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle key input inside OTP boxes
  const handleOtpChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newValues = [...otpValues];
    // Keep only the last character entered
    newValues[index] = value.substring(value.length - 1);
    setOtpValues(newValues);

    // If input is filled, move focus to the next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  // Handle backspaces inside OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        // Clear previous input and move focus backward
        const newValues = [...otpValues];
        newValues[index - 1] = "";
        setOtpValues(newValues);
        otpInputsRef.current[index - 1].focus();
      } else {
        // Just clear current input
        const newValues = [...otpValues];
        newValues[index] = "";
        setOtpValues(newValues);
      }
    }
  };

  // Support pasting full 6-digit code
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const codeArray = pastedData.split("");
      setOtpValues(codeArray);
      otpInputsRef.current[5].focus();
    }
  };

  // Trigger login verification
  const handleOtpVerify = async (e) => {
    if (e) e.preventDefault();
    const code = otpValues.join("");
    if (code.length < 6 || !/^\d{6}$/.test(code)) {
      addToast({
        title: "Invalid Code",
        message: "Please enter a valid 6-digit numeric verification code.",
        type: "error"
      });
      return;
    }

    setIsVerifying(true);

    try {
      const session = await authApi.verifyLoginOtp({ otpToken, code });
      loginUser(session.customer, { silent: true });
      navigate("/");
      addToast({
        title: "Login Successful",
        message: `Welcome back, ${session.customer.name || session.customer.email}!`,
        type: "cart"
      });
    } catch (error) {
      console.error("Error verifying login OTP:", error);
      const errMsg = error.response?.data?.message || "Invalid or expired verification code.";
      addToast({
        title: "Verification Failed",
        message: errMsg,
        type: "error"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Automatically trigger verification when last digit is typed
  useEffect(() => {
    const code = otpValues.join("");
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      handleOtpVerify();
    }
  }, [otpValues]);

  // Resend OTP code action
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsSending(true);
    try {
      const data = await authApi.requestLoginOtp({ email });
      const token = data?.otpToken || data;
      setOtpToken(token);
      setResendTimer(30);
      setOtpValues(["", "", "", "", "", ""]);
      addToast({
        title: "Code Re-sent",
        message: "A new verification code has been sent successfully.",
        type: "wishlist"
      });
    } catch (error) {
      console.error("Error resending login OTP:", error);
      const errMsg = error.response?.data?.message || "Failed to resend verification code.";
      addToast({
        title: "Resend Failed",
        message: errMsg,
        type: "error"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F7FAFC] flex select-none text-left">
      
      {/* Left Column: Branding and Trust Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B2D4F] text-white flex-col justify-center p-12 relative overflow-hidden">
        {/* Background Decorative cross grids */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] pointer-events-none">
          <Plus className="w-full h-full rotate-45" />
        </div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 opacity-[0.03] pointer-events-none">
          <Plus className="w-full h-full rotate-45" />
        </div>

        {/* Center illustration & Trust Grid */}
        <div className="my-auto max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading font-black text-3xl xl:text-4xl leading-tight">
              Clinical Quality. <br />
              Delivered Fast.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your veterinary partner for bulk supplies, diagnostic essentials, and prescription formulas. Log in to access your clinic profile and wholesale discounts.
            </p>
          </div>

          <div className="flex flex-col gap-5 border-t border-white/10 pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <Truck className="w-5 h-5 text-[#F28C18]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Priority Cold-Chain Shipping</h4>
                <p className="text-xs text-slate-400 mt-0.5">Hygienic delivery matching clinical regulations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-[#F28C18]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">FDA-Registered Laboratories</h4>
                <p className="text-xs text-slate-400 mt-0.5">All products are 100% original and laboratory certified.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <Clock className="w-5 h-5 text-[#F28C18]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Dedicated Clinic Helpdesk</h4>
                <p className="text-xs text-slate-400 mt-0.5">Professional support available 24 hours a day.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Glassmorphism Login Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 relative overflow-hidden">
        {/* Background visual circles */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#0874C9]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#F28C18]/5 blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-white/80 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl flex flex-col gap-6 relative z-10">
          
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0874C9] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Authentication</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#102A43]">
              {step === "email" ? "Welcome Back" : "Enter Verification Code"}
            </h2>
            <p className="text-xs text-[#627D98] mt-1.5 leading-relaxed">
              {step === "email"
                ? "Enter your email address. We will generate a temporary 6-digit code to log you in securely."
                : `We have sent a verification code to your email address: ${email}`}
            </p>
          </div>

          {/* Step 1: Email Form */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {blockedReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                      <ShieldAlert size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
                      <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{blockedReason}</p>
                      <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#627D98]">
                  Clinic or Personal Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#627D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="email"
                    placeholder="dr.smith@clinic.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (blockedReason) {
                        setBlockedReason("");
                        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
                      }
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    className={`w-full bg-[#F7FAFC]/80 border ${
                      emailError ? "border-red-400 focus:ring-red-400" : "border-[#D9E8F2] focus:ring-[#0874C9]"
                    } rounded-2xl pl-10 pr-4 py-3 text-sm text-[#102A43] focus:outline-none focus:ring-2 bg-white transition-all`}
                    required
                  />
                </div>
                {emailError && <span className="text-xs text-red-500 font-medium">{emailError}</span>}
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-[#0874C9] hover:bg-[#F28C18] disabled:bg-[#0874C9]/40 text-white font-bold text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === "otp" && (
            <div className="flex flex-col gap-5">
              
              {/* Back to Email editor */}
              <div className="flex justify-between items-center bg-[#F7FAFC] border border-[#D9E8F2] px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#627D98]">
                <span className="truncate max-w-[200px]">{email}</span>
                <button
                  onClick={() => setStep("email")}
                  className="text-[#0874C9] hover:text-[#F28C18] transition-colors cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              {/* OTP 6-Digit input boxes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#627D98]">
                  6-Digit OTP Code
                </label>
                <div className="flex gap-2 justify-between">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      pattern="\d*"
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-12 bg-white border border-[#D9E8F2] focus:border-[#0874C9] focus:ring-2 focus:ring-[#0874C9] rounded-xl text-center font-heading font-black text-lg text-[#102A43] focus:outline-none transition-all shadow-inner"
                      required
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleOtpVerify}
                disabled={isVerifying}
                className="w-full bg-[#0874C9] hover:bg-[#F28C18] disabled:bg-[#0874C9]/40 text-white font-bold text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              {/* Timer/Resend options */}
              <div className="text-center text-xs font-semibold text-[#627D98] border-t border-[#D9E8F2] pt-4 mt-2">
                {resendTimer > 0 ? (
                  <span>Resend code in <strong className="text-[#102A43]">{resendTimer}s</strong></span>
                ) : (
                  <button
                    onClick={handleResendCode}
                    className="text-[#0874C9] hover:text-[#F28C18] transition-colors cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Quick clinical reassurance badge */}
          <div className="flex items-center gap-2 justify-center text-[10px] text-[#627D98] font-bold border-t border-[#D9E8F2] pt-4 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit Encrypted Clinic Portal</span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
