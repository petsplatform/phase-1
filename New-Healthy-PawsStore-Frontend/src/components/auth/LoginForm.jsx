import { motion, useReducedMotion } from "framer-motion";
import { Mail, PawPrint, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestLoginOtp, verifyLoginOtp } from "../../services/authService";
import {
  CUSTOMER_BLOCKED_REASON_KEY,
  AUTH_CHANGE_EVENT,
} from "../../api/client";

function validateEmail(email) {
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Enter a valid email address.";
  return "";
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  useEffect(() => {
    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) setBlockedReason(reason);

    const handleAuthChange = () => {
      const updatedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (updatedReason) {
        setBlockedReason(updatedReason);
        setError("");
        setStep("email");
      } else {
        setBlockedReason("");
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () =>
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  const sendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const data = await requestLoginOtp({ email });
    window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    setBlockedReason("");
    setOtpToken(data.otpToken);
    setOtp("");
    setStep("otp");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === "email") {
        await sendOtp();
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        setError("Enter the 6-digit OTP.");
        return;
      }

      await verifyLoginOtp({ otpToken, code: otp, email, remember });
      window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason("");
      navigate(redirectTo, { replace: true });
    } catch (apiError) {
      const isBlocked =
        apiError?.status === 403 ||
        Boolean(apiError?.payload?.isBlocked) ||
        Boolean(apiError?.response?.data?.isBlocked);

      if (isBlocked) {
        const reason =
          apiError?.payload?.message ||
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Your account has been blocked. Please contact support.";
        window.localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, reason);
        setBlockedReason(reason);
        setError("");
        setStep("email");
      } else {
        window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
        setBlockedReason("");
        setError(apiError.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtp();
    } catch (apiError) {
      setError(apiError.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setOtpToken("");
    setError("");
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, x: -24 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.42 }}
      className="relative overflow-hidden bg-white px-6 py-8 sm:px-9 lg:px-[58px] lg:py-[54px]"
      aria-labelledby="login-title"
    >
      <PawPrint
        className="absolute bottom-16 left-7 text-sage/60"
        size={42}
        fill="currentColor"
        aria-hidden="true"
      />
      <PawPrint
        className="absolute bottom-5 left-[94px] text-sage/60"
        size={52}
        fill="currentColor"
        aria-hidden="true"
      />

      <p className="text-[18px] font-extrabold text-secondaryDark">
        Welcome Back!
      </p>
      <h1
        id="login-title"
        className="mt-5 font-display text-[42px] font-extrabold leading-tight text-textMain sm:text-[46px]"
      >
        Login to Your Account
      </h1>
      <p className="mt-3 max-w-[520px] text-[17px] font-semibold leading-[1.7] text-muted">
        {step === "email"
          ? "Enter your email to receive a secure OTP."
          : "Enter the OTP sent to your email."}
      </p>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="relative z-10 mt-10 grid gap-4"
      >
        {blockedReason && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                <ShieldAlert size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-red-900">
                  Account Blocked
                </h4>
                <p className="text-xs font-sans font-bold text-red-700 mt-0.5">
                  {blockedReason}
                </p>
                <p className="text-[10px] font-sans text-red-600 mt-1">
                  Please contact customer support to resolve this issue.
                </p>
              </div>
            </div>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-[13px] font-extrabold text-textMain">
            Email Address
          </span>
          <span className="relative block">
            <Mail
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-textMain"
              size={20}
            />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (blockedReason) {
                  setBlockedReason("");
                  window.localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
                  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
                }
                setError("");
              }}
              onBlur={() => {
                const emailError = validateEmail(email);
                if (emailError) setError(emailError);
              }}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={step === "otp"}
              className="h-[54px] w-full rounded-xl border border-borderSoft bg-white px-14 text-[15px] font-semibold text-textMain outline-none transition placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage disabled:bg-sageLight"
            />
          </span>
        </label>

        {step === "otp" && (
          <label className="block">
            <span className="mb-2 block text-[13px] font-extrabold text-textMain">
              OTP Code
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="Enter 6-digit OTP"
              className="h-[54px] w-full rounded-xl border border-borderSoft bg-white px-4 text-center text-[18px] font-extrabold tracking-[0.35em] text-textMain outline-none transition placeholder:text-[14px] placeholder:font-semibold placeholder:tracking-normal placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage"
            />
          </label>
        )}

        {step === "otp" && (
          <div className="flex items-center justify-between gap-3 text-[13px] font-extrabold">
            <button
              type="button"
              onClick={changeEmail}
              className="text-muted transition hover:text-secondaryDark"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={resendOtp}
              disabled={loading}
              className="text-secondaryDark transition hover:text-primaryDark disabled:opacity-60"
            >
              Resend OTP
            </button>
          </div>
        )}

        <label className="inline-flex items-center gap-3 text-[14px] font-semibold text-textMain">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-5 rounded border-borderSoft accent-secondaryDark"
          />
          Remember me
        </label>

        {error && (
          <p className="rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={reduceMotion ? undefined : { scale: 1.01, y: -1 }}
          className="mt-2 inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-secondaryDark to-primaryDark text-[17px] font-extrabold text-white shadow-card transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <ShieldCheck size={20} />
          )}
          {loading
            ? step === "email"
              ? "Sending OTP..."
              : "Verifying..."
            : step === "email"
              ? "Send OTP"
              : "Login"}
        </motion.button>
      </form>
    </motion.section>
  );
}
