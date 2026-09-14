/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import {
  HeartIcon,
  PackageIcon,
  TruckIcon,
} from "../components/common/HeaderIcons";
import dogImage from "../assets/logo/dog.png";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";

const features = [
  {
    title: "Quality Products",
    text: "Best quality products for your pets",
    icon: PackageIcon,
  },
  {
    title: "Fast Delivery",
    text: "Quick and reliable delivery at your door",
    icon: TruckIcon,
  },
  {
    title: "Happy Pets",
    text: "Because your pets deserve the best care",
    icon: HeartIcon,
  },
];

const PawPattern = () => (
  <div
    className="pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <span className="absolute left-[8%] top-[12%] h-8 w-8 rounded-full bg-[#d9aa3d]/15" />
    <span className="absolute right-[18%] top-[20%] h-10 w-10 rounded-full bg-[#17345f]/10" />
    <span className="absolute bottom-[24%] left-[28%] h-10 w-10 rounded-full bg-[#d9aa3d]/15" />
    <span className="absolute bottom-[-80px] right-[-70px] h-48 w-48 rounded-full bg-[#17345f]/10" />
    <span className="absolute bottom-[-55px] left-[-45px] h-40 w-40 rounded-full bg-[#d9aa3d]/15" />
  </div>
);

const AuthFeature = ({ title, text, icon: Icon }) => (
  <div className="flex items-start gap-4">
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
      <Icon className="h-5 w-5" />
    </span>
    <span>
      <span className="block text-sm font-extrabold text-[#122a50]">
        {title}
      </span>
      <span className="mt-1 block max-w-[180px] text-xs font-medium leading-5 text-[#122a50b2]">
        {text}
      </span>
    </span>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [step, setStep] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const navigate = useNavigate();
  const { login, checkLoginMethod, requestLoginOtp, verifyLoginOtp } = useAuth();
  const { showToast } = useToast();

  const [blockedReason, setBlockedReason] = useState("");

  useEffect(() => {
    if (rateLimitSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setRateLimitSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rateLimitSeconds]);

  useEffect(() => {
    if (rateLimitSeconds === 0 && blockedReason.startsWith("Too many attempts")) {
      setBlockedReason("");
    }
  }, [rateLimitSeconds, blockedReason]);

  const formatRateLimitMessage = (seconds) => {
    if (seconds <= 0) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const duration = minutes > 0
      ? `${minutes} minute${minutes === 1 ? "" : "s"}${remainingSeconds ? ` ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}` : ""}`
      : `${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
    return `Too many attempts. Please try again in ${duration}.`;
  };

  useEffect(() => {
    document.title = "Login | Best Vet Care";
    if (localStorage.getItem("petcare_session_expired") === "true") {
      localStorage.removeItem("petcare_session_expired");
      showToast("Session expired. Please login again.", "error");
    }
    const reason = localStorage.getItem("petcare_blocked_reason");
    if (reason) {
      localStorage.removeItem("petcare_blocked_reason");
      setBlockedReason(reason);
    }
  }, [showToast]);

  const validateEmailStep = () => {
    const val = email.trim();
    if (!val) {
      setEmailError("Email address is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    if (val.length > 100) {
      setEmailError("Email address must not exceed 100 characters.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateOtpStep = () => {
    const val = otp.replace(/\D/g, "");
    if (!val) {
      setOtpError("OTP code is required.");
      return false;
    }
    if (val.length !== 6) {
      setOtpError("OTP code must be exactly 6 digits.");
      return false;
    }
    setOtpError("");
    return true;
  };

  const validatePassword = (value = password) => {
    if (!value) {
      setPasswordError("Password is required.");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateNewPassword = () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      return false;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError("Password must include uppercase, lowercase, and number characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (rateLimitSeconds > 0) return;
    setError("");
    setBlockedReason("");

    if (step === "email") {
      if (!validateEmailStep()) return;
    } else if (step === "otp" || step === "reset") {
      if (!validateOtpStep()) return;
      if (step === "reset" && !validateNewPassword()) return;
    } else if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      if (step === "email") {
        const method = await checkLoginMethod({ email });
        if (method.hasPassword) {
          setStep("password");
        } else {
          await sendOtp();
        }
        return;
      }

      if (step === "password") {
        await login({ email, password });
        navigate("/");
        return;
      }

      if (step === "reset") {
        await authApi.resetPassword({ otpToken, code: otp, password: newPassword, confirmPassword });
        showToast("Password updated. Please login with your new password.");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpToken("");
        setStep("password");
        return;
      }

      await verifyLoginOtp({ otpToken, code: otp });
      navigate("/");
    } catch (err) {
      const isBlocked = err.response?.data?.isBlocked;
      const retryAfterSeconds = Number(err.response?.data?.retryAfterSeconds || 0);
      const msg = err.response?.data?.message || err.message || "Login failed";
      if (retryAfterSeconds > 0) {
        setRateLimitSeconds(retryAfterSeconds);
        setBlockedReason(msg);
      } else if (isBlocked) {
        setBlockedReason(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    const data = await requestLoginOtp({ email });
    setOtpToken(data.otpToken);
    setOtp("");
    setStep("otp");
    setOtpError("");
  };

  const sendResetOtp = async () => {
    if (!validateEmailStep()) return;
    setError("");
    setBlockedReason("");
    setLoading(true);
    try {
      const data = await authApi.forgotPassword({ email });
      setOtpToken(data.otpToken);
      setOtp("");
      setStep("reset");
      setOtpError("");
      setPasswordError("");
    } catch (err) {
      const isBlocked = err.response?.data?.isBlocked;
      const retryAfterSeconds = Number(err.response?.data?.retryAfterSeconds || 0);
      const msg = err.response?.data?.message || err.message || "Could not send reset code";
      if (retryAfterSeconds > 0) {
        setRateLimitSeconds(retryAfterSeconds);
        setBlockedReason(msg);
      } else if (isBlocked) setBlockedReason(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setBlockedReason("");
    setLoading(true);
    try {
      await sendOtp();
    } catch (err) {
      const isBlocked = err.response?.data?.isBlocked;
      const retryAfterSeconds = Number(err.response?.data?.retryAfterSeconds || 0);
      const msg = err.response?.data?.message || err.message || "Could not send OTP";
      if (retryAfterSeconds > 0) {
        setRateLimitSeconds(retryAfterSeconds);
        setBlockedReason(msg);
      } else if (isBlocked) setBlockedReason(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setOtpToken("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEmailError("");
    setOtpError("");
    setPasswordError("");
  };

  const handleSocialError = (message) => {
    setBlockedReason("");
    setEmailError("");
    setPasswordError("");
    setOtpError("");
    setError(message || "");
  };

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      <Header />
      <main className="relative overflow-hidden px-4 py-10 sm:px-5 lg:px-[22px]">
        <PawPattern />
        <section className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1fr_460px]">
          <div className="order-2 lg:order-1 text-left">
            <p className="text-[34px] font-extrabold leading-tight text-[#d9aa3d] sm:text-[44px]">
              Welcome <span className="text-[#122a50]">Back!</span>
            </p>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-[#122a50b2]">
              Login to your account and continue shopping your favorite pet
              products.
            </p>
            <div className="mt-10 space-y-6">
              {features.map((feature) => (
                <AuthFeature key={feature.title} {...feature} />
              ))}
            </div>
            <img
              src={dogImage}
              alt="Happy dog and cat"
              className="mt-10 hidden max-h-[320px] w-auto object-contain md:block"
            />
          </div>

          <section className="order-1 rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_20px_70px_rgba(18,42,80,0.12)] sm:p-8 lg:order-2">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-[#122a50]">
                Login to Your Account
              </h1>
              <p className="mt-2 text-sm font-medium text-[#122a50b2]">
                {step === "email"
                  ? "Enter your email to continue"
                  : step === "password"
                    ? "Enter your password or continue with a secure code"
                    : step === "reset"
                      ? "Enter the reset code and create a new password"
                      : "Enter the OTP sent to your email"}
              </p>
            </div>

            {(blockedReason || rateLimitSeconds > 0) && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left">
                <p className="text-sm font-extrabold text-red-700">{rateLimitSeconds > 0 ? "Rate limit reached" : "Account Blocked"}</p>
                <p className="mt-1 text-sm font-semibold text-red-600">
                  {rateLimitSeconds > 0 ? formatRateLimitMessage(rateLimitSeconds) : blockedReason}
                </p>
                {rateLimitSeconds === 0 && <p className="mt-1 text-xs font-medium text-red-500">Please contact support to resolve this issue.</p>}
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 text-left">
                {error}
              </p>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Email Address *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Valid email</span>
                </div>
                <input
                  type="email"
                  value={email}
                  maxLength={100}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="Enter your email"
                  disabled={step !== "email"}
                  className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                    emailError ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                />
                {emailError && <p className="mt-1 text-xs font-semibold text-red-600">{emailError}</p>}
              </label>

              {step === "password" && (
                <label className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#122a50]">Password *</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-[10px] font-semibold text-[#d9aa3d] hover:text-[#17345f]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    placeholder="Enter your password"
                    className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                      passwordError ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  {passwordError && <p className="mt-1 text-xs font-semibold text-red-600">{passwordError}</p>}
                </label>
              )}

              {(step === "otp" || step === "reset") && (
                <label className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#122a50]">OTP Code *</span>
                    <span className="text-[10px] font-semibold text-[#122a50]/50">Exact 6 digits</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                    }}
                    placeholder="Enter 6-digit OTP"
                    className={`h-12 w-full rounded-lg border bg-white px-4 text-center text-lg font-extrabold tracking-[0.35em] text-[#122a50] outline-none transition-all placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                      otpError ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  {otpError && <p className="mt-1 text-xs font-semibold text-red-600 text-center">{otpError}</p>}
                </label>
              )}

              {step === "reset" && (
                <div className="space-y-4">
                  <label className="block text-left">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#122a50]">New Password *</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-[10px] font-semibold text-[#d9aa3d] hover:text-[#17345f]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Create a new password"
                      className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                        passwordError ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                  </label>
                  <label className="block text-left">
                    <span className="text-sm font-extrabold text-[#122a50]">Confirm Password *</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Confirm new password"
                      className={`mt-1 h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                        passwordError ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                  </label>
                  {passwordError && <p className="text-xs font-semibold text-red-600">{passwordError}</p>}
                </div>
              )}

              {(step === "otp" || step === "reset") && (
                <div className="flex items-center justify-between gap-3 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={changeEmail}
                    className="text-[#122a50b2] transition-colors hover:text-[#17345f] cursor-pointer"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={step === "reset" ? sendResetOtp : resendOtp}
                    disabled={loading}
                    className="text-[#d9aa3d] transition-colors hover:text-[#17345f] disabled:opacity-60 cursor-pointer"
                  >
                    Resend code
                  </button>
                </div>
              )}

              {step === "password" && (
                <div className="flex items-center justify-between gap-3 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={changeEmail}
                    className="text-[#122a50b2] transition-colors hover:text-[#17345f] cursor-pointer"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={sendResetOtp}
                    disabled={loading}
                    className="text-[#d9aa3d] transition-colors hover:text-[#17345f] disabled:opacity-60 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || rateLimitSeconds > 0}
                className="h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? step === "email" ? "Checking..." : step === "password" ? "Signing in..." : step === "reset" ? "Updating..." : "Verifying..."
                  : step === "email" ? "Continue" : step === "password" ? "Continue" : step === "reset" ? "Reset Password" : "Login"}
              </button>
              {step === "password" && (
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white text-sm font-extrabold text-[#17345f] transition-colors hover:border-[#d9aa3d] hover:text-[#d9aa3d] disabled:opacity-60"
                >
                  Continue with code
                </button>
              )}
            </form>

            <div className="mt-6">
              <SocialAuthButtons mode="login" disabled={loading} onError={handleSocialError} />
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
