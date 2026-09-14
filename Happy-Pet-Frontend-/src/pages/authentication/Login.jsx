import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../store/authentication/authContext";
import {
  CUSTOMER_BLOCKED_REASON_KEY,
  CUSTOMER_SESSION_EXPIRED_KEY,
  isUserBlockedError,
} from "../../api/axios";

export default function Login() {
  const { requestLoginOtp, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [otpToken, setOtpToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [blockedReason, setBlockedReason] = useState("");
  const inputRefs = useRef([]);
  const otp = otpDigits.join("");

  useEffect(() => {
    document.title = "Login | Happy PetRx";
    const expired = localStorage.getItem(CUSTOMER_SESSION_EXPIRED_KEY);
    if (expired === "true") {
      localStorage.removeItem(CUSTOMER_SESSION_EXPIRED_KEY);
      toast.error("Session expired. Please login again.");
    }

    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setBlockedReason(reason);
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (blockedReason) setBlockedReason("");
  };

  const requestOtp = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setBlockedReason("");
    setIsSubmitting(true);
    try {
      const data = await requestLoginOtp({ email: normalizedEmail });
      setOtpToken(data.otpToken || data.token || "");
      setEmail(normalizedEmail);
      setStep("otp");
      setCountdown(30);
      setOtpDigits(Array(6).fill(""));
      toast.success("OTP sent to your email.");
    } catch (error) {
      const isBlocked = isUserBlockedError(error);
      const msg = error.response?.data?.message || error.message || "Failed to send OTP.";
      if (isBlocked) {
        setBlockedReason(msg);
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    await requestOtp();
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setBlockedReason("");
    setIsSubmitting(true);
    try {
      await verifyLoginOtp({ otpToken, code: otp });
      toast.success("Welcome back to Happy PetRx!");
      navigate("/");
    } catch (error) {
      const isBlocked = isUserBlockedError(error);
      const msg = error.response?.data?.message || error.message || "Failed to log in.";
      if (isBlocked) {
        setBlockedReason(msg);
        setStep("email");
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextOtpDigits = [...otpDigits];
    nextOtpDigits[index] = nextValue;
    setOtpDigits(nextOtpDigits);
    if (nextValue && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextOtpDigits = Array(6).fill("");
    for (let index = 0; index < 6; index += 1) {
      nextOtpDigits[index] = pasted[index] || "";
    }
    setOtpDigits(nextOtpDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row select-none bg-white">
      <div className="hidden md:flex md:w-[38%] bg-gradient-to-br from-brand-purple via-[#3b003b] to-[#250025] p-12 flex-col justify-between text-brand-cream relative overflow-hidden min-h-screen">
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-peach/15 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-brand-peach/10 rounded-full blur-[90px] pointer-events-none animate-pulse duration-[8000ms]"></div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold bg-white hover:bg-white transition-all duration-200 shadow-sm text-brand-purple mb-8 outline-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>

          <div className="mt-4">
            <Link to="/" className="inline-block group mb-12">
              <span className="font-display font-extrabold text-2xl tracking-tight text-brand-cream group-hover:opacity-90 transition-opacity">
                HappyPet
                <span className="text-brand-peach font-bold font-sans">Rx</span>
              </span>
            </Link>
          </div>

          <div className="space-y-6 mt-8">
            {[
              {
                icon: ShieldCheck,
                title: "Prescription Safety",
                text: "Double-checked by licensed pharmacists and veterinary consultants.",
              },
              {
                icon: Sparkles,
                title: "Loyalty Rewards",
                text: "Refill to earn PetPoints on every prescription, toys and foods.",
              },
              {
                icon: Heart,
                title: "Tailored Pet Care",
                text: "Store custom medical profiles for all your beloved pets in one dashboard.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                  <item.icon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-brand-cream">{item.title}</h3>
                  <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs italic text-brand-cream/80 leading-relaxed">
            "Happy PetRx makes managing Buddy's arthritis medication stress-free."
          </p>
          <p className="text-[10px] font-bold text-brand-peach mt-2 tracking-wide uppercase">
            - Sarah & Buddy
          </p>
        </div>
      </div>

      <div
        className="flex-grow flex flex-col justify-center items-center px-4 sm:px-12 md:px-16 lg:px-24 py-12 relative min-h-screen md:min-h-0"
        style={{
          background: "linear-gradient(135deg, #FFF7EF 0%, #F5EEFC 50%, #FFEBE6 100%)",
        }}
      >
        <div className="absolute top-[-5%] right-[-5%] w-72 sm:w-96 h-72 sm:h-96 bg-brand-peach/15 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-brand-purple/5 rounded-full blur-[90px] pointer-events-none animate-pulse duration-[8000ms]"></div>

        <div className="max-w-md w-full mx-auto relative z-10 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="md:hidden flex justify-between items-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-purple/10 text-[11px] font-bold bg-white/80 hover:bg-white transition-all duration-200 shadow-sm text-brand-purple"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>
            <Link to="/">
              <span className="font-display font-extrabold text-base tracking-tight text-brand-purple">
                HappyPet<span className="text-brand-peach font-bold font-sans">Rx</span>
              </span>
            </Link>
          </div>

          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-purple tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm font-medium text-brand-brown/70 mt-2 leading-relaxed">
              {step === "email"
                ? "Enter your email address to receive a one-time passcode."
                : "Enter the verification code sent to your email."}
            </p>
          </div>

          {blockedReason && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600 flex-shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">Account Blocked</h4>
                  <p className="mt-1 text-xs font-semibold text-red-700">{blockedReason}</p>
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    Please contact{" "}
                    <Link
                      to="/contact"
                      className="underline font-bold text-red-700 hover:text-red-900 transition-colors"
                    >
                      customer support
                    </Link>{" "}
                    to resolve this issue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} noValidate className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-brand-purple/65 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-brand-purple/5"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-purple hover:bg-[#3a0038] text-white font-bold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-5.5 h-5.5 border-3 border-brand-cream border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-bold text-brand-purple/65 uppercase tracking-wider">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtpDigits(Array(6).fill(""));
                      setOtpToken("");
                    }}
                    className="text-xs font-bold text-brand-purple/75 hover:text-brand-purple hover:underline transition-colors cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-xl sm:rounded-2xl text-brand-purple outline-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-brand-purple/5"
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-brand-brown/70 mt-4">
                  We've sent a 6-digit code to{" "}
                  <span className="font-bold text-brand-purple">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-purple hover:bg-[#3a0038] text-white font-bold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-5.5 h-5.5 border-3 border-brand-cream border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify & Log In</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                {countdown > 0 ? (
                  <span className="text-xs font-semibold text-brand-brown/60">
                    Resend code in{" "}
                    <span className="font-bold text-brand-purple">{countdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
