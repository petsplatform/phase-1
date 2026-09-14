import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, ShieldAlert, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { loginPageData } from "../../data/authentication";
import {
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_EXPIRED_KEY,
  requestLoginOtpApi,
  verifyLoginOtpApi,
} from "../../helper/axiosInstance";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth();

  const [phase, setPhase] = useState("email");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState("");
  const otpInputsRef = useRef([]);

  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const expired = localStorage.getItem(CUSTOMER_SESSION_EXPIRED_KEY);
    if (expired === "true") {
      localStorage.removeItem(CUSTOMER_SESSION_EXPIRED_KEY);
      toast.error("Session expired. Please log in again.");
    }

    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason(reason);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && phase !== "success") {
      navigate("/");
    }
  }, [isLoggedIn, navigate, phase]);

  useEffect(() => {
    let timer;
    if (phase === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [phase, countdown]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      return;
    }
    if (trimmedEmail.length > 100) {
      setEmailError("Email must be 100 characters or fewer");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (blockedReason) setBlockedReason("");
    setIsLoading(true);
    requestLoginOtpApi({ email })
      .then((res) => {
        setIsLoading(false);
        const token = res?.data?.otpToken || res?.otpToken || res?.data?.token || res?.token;
        setOtpToken(token || "");
        setPhase("otp");
        setCountdown(30);
        setCanResend(false);
        setBlockedReason("");
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        toast.success(res?.message || "Verification code sent to " + email);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Failed to request OTP:", err);
        const isBlocked =
          err?.response?.status === 403 ||
          Boolean(err?.response?.data?.isBlocked) ||
          (typeof err === "string" && err.toLowerCase().includes("blocked"));
        const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Failed to send verification code.");
        if (isBlocked) {
          setBlockedReason(msg);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
          toast.error(msg);
        } else {
          setEmailError(msg || "Failed to send verification code. Please try again.");
        }
      });
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputsRef.current[index - 1].focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasteData)) return;
    const pasteDigits = pasteData.slice(0, 6).split("");
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (pasteDigits[i]) newOtp[i] = pasteDigits[i];
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pasteDigits.length - 1, 5);
    if (otpInputsRef.current[focusIndex]) {
      otpInputsRef.current[focusIndex].focus();
    }
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    verifyLoginOtpApi({ otpToken, code: otpCode })
      .then(async (res) => {
        const token = res?.data?.token || res?.token || res?.data?.accessToken || res?.accessToken;
        if (!token) {
          throw new Error("Login verification did not return an authentication token.");
        }
        await login(email, token);
        setIsLoading(false);
        setPhase("success");
        toast.success("Verification successful!");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Verification failed:", err);
        const isBlocked =
          err?.response?.status === 403 ||
          Boolean(err?.response?.data?.isBlocked) ||
          (typeof err === "string" && err.toLowerCase().includes("blocked"));
        const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Invalid verification code.");
        if (isBlocked) {
          setBlockedReason(msg);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
          toast.error(msg);
        } else {
          toast.error(msg || "Invalid verification code. Please try again.");
        }
      });
  };

  const handleResend = () => {
    if (!canResend) return;
    if (blockedReason) {
      toast.error("Your account is blocked. Please contact support.");
      return;
    }
    setIsLoading(true);
    requestLoginOtpApi({ email })
      .then((res) => {
        setIsLoading(false);
        const token = res?.data?.otpToken || res?.otpToken || res?.data?.token || res?.token;
        setOtpToken(token || "");
        setOtp(["", "", "", "", "", ""]);
        setCountdown(30);
        setCanResend(false);
        toast.success(res?.message || "New verification code sent!");
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Failed to resend OTP:", err);
        const isBlocked =
          err?.response?.status === 403 ||
          Boolean(err?.response?.data?.isBlocked) ||
          (typeof err === "string" && err.toLowerCase().includes("blocked"));
        const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Failed to resend verification code.");
        if (isBlocked) {
          setBlockedReason(msg);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
          toast.error(msg);
        } else {
          toast.error(msg || "Failed to resend verification code.");
        }
      });
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[520px] flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_25px_60px_rgba(15,45,82,0.06)] border border-slate-100/70 transition-all duration-300">
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            {blockedReason && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-left shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-rose-100 p-2 text-rose-600 shrink-0">
                    <ShieldAlert className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900">Account Blocked</h4>
                    <p className="mt-1 text-xs font-bold text-rose-700">{blockedReason}</p>
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      Please contact customer support to resolve this issue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 1: Email Input */}
            {phase === "email" && (
              <div className="flex flex-col">
                <div className="text-center mb-5">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-mint text-primary-green mb-3">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-deep-navy tracking-tight sm:text-3xl font-display">
                    {loginPageData.title}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-semibold text-deep-navy/50 leading-relaxed">
                    {loginPageData.subtitle}
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-black text-deep-navy/80 mb-1.5">
                      {loginPageData.emailLabel}
                    </label>
                    <div className="relative rounded-2xl shadow-xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Mail className="h-5 w-5 text-deep-navy/30" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        maxLength={100}
                        value={email}
                        onChange={user?.email ? undefined : (e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError("");
                          if (blockedReason) setBlockedReason("");
                        }}
                        readOnly={!!user?.email}
                        placeholder={loginPageData.emailPlaceholder}
                        className={`block w-full rounded-2xl border bg-[#f8f9fb] py-3 pl-11 pr-4 text-sm font-bold text-deep-navy placeholder:text-deep-navy/30 outline-none transition-all duration-200 ${
                          user?.email
                            ? "cursor-default select-none"
                            : "focus:border-primary-green focus:bg-white focus:ring-2 focus:ring-primary-green/10"
                        } ${
                          emailError ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/10" : "border-deep-navy/8"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs font-bold text-rose-500 flex items-center gap-1 px-1">
                        <span>⚠️</span> {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 rounded-2xl bg-primary-green py-3 px-4 text-sm sm:text-base font-black text-white hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-primary-green/20 disabled:opacity-75 transition-all shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {loginPageData.sendCodeLoading}
                      </>
                    ) : (
                      loginPageData.sendCodeButton
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Phase 2: OTP Verification */}
            {phase === "otp" && (
              <div className="flex flex-col">
                <button
                  onClick={() => setPhase("email")}
                  className="self-start flex items-center gap-1.5 text-xs font-extrabold text-deep-navy/50 hover:text-deep-navy mb-4 transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  Change Email
                </button>

                <div className="text-center mb-5">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-mint text-primary-green mb-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-deep-navy tracking-tight sm:text-3xl font-display">
                    {loginPageData.otpTitle}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-semibold text-deep-navy/50 leading-relaxed">
                    {loginPageData.otpSubtitle}{" "}
                    <strong className="text-deep-navy font-bold">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-center text-sm font-black text-deep-navy/80 mb-3">
                      {loginPageData.otpLabel}
                    </label>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-xs mx-auto">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-full aspect-square text-center text-lg sm:text-xl font-black text-deep-navy bg-[#f8f9fb] border border-deep-navy/8 rounded-xl outline-none focus:border-primary-green focus:bg-white focus:ring-2 focus:ring-primary-green/10 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.join("").length < 6}
                    className="w-full flex justify-center items-center gap-2 rounded-2xl bg-primary-green py-3 px-4 text-sm sm:text-base font-black text-white hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-primary-green/20 disabled:opacity-60 disabled:hover:bg-primary-green disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {loginPageData.verifyLoading}
                      </>
                    ) : (
                      loginPageData.verifyButton
                    )}
                  </button>

                  <div className="text-center text-xs font-extrabold text-deep-navy/55 mt-3">
                    <span>{loginPageData.resendText} </span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-primary-green hover:underline cursor-pointer focus:outline-none"
                      >
                        {loginPageData.resendAction}
                      </button>
                    ) : (
                      <span className="text-deep-navy/40">
                        {loginPageData.resendCountdown.replace("{seconds}", countdown)}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Phase 3: Login Success */}
            {phase === "success" && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-mint text-primary-green mb-4 animate-bounce-slow shadow-sm">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-deep-navy tracking-tight sm:text-3xl font-display">
                  {loginPageData.successTitle}
                </h2>
                <p className="mt-2 text-sm font-semibold text-deep-navy/50 max-w-xs leading-relaxed">
                  Welcome back, <strong className="text-deep-navy font-bold">{email.split("@")[0]}</strong>!
                  <br />
                  Redirecting you to the home page...
                </p>
                <div className="mt-5 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-primary-green animate-spin" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
